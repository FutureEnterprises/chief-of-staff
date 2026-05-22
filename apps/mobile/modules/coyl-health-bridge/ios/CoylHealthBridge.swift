//
//  CoylHealthBridge.swift
//  CoylHealthBridge (Expo Module)
//
//  React Native ↔ HealthKit / CoreMotion / CoreLocation /
//  DeviceActivity bridge for COYL's "Layer 1" passive-signals
//  substrate. Exposes:
//
//    requestPermissions(scopes)          → { granted, denied }
//    readHRVSamples(start, end)          → [ { value, startDate, endDate } ]
//    readSedentaryMinutes(now)           → Int (contiguous mins ending at now)
//    readScreenTimeCategoryUsage(start)  → { social, productivity, ... } (iOS 17+)
//    setupGeofences(home?, kitchen?)     → void
//    currentLocationKind()               → 'home' | 'kitchen' | 'work' | 'unknown'
//    flushPendingSamples()               → { posted, failed }
//
//  Privacy contract:
//    - Raw GPS is NEVER persisted. CoreLocation hands us a coordinate;
//      we resolve it to a region kind (home / kitchen / work / unknown)
//      and discard the coordinate before returning to JS.
//    - HealthKit samples are read on demand inside a session window and
//      returned to JS as plain numbers. We don't keep an HKHealthStore
//      cache around.
//    - The auth token used by flushPendingSamples() is read from the
//      shared App Group (group.com.coyl.shared), the same suite the
//      Live Activity module writes Clerk JWTs into. We never accept
//      a token over the bridge.
//
//  iOS version gates:
//    - HealthKit / CoreMotion / CoreLocation: iOS 16.1+ (project min).
//    - DeviceActivityCenter category usage: iOS 17.0+. Older devices
//      receive an empty dictionary from readScreenTimeCategoryUsage —
//      that's the explicit contract.
//

import ActivityKit
import CoreLocation
import CoreMotion
import ExpoModulesCore
import Foundation
import HealthKit

#if canImport(DeviceActivity) && canImport(FamilyControls) && canImport(ManagedSettings)
import DeviceActivity
import FamilyControls
import ManagedSettings
#endif

// MARK: - Shared state
//
// HKHealthStore is documented as cheap to construct, but per the docs
// "your app should create only one instance and store it for later use."
// We hold it as a property so repeated HRV reads don't re-handshake
// with the daemon.

private enum BridgeError {
    static let unauthorized = "HEALTH_UNAUTHORIZED"
    static let unavailable = "HEALTH_UNAVAILABLE"
    static let invalidArgs = "INVALID_ARGUMENTS"
    static let motionDenied = "MOTION_DENIED"
    static let locationDenied = "LOCATION_DENIED"
    static let screenTimeUnsupported = "SCREEN_TIME_UNSUPPORTED"
    static let networkFailed = "NETWORK_FAILED"
    static let noAuthToken = "NO_AUTH_TOKEN"
}

// MARK: - Geofence storage
//
// We need to know which CLCircularRegion identifier corresponds to
// which "kind" so currentLocationKind() can answer without re-asking
// the user. We persist this map into the App Group so it survives
// app restarts and is the same value the user opted into.

private struct GeofenceConfig: Codable {
    var homeIdentifier: String?
    var kitchenIdentifier: String?
}

private let APP_GROUP_ID = "group.com.coyl.shared"
private let GEOFENCE_KEY = "coyl.geofences"
private let AUTH_TOKEN_KEY = "coyl.authToken"
private let PENDING_SAMPLES_KEY = "coyl.pendingSamples"
private let INGEST_URL = "https://coyl.ai/api/v1/health/ingest"

// MARK: - LocationDelegate
//
// A tiny CLLocationManagerDelegate kept alive by the module instance.
// Stores the most recently inferred "kind" so currentLocationKind()
// can resolve synchronously without re-firing a GPS request.

private final class LocationDelegate: NSObject, CLLocationManagerDelegate {
    /// The most recent region the device entered. Cleared on exit so
    /// "unknown" is the honest answer when the user is in neither
    /// home nor kitchen.
    var lastEnteredKind: String = "unknown"

