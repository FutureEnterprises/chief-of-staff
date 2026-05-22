/**
 * actuators.ts
 *
 * EAP actuator -> Matter cluster command dispatch. This is the bridge's
 * write surface: every "do something to a device" call from coyl.ai
 * lands here and gets translated into a `sendCommand` or
 * `writeAttribute` against matter.js.
 *
 * Mapping (kept in sync with README §3 "Cluster -> actuator mapping"):
 *
 *   home:lights:on            -> OnOff (0x0006)        cmd On         (0x01)
 *   home:lights:off           -> OnOff (0x0006)        cmd Off        (0x00)
 *   home:lights:dim           -> LevelControl (0x0008) cmd MoveToLevel(0x00)
 *   home:lights:color         -> ColorControl (0x0300) cmd MoveToHueAndSaturation (0x06)
 *   home:lock:lock            -> DoorLock (0x0101)     cmd LockDoor   (0x00) IRREVERSIBLE
 *   home:lock:unlock          -> DoorLock (0x0101)     cmd UnlockDoor (0x01) IRREVERSIBLE
 *   home:thermostat:set       -> Thermostat (0x0201)   write OccupiedHeatingSetpoint
 *   home:fan:speed            -> FanControl (0x0202)   write PercentSetting
 *   home:cover:position       -> WindowCovering (0x0102) cmd GoToLiftPercentage (0x05)
 *
 * Irreversible actuators (DoorLock) refuse to fire unless a fresh
 * per-action confirmation token is attached. The coordinator on the
 * server side mints this token; we trust the server's gate.
 *
 * Errors return as outcome={failed|rejected} so the audit log captures
 * the reason. We never throw to the caller — the EAP loop in index.ts
 * needs every action to terminate in a server-acknowledged outcome.
 */

import type { Logger } from "pino";
import type { EAPAction, EAPActionOutcome } from "./eap-coordinator.js";
import type { MatterRuntime } from "./matter-controller.js";

/** Matter cluster ids we care about. */
const Cluster = {
  OnOff: 0x0006,
  LevelControl: 0x0008,
  ColorControl: 0x0300,
  DoorLock: 0x0101,
  Thermostat: 0x0201,
  FanControl: 0x0202,
  WindowCovering: 0x0102,
} as const;

/** OnOff command ids. */
const OnOffCmd = { Off: 0x00, On: 0x01, Toggle: 0x02 } as const;
const LevelCmd = { MoveToLevel: 0x00, MoveToLevelWithOnOff: 0x04 } as const;
const ColorCmd = { MoveToHueAndSaturation: 0x06 } as const;
const DoorLockCmd = { LockDoor: 0x00, UnlockDoor: 0x01 } as const;
const WindowCoveringCmd = { GoToLiftPercentage: 0x05 } as const;

/** Thermostat attribute ids (cluster 0x0201). */
const ThermostatAttr = { OccupiedHeatingSetpoint: 0x0012 } as const;
const FanControlAttr = { PercentSetting: 0x0002 } as const;

/**
 * Manifest builder accumulator. Keeps actuators / sensors / scopes as
 * Sets so we can union sensors-into-actuators in the index.ts merge.
 */
export class Manifest {
  actuators = new Set<string>();
  sensors = new Set<string>();
  scopes = new Set<string>();

  merge(other: Manifest): Manifest {
    for (const a of other.actuators) this.actuators.add(a);
    for (const s of other.sensors) this.sensors.add(s);
    for (const sc of other.scopes) this.scopes.add(sc);
    return this;
  }

  toJSON(): { actuators: string[]; sensors: string[]; userGrantedScopes: string[] } {
    return {
      actuators: [...this.actuators].sort(),
      sensors: [...this.sensors].sort(),
      userGrantedScopes: [...this.scopes].sort(),
    };
  }
}

