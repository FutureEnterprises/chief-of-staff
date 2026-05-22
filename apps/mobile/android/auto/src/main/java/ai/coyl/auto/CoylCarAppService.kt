package ai.coyl.auto

import androidx.car.app.CarAppService
import androidx.car.app.Session
import androidx.car.app.validation.HostValidator

/**
 * COYL Android Auto entry point.
 *
 * The `CarAppService` is the binding surface the car host (Android
 * Auto on phone, Android Automotive OS on car head units) connects
 * to when the user opens COYL on the in-car launcher. The system
 * creates exactly one Service per car connection.
 *
 * Responsibilities:
 *   1. Provide a `HostValidator` that decides which car hosts are
 *      allowed to bind. In production this should be
 *      `HostValidator.Builder().addAllowedHosts(...).build()` keyed
 *      on the documented production car-host package signatures (see
 *      androidx.car.app.HostValidator.ALLOWED_HOSTS_RES_ID). For
 *      development we use ALLOW_ALL_HOSTS_VALIDATOR so the DHU
 *      (Desktop Head Unit emulator) can bind without code changes.
 *
 *   2. Create a [Session] on connection. A Session represents a
 *      single car-projection session (one car, one drive). It lives
 *      as long as the connection is active and is responsible for
 *      producing the first [androidx.car.app.Screen] the user sees.
 *
 * The :app module wires this service in via manifest-merger; nothing
 * in :app needs to know about Auto beyond depending on this module.
 *
 * Honest scope notes (see also CARPLAY_ANDROID_AUTO.md):
 *   - Templates are heavily restricted to the documented vocabulary
 *     (Pane, Message, List, Grid, Search, Sign-In, Navigation, Place-
 *     ListMap, NowPlaying). COYL uses PaneTemplate for status + a
 *     button row for the 4 actions. We cannot render custom Compose
 *     UI or fire driver-distracting overlays.
 *   - Distribution through Google Play requires the Apps for Cars
 *     Quality Tier certification. Approval is faster + more lenient
 *     than Apple CarPlay (~1-3 weeks, ~85% rate if we stay within the
 *     template constraints).
 */
class CoylCarAppService : CarAppService() {

    /**
     * Allow any host during development — replace with a signature-
     * pinned validator before production submission.
     *
     * The production list ships in `androidx.car.app.R.array.
     * hosts_allowlist_sample` and includes the Android Auto host
     * (com.google.android.projection.gearhead), the AAOS embedded
     * host, and the DHU. We swap to that before Play submission.
     */
    override fun createHostValidator(): HostValidator {
        return HostValidator.ALLOW_ALL_HOSTS_VALIDATOR
    }

    /**
     * Single-session factory. We hand back a new [CoylSession] each
     * time the car connects; the session is responsible for the
     * Screen stack.
     */
    override fun onCreateSession(): Session {
        return CoylSession()
    }
}