    func locationManager(
        _ manager: CLLocationManager,
        didEnterRegion region: CLRegion
    ) {
        if let kind = kindFor(identifier: region.identifier) {
            self.lastEnteredKind = kind
        }
    }

    func locationManager(
        _ manager: CLLocationManager,
        didExitRegion region: CLRegion
    ) {
        // Only clear if the region we're exiting matches what we think
        // we're in — otherwise a stale "exit" callback could blank a
        // valid current location.
        if let kind = kindFor(identifier: region.identifier),
           kind == self.lastEnteredKind {
            self.lastEnteredKind = "unknown"
        }
    }

    private func kindFor(identifier: String) -> String? {
        let cfg = readGeofenceConfig()
        if cfg.homeIdentifier == identifier { return "home" }
        if cfg.kitchenIdentifier == identifier { return "kitchen" }
        return nil
    }
}

private func readGeofenceConfig() -> GeofenceConfig {
    guard let defaults = UserDefaults(suiteName: APP_GROUP_ID),
          let data = defaults.data(forKey: GEOFENCE_KEY),
          let decoded = try? JSONDecoder().decode(GeofenceConfig.self, from: data)
    else { return GeofenceConfig() }
    return decoded
}

private func writeGeofenceConfig(_ cfg: GeofenceConfig) {
    guard let defaults = UserDefaults(suiteName: APP_GROUP_ID) else { return }
    if let data = try? JSONEncoder().encode(cfg) {
        defaults.set(data, forKey: GEOFENCE_KEY)
        defaults.synchronize()
    }
}

// MARK: - Module

public class CoylHealthBridge: Module {
    // Hold these as properties so:
    //   - HKHealthStore: don't re-create per call.
    //   - CMMotionActivityManager: ditto, plus its delegate retention.
    //   - CLLocationManager: must outlive any single function call
    //     because monitoring is asynchronous.
    private let healthStore = HKHealthStore()
    private let motionManager = CMMotionActivityManager()
    private let locationManager = CLLocationManager()
    private let locationDelegate = LocationDelegate()

    public func definition() -> ModuleDefinition {
        Name("CoylHealthBridge")

        OnCreate {
            self.locationManager.delegate = self.locationDelegate
            // Significant-change accuracy is enough for geofence enter/
            // exit — we never need lane-level precision and the lower
            // accuracy saves battery dramatically.
            self.locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        }

        // MARK: requestPermissions
        //
        // The JS layer passes an array of scope strings. We map each
        // to its native authorization request, run them concurrently,
        // and resolve with a partitioned { granted, denied } list so
        // the UI can pinpoint exactly which permission to re-prompt.
        AsyncFunction("requestPermissions") { (scopes: [String], promise: Promise) in
            Task {
                var granted: [String] = []
                var denied: [String] = []

                for scope in scopes {
                    let ok = await self.requestSingle(scope: scope)
                    if ok { granted.append(scope) } else { denied.append(scope) }
                }
                promise.resolve(["granted": granted, "denied": denied])
            }
        }

        // MARK: readHRVSamples
        //
        // Returns the raw HRV SDNN samples in the requested window as
        // [{ value: Double (ms), startDate: ISO, endDate: ISO }].
        //
        // Note: HRV in HealthKit is HKQuantityTypeIdentifierHeartRateVariabilitySDNN
        // and its unit is milliseconds (not ms² — the JS comment header
        // in the task spec is approximate). We return ms here, the unit
        // the Web `/health/ingest` consumer expects.
        AsyncFunction("readHRVSamples") {
            (startDate: String, endDate: String, promise: Promise) in
            guard HKHealthStore.isHealthDataAvailable() else {
                promise.reject(BridgeError.unavailable, "HealthKit not available on this device.")
                return
            }
            guard let start = isoDate(startDate),
                  let end = isoDate(endDate),
                  let hrvType = HKObjectType.quantityType(
                    forIdentifier: .heartRateVariabilitySDNN
                  ) else {
                promise.reject(BridgeError.invalidArgs, "Invalid start/end or HRV type unavailable.")
                return
            }

            let predicate = HKQuery.predicateForSamples(
                withStart: start, end: end, options: .strictStartDate
            )
            let query = HKSampleQuery(
                sampleType: hrvType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(
                    key: HKSampleSortIdentifierStartDate, ascending: true
                )]
            ) { _, samples, err in
                if let err = err {
                    promise.reject(BridgeError.unavailable, err.localizedDescription)
                    return
                }
                let unit = HKUnit.secondUnit(with: .milli)
                let out: [[String: Any]] = (samples as? [HKQuantitySample] ?? []).map { s in
                    [
                        "value": s.quantity.doubleValue(for: unit),
                        "startDate": isoString(s.startDate),
                        "endDate": isoString(s.endDate),
                    ]
                }
                promise.resolve(out)
            }
            self.healthStore.execute(query)
        }

