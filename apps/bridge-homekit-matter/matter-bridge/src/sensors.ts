/**
 * sensors.ts
 *
 * Matter cluster attribute subscriptions -> EAP sensor publish. The
 * inverse of actuators.ts.
 *
 * Cluster -> sensor mapping (kept in sync with README §3):
 *
 *   OccupancySensing (0x0406)         attr Occupancy (0x0000)
 *     -> home:occupancy:<room> / home:motion:<room>
 *   TemperatureMeasurement (0x0402)   attr MeasuredValue (0x0000)
 *     -> home:temperature:<room>
 *   RelativeHumidityMeasurement (0x0405) attr MeasuredValue (0x0000)
 *     -> home:humidity:<room>
 *   DoorLock (0x0101)                 attr LockState (0x0000)
 *     -> home:lock:state
 *   IlluminanceMeasurement (0x0400)   attr MeasuredValue (0x0000)
 *     -> home:light_level:<room>
 *
 * Event-driven: matter.js' subscribeAttribute fires whenever the
 * device pushes an update. We rate-limit publish to one POST per
 * sensor per 5 seconds to keep flooding sensors (motion detectors
 * in particular) from saturating the EAP cloud.
 *
 * Room hints in pure Matter are weak — the protocol doesn't have a
 * first-class "room" concept the way HomeKit does. We accept a
 * room override from `node.endpoint.room` when present, otherwise
 * fall back to the productLabel + endpoint id.
 */

import type { Logger } from "pino";
import type { EAPCoordinator } from "./eap-coordinator.js";
import type { MatterRuntime, MatterNode, MatterEndpoint } from "./matter-controller.js";
import { Manifest } from "./actuators.js";

const Cluster = {
  OccupancySensing: 0x0406,
  TemperatureMeasurement: 0x0402,
  RelativeHumidityMeasurement: 0x0405,
  DoorLock: 0x0101,
  IlluminanceMeasurement: 0x0400,
} as const;

/** Attribute id 0x0000 (MeasuredValue / Occupancy / LockState) for all of these. */
const PRIMARY_ATTR = 0x0000;

const PUBLISH_THROTTLE_MS = 5_000;

export interface SubscribeArgs {
  matter: MatterRuntime;
  eap: EAPCoordinator;
  deviceId: string;
  log: Logger;
}

export const Sensors = {
  /** Declare every sensor we can serve from the fabric snapshot. */
  buildManifest(matter: MatterRuntime): Manifest {
    const m = new Manifest();
    for (const node of matter.nodes) {
      for (const ep of node.endpoints) {
        const room = roomKey(node, ep);
        for (const cluster of ep.clusters) {
          switch (cluster) {
            case Cluster.OccupancySensing:
              m.sensors.add(`home:occupancy:${room}`);
              m.sensors.add(`home:motion:${room}`);
              break;
            case Cluster.TemperatureMeasurement:
              m.sensors.add(`home:temperature:${room}`);
              break;
            case Cluster.RelativeHumidityMeasurement:
              m.sensors.add(`home:humidity:${room}`);
              break;
            case Cluster.DoorLock:
              m.sensors.add("home:lock:state");
              break;
            case Cluster.IlluminanceMeasurement:
              m.sensors.add(`home:light_level:${room}`);
              break;
          }
        }
      }
    }
    return m;
  },

  /**
   * Subscribe every supported cluster attribute on every node. The
   * onChange callback throttles + posts to /api/eap/v1/sensor/publish.
   */
  async subscribeAll(args: SubscribeArgs): Promise<void> {
    const { matter, eap, deviceId, log } = args;
    const lastPublishAt = new Map<string, number>();

    for (const node of matter.nodes) {
      for (const ep of node.endpoints) {
        const room = roomKey(node, ep);
        for (const cluster of ep.clusters) {
          const sensor = sensorKey(cluster, room);
          if (!sensor) continue;

          await matter.subscribeAttribute(
            node.nodeId,
            ep.endpointId,
            cluster,
            PRIMARY_ATTR,
            (value) => {
              const now = Date.now();
              const last = lastPublishAt.get(sensor) ?? 0;
              if (now - last < PUBLISH_THROTTLE_MS) return;
              lastPublishAt.set(sensor, now);

              const normalized = normalizeValue(cluster, value);
              eap
                .publishSensor({ deviceId, sensor, value: normalized })
                .catch((err) => log.error({ err, sensor }, "publishSensor failed"));
            },
          );
        }
      }
    }
    log.info("matter sensor subscriptions established");
  },
};

function sensorKey(cluster: number, room: string): string | undefined {
  switch (cluster) {
    case Cluster.OccupancySensing:
      return `home:motion:${room}`;
    case Cluster.TemperatureMeasurement:
      return `home:temperature:${room}`;
    case Cluster.RelativeHumidityMeasurement:
      return `home:humidity:${room}`;
    case Cluster.DoorLock:
      return "home:lock:state";
    case Cluster.IlluminanceMeasurement:
      return `home:light_level:${room}`;
    default:
      return undefined;
  }
}

/**
 * Matter ships raw cluster values (e.g. temperature is hundredths of
 * a degree Celsius as an int16). EAP wants normalized SI units —
 * temperature in plain Celsius, humidity as 0-100 percent, etc.
 */
function normalizeValue(cluster: number, raw: unknown): unknown {
  if (typeof raw !== "number") return raw;
  switch (cluster) {
    case Cluster.TemperatureMeasurement:
      return raw / 100; // hundredths of degC -> degC
    case Cluster.RelativeHumidityMeasurement:
      return raw / 100; // hundredths of percent -> percent
    case Cluster.IlluminanceMeasurement:
      // Matter encodes as 10000 * log10(lux) + 1. We pass raw through
      // and document on the EAP side; full conversion is a v0.2 polish.
      return raw;
    default:
      return raw;
  }
}

function roomKey(node: MatterNode, ep: MatterEndpoint): string {
  if (ep.room) {
    return ep.room.toLowerCase().replace(/\s+/g, "_");
  }
  // Fallback: derive from product label + endpoint so it's stable.
  const label = node.productLabel || node.vendorName || "unknown";
  return `${label}_${ep.endpointId}`.toLowerCase().replace(/\s+/g, "_");
}