export const Actuators = {
  /**
   * Walk every commissioned node + endpoint and declare an actuator
   * for every cluster we know how to drive. Devices the user doesn't
   * own don't get exposed — keeps the LLM's manifest truthful.
   */
  buildManifest(matter: MatterRuntime): Manifest {
    const m = new Manifest();
    for (const node of matter.nodes) {
      for (const ep of node.endpoints) {
        for (const cluster of ep.clusters) {
          switch (cluster) {
            case Cluster.OnOff:
              m.actuators.add("home:lights:on");
              m.actuators.add("home:lights:off");
              m.scopes.add("edge:home:lights_dim"); // umbrella scope for lights
              break;
            case Cluster.LevelControl:
              m.actuators.add("home:lights:dim");
              break;
            case Cluster.ColorControl:
              m.actuators.add("home:lights:color");
              break;
            case Cluster.DoorLock:
              m.actuators.add("home:lock:lock");
              m.actuators.add("home:lock:unlock");
              // DO NOT auto-grant edge:home:lock_doors — :irreversible
              break;
            case Cluster.Thermostat:
              m.actuators.add("home:thermostat:set");
              m.scopes.add("edge:home:thermostat");
              break;
            case Cluster.FanControl:
              m.actuators.add("home:fan:speed");
              break;
            case Cluster.WindowCovering:
              m.actuators.add("home:cover:position");
              break;
          }
        }
      }
    }
    return m;
  },

  /**
   * Single entry point for action dispatch. Always returns a terminal
   * outcome; never throws.
   */
  async dispatch(action: EAPAction, matter: MatterRuntime): Promise<EAPActionOutcome> {
    const nodeId = stringParam(action, "nodeId");
    if (!nodeId) return rejected(action, "missing_nodeId");

    const node = matter.getNode(nodeId);
    if (!node) return rejected(action, "node_not_found");

    const endpointId = numberParam(action, "endpointId") ?? defaultEndpoint(node);
    if (endpointId === undefined) return rejected(action, "missing_endpointId");

    // Irreversible gate. We REQUIRE the server to have stamped a fresh
    // per-action confirm token. Missing token = misconfigured call.
    if (isIrreversible(action.actuator)) {
      if (!stringParam(action, "perActionConfirmToken")) {
        return rejected(action, "irreversible_requires_confirm");
      }
    }

    try {
      switch (action.actuator) {
        case "home:lights:on":
          await matter.sendCommand(nodeId, endpointId, Cluster.OnOff, OnOffCmd.On);
          return executed(action);

        case "home:lights:off":
          await matter.sendCommand(nodeId, endpointId, Cluster.OnOff, OnOffCmd.Off);
          return executed(action);

        case "home:lights:dim": {
          const pct = clamp(
            numberParam(action, "brightness") ?? numberParam(action, "level") ?? -1,
            0,
            100,
          );
          if (pct < 0) return rejected(action, "missing_brightness");
          // Matter LevelControl Level is 0..254. Convert from 0..100.
          const level = Math.round((pct / 100) * 254);
          const transitionTime = numberParam(action, "transitionDs") ?? 5; // 0.5s
          await matter.sendCommand(
            nodeId,
            endpointId,
            Cluster.LevelControl,
            LevelCmd.MoveToLevelWithOnOff,
            { level, transitionTime, optionsMask: 0, optionsOverride: 0 },
          );
          return executed(action);
        }

        case "home:lights:color": {
          const hue = clamp(numberParam(action, "hue") ?? 30, 0, 360);
          const saturation = clamp(numberParam(action, "saturation") ?? 60, 0, 100);
          // Matter hue is 0..254 (mapped from 0..360); saturation is 0..254.
          const hueByte = Math.round((hue / 360) * 254);
          const satByte = Math.round((saturation / 100) * 254);
          await matter.sendCommand(
            nodeId,
            endpointId,
            Cluster.ColorControl,
            ColorCmd.MoveToHueAndSaturation,
            {
              hue: hueByte,
              saturation: satByte,
              transitionTime: numberParam(action, "transitionDs") ?? 5,
              optionsMask: 0,
              optionsOverride: 0,
            },
          );
          return executed(action);
        }

        case "home:lock:lock":
          await matter.sendCommand(nodeId, endpointId, Cluster.DoorLock, DoorLockCmd.LockDoor);
          return executed(action);

        case "home:lock:unlock":
          await matter.sendCommand(nodeId, endpointId, Cluster.DoorLock, DoorLockCmd.UnlockDoor);
          return executed(action);

        case "home:thermostat:set": {
          const tempC = numberParam(action, "temperatureCelsius") ?? numberParam(action, "temperature");
          if (tempC === undefined) return rejected(action, "missing_temperature");
          // Matter setpoint is hundredths of a degree.
          await matter.writeAttribute(
            nodeId,
            endpointId,
            Cluster.Thermostat,
            ThermostatAttr.OccupiedHeatingSetpoint,
            Math.round(tempC * 100),
          );
          return executed(action);
        }

        case "home:fan:speed": {
          const pct = clamp(numberParam(action, "percent") ?? -1, 0, 100);
          if (pct < 0) return rejected(action, "missing_percent");
          await matter.writeAttribute(
            nodeId,
            endpointId,
            Cluster.FanControl,
            FanControlAttr.PercentSetting,
            pct,
          );
          return executed(action);
        }

        case "home:cover:position": {
          const pct = clamp(numberParam(action, "liftPercent") ?? -1, 0, 100);
          if (pct < 0) return rejected(action, "missing_liftPercent");
          await matter.sendCommand(
            nodeId,
            endpointId,
            Cluster.WindowCovering,
            WindowCoveringCmd.GoToLiftPercentage,
            { liftPercent100thsValue: Math.round(pct * 100) },
          );
          return executed(action);
        }

        default:
          return rejected(action, `unsupported_actuator:${action.actuator}`);
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : "matter_command_failed";
      return failed(action, reason);
    }
  },
};

// MARK: - helpers

function executed(action: EAPAction): EAPActionOutcome {
  return { executionToken: action.executionToken, outcome: "executed" };
}

function failed(action: EAPAction, reason: string): EAPActionOutcome {
  return { executionToken: action.executionToken, outcome: "failed", outcomeReason: reason };
}

function rejected(action: EAPAction, reason: string): EAPActionOutcome {
  return { executionToken: action.executionToken, outcome: "rejected", outcomeReason: reason };
}

function isIrreversible(actuator: string): boolean {
  return actuator === "home:lock:lock" || actuator === "home:lock:unlock";
}

function stringParam(action: EAPAction, key: string): string | undefined {
  const v = action.params[key];
  return typeof v === "string" ? v : undefined;
}

function numberParam(action: EAPAction, key: string): number | undefined {
  const v = action.params[key];
  return typeof v === "number" ? v : undefined;
}

function defaultEndpoint(node: { endpoints: { endpointId: number }[] }): number | undefined {
  // Endpoint 1 is the "primary" device endpoint per Matter convention;
  // endpoint 0 is the device's root cluster set. Try 1 first, fall back
  // to the first non-zero endpoint we see.
  if (node.endpoints.some((e) => e.endpointId === 1)) return 1;
  return node.endpoints.find((e) => e.endpointId !== 0)?.endpointId;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