        // MARK: readSedentaryMinutes
        //
        // Walks backwards from `now` through CMMotionActivity events
        // and counts contiguous minutes where the user was stationary
        // OR unknown (the latter is what Apple reports when the device
        // hasn't moved meaningfully — same intent for our purposes).
        // Returns 0 on permission denial / unavailability rather than
        // rejecting; the predictive model treats 0 as "no signal" and
        // we don't want one missing permission to wedge the batch.
        AsyncFunction("readSedentaryMinutes") { (now: String, promise: Promise) in
            guard CMMotionActivityManager.isActivityAvailable() else {
                promise.resolve(0)
                return
            }
            guard let end = isoDate(now) else {
                promise.reject(BridgeError.invalidArgs, "now must be ISO8601.")
                return
            }
            // Look back at most 4 hours — anything beyond that the
            // motion daemon may not have retained anyway, and a 4h
            // sedentary streak is already "go for a walk" territory.
            let start = end.addingTimeInterval(-4 * 60 * 60)

            self.motionManager.queryActivityStarting(
                from: start, to: end, to: .main
            ) { activities, err in
                if err != nil || activities == nil {
                    promise.resolve(0)
                    return
                }
                // Walk newest-to-oldest. Count contiguous minutes
                // where !walking && !running && !cycling && !automotive.
                // We treat "stationary" and "unknown" as sedentary,
                // since CMMotionActivity emits "unknown" when nothing
                // changes for a while.
                let sorted = (activities ?? []).sorted {
                    $0.startDate > $1.startDate
                }
                var minutes = 0
                var cursor = end
                for a in sorted {
                    if a.startDate > cursor { continue }
                    let isMoving = a.walking || a.running || a.cycling || a.automotive
                    if isMoving { break }
                    let chunk = cursor.timeIntervalSince(a.startDate)
                    minutes += Int(chunk / 60.0)
                    cursor = a.startDate
                }
                promise.resolve(minutes)
            }
        }

        // MARK: readScreenTimeCategoryUsage
        //
        // iOS 17.0+ exposes DeviceActivityReport. iOS 16.x does not give
        // third-party apps category-level usage counts at all — we
        // return an empty dictionary in that case rather than rejecting,
        // because the predictive model's job is to handle missing
        // signals gracefully.
        //
        // What we return when available is a stub map shaped like
        //   { social: Int, productivity: Int, entertainment: Int, ... }
        // populated by the DeviceActivityCenter monitor the user
        // authorizes once. Until that monitor has emitted data, the
        // dictionary is empty. The Web side already tolerates that.
        AsyncFunction("readScreenTimeCategoryUsage") {
            (startDate: String, promise: Promise) in
            #if canImport(DeviceActivity) && canImport(FamilyControls)
            if #available(iOS 17.0, *) {
                Task {
                    let center = AuthorizationCenter.shared
                    do {
                        try await center.requestAuthorization(for: .individual)
                    } catch {
                        promise.resolve([String: Int]())
                        return
                    }
                    // DeviceActivityReport requires a Report Extension
                    // target to actually surface category buckets to
                    // the host app. Without that extension we cannot
                    // read counts from this process — Apple's privacy
                    // model is intentional. We return an empty map
                    // and the founder wires the Report extension in
                    // a follow-up build.
                    //
                    // TODO(founder): Add a DeviceActivityReport
                    // extension target in Xcode so this returns real
                    // category counts. Until then we return {}.
                    promise.resolve([String: Int]())
                }
            } else {
                promise.resolve([String: Int]())
            }
            #else
            promise.resolve([String: Int]())
            #endif
            _ = startDate // silence unused warning when frameworks absent
        }

        // MARK: setupGeofences
        //
        // Registers up to two CLCircularRegion monitors. Each takes
        // { lat, lng, radius? }. radius defaults to 50m (the documented
        // minimum for reliable enter/exit notifications on iOS).
        //
        // We persist a { homeIdentifier, kitchenIdentifier } map into
        // the App Group so the delegate can decode incoming events.
        // If the user already had a region for a kind, we stop monitoring
        // it before starting the new one — otherwise iOS silently
        // ignores duplicate identifiers above the 20-region cap.
        AsyncFunction("setupGeofences") {
            (home: [String: Any]?, kitchen: [String: Any]?, promise: Promise) in

            var cfg = readGeofenceConfig()

            // Tear down existing regions to avoid the 20-region cap.
            for region in self.locationManager.monitoredRegions {
                if region.identifier == cfg.homeIdentifier
                    || region.identifier == cfg.kitchenIdentifier {
                    self.locationManager.stopMonitoring(for: region)
                }
            }

            func register(_ kind: String, _ dict: [String: Any]?) -> String? {
                guard let dict = dict,
                      let lat = dict["lat"] as? Double,
                      let lng = dict["lng"] as? Double else { return nil }
                let radius = (dict["radius"] as? Double) ?? 50.0
                let identifier = "coyl.geofence.\(kind).\(UUID().uuidString)"
                let region = CLCircularRegion(
                    center: CLLocationCoordinate2D(latitude: lat, longitude: lng),
                    radius: max(radius, 50.0),
                    identifier: identifier
                )
                region.notifyOnEntry = true
                region.notifyOnExit = true
                self.locationManager.startMonitoring(for: region)
                return identifier
            }

            cfg.homeIdentifier = register("home", home)
            cfg.kitchenIdentifier = register("kitchen", kitchen)
            writeGeofenceConfig(cfg)
            promise.resolve(nil)
        }

        // MARK: currentLocationKind
        //
        // Returns the last entered geofence kind, or "unknown" if the
        // user is in neither. We deliberately do NOT request a fresh
        // location reading here — that would prompt for "Always" auth
        // we don't actually need, and it would expose raw GPS to the
        // bridge process.
        AsyncFunction("currentLocationKind") { (promise: Promise) in
            promise.resolve(self.locationDelegate.lastEnteredKind)
        }

        // MARK: flushPendingSamples
        //
        // Reads any samples queued into the App Group's UserDefaults
        // (under PENDING_SAMPLES_KEY), POSTs them to coyl.ai/api/v1/
        // health/ingest with the stored Bearer token, and clears the
        // queue on success.
        //
        // The queue exists so background HealthKit observers (which
        // can fire outside a foreground session) have a place to drop
        // samples. JS callers also use it as a write-through cache —
        // they call this opportunistically when the app foregrounds.
        AsyncFunction("flushPendingSamples") { (promise: Promise) in
            guard let defaults = UserDefaults(suiteName: APP_GROUP_ID) else {
                promise.reject(
                    "APP_GROUP_UNAVAILABLE",
                    "Could not access \(APP_GROUP_ID). Verify entitlement."
                )
                return
            }
            guard let token = defaults.string(forKey: AUTH_TOKEN_KEY),
                  !token.isEmpty else {
                promise.reject(
                    BridgeError.noAuthToken,
                    "No auth token in App Group. Call setAuthToken from JS first."
                )
                return
            }

            let pending: [[String: Any]]
            if let data = defaults.data(forKey: PENDING_SAMPLES_KEY),
               let arr = try? JSONSerialization.jsonObject(with: data)
                as? [[String: Any]] {
                pending = arr
            } else {
                pending = []
            }

            if pending.isEmpty {
                promise.resolve(["posted": 0, "failed": 0])
                return
            }

            // Cap the batch to match the Web side's 500-sample limit.
            let batch = Array(pending.prefix(500))
            let body: [String: Any] = ["samples": batch]

            guard let url = URL(string: INGEST_URL),
                  let payload = try? JSONSerialization.data(withJSONObject: body) else {
                promise.reject(BridgeError.networkFailed, "Bad URL or payload.")
                return
            }

            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            req.httpBody = payload
            req.timeoutInterval = 15

            let task = URLSession.shared.dataTask(with: req) { _, response, err in
                if let err = err {
                    promise.reject(BridgeError.networkFailed, err.localizedDescription)
                    return
                }
                let status = (response as? HTTPURLResponse)?.statusCode ?? 0
                if (200...299).contains(status) {
                    // Drop the posted batch from the front of the queue.
                    let remaining = Array(pending.dropFirst(batch.count))
                    if let data = try? JSONSerialization.data(withJSONObject: remaining) {
                        defaults.set(data, forKey: PENDING_SAMPLES_KEY)
                        defaults.synchronize()
                    }
                    promise.resolve([
                        "posted": batch.count,
                        "failed": 0,
                    ])
                } else {
                    promise.resolve([
                        "posted": 0,
                        "failed": batch.count,
                    ])
                }
            }
            task.resume()
        }
    }

    // MARK: - Helpers

    /// Maps a scope string from JS to a single permission request.
    /// Returns true if granted (or already authorized), false otherwise.
    private func requestSingle(scope: String) async -> Bool {
        switch scope {
        case "health":
            return await requestHealthKit()
        case "motion":
            return await requestMotion()
        case "location":
            return requestLocation()
        case "screen_time":
            return await requestScreenTime()
        default:
            return false
        }
    }

    private func requestHealthKit() async -> Bool {
        guard HKHealthStore.isHealthDataAvailable() else { return false }
        var types: Set<HKObjectType> = []
        let identifiers: [HKQuantityTypeIdentifier] = [
            .heartRateVariabilitySDNN,
            .stepCount,
            .activeEnergyBurned,
        ]
        for id in identifiers {
            if let t = HKObjectType.quantityType(forIdentifier: id) { types.insert(t) }
        }
        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            types.insert(sleep)
        }
        return await withCheckedContinuation { cont in
            self.healthStore.requestAuthorization(toShare: nil, read: types) { ok, _ in
                cont.resume(returning: ok)
            }
        }
    }

    private func requestMotion() async -> Bool {
        guard CMMotionActivityManager.isActivityAvailable() else { return false }
        // CMMotionActivityManager prompts on first query — issue a
        // tiny no-op query to surface the system dialog and read the
        // resulting authorizationStatus.
        let probe = CMMotionActivityManager()
        return await withCheckedContinuation { cont in
            probe.queryActivityStarting(
                from: Date().addingTimeInterval(-60),
                to: Date(),
                to: .main
            ) { _, _ in
                let status = CMMotionActivityManager.authorizationStatus()
                cont.resume(returning: status == .authorized)
            }
        }
    }

    private func requestLocation() -> Bool {
        // requestWhenInUseAuthorization is non-blocking; the user's
        // answer arrives via the delegate. For our purposes "granted"
        // means we already have when-in-use OR always. If the user
        // hasn't decided yet, we report false and let the caller
        // re-check.
        self.locationManager.requestWhenInUseAuthorization()
        let status: CLAuthorizationStatus
        if #available(iOS 14.0, *) {
            status = self.locationManager.authorizationStatus
        } else {
            status = CLLocationManager.authorizationStatus()
        }
        return status == .authorizedWhenInUse || status == .authorizedAlways
    }

    private func requestScreenTime() async -> Bool {
        #if canImport(FamilyControls)
        if #available(iOS 17.0, *) {
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                return AuthorizationCenter.shared.authorizationStatus == .approved
            } catch {
                return false
            }
        }
        return false
        #else
        return false
        #endif
    }
}

// MARK: - File-private utilities

private let isoFormatter: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
}()

private func isoDate(_ s: String) -> Date? {
    if let d = isoFormatter.date(from: s) { return d }
    // Fall back to no-fractional-seconds for callers that don't include them.
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime]
    return f.date(from: s)
}

private func isoString(_ d: Date) -> String {
    return isoFormatter.string(from: d)
}
