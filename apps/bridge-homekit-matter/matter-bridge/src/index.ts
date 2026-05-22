/**
 * COYL Matter Bridge — entry point.
 *
 * Long-lived Node.js service that:
 *   1. Joins the user's Matter fabric as a Controller (matter.js).
 *   2. Discovers commissioned devices on the fabric.
 *   3. Registers itself + each device as an EAP edge against coyl.ai.
 *   4. Polls /api/eap/v1/devices/<id>/pending-actions every 3s.
 *   5. Dispatches each action to the right Matter cluster command.
 *   6. POSTs the outcome back to /api/eap/v1/action/outcome.
 *
 * Deployment shapes (see README §3):
 *   - Docker container (host networking, named volume for fabric state)
 *   - Raspberry Pi systemd unit
 *   - Future: pre-configured "COYL Hub" device
 *
 * Why Node.js + matter.js? matter.js is the most actively-maintained
 * OSS Matter implementation in any language, written by Project CHIP
 * contributors. Python's matter-server is also viable but uses a
 * different transport model (WebSocket-only) that would force a
 * different orchestration shape. Node also matches the rest of the
 * COYL stack — easier handoff for maintenance.
 *
 * Lifecycle invariants:
 *   - The fabric state lives at $COYL_MATTER_STORAGE_PATH (default
 *     `./.matter-fabric`). Lose this directory and you have to
 *     re-commission every device. The Dockerfile mounts it as a named
 *     volume.
 *   - On SIGTERM / SIGINT we stop the poll loop, close the controller,
 *     flush logs, and exit cleanly. systemd / Docker stop signal is
 *     respected so cert / fabric state is never corrupted by a kill -9.
 */

import "dotenv/config";
import pino from "pino";
import { EAPCoordinator } from "./eap-coordinator.js";
import { startMatterController, type MatterRuntime } from "./matter-controller.js";
import { Actuators } from "./actuators.js";
import { Sensors } from "./sensors.js";

const log = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "coyl-matter-bridge" },
});

const POLL_INTERVAL_MS = Number(process.env.EAP_POLL_INTERVAL_MS ?? 3000);

async function main(): Promise<void> {
  // Step 1: required env. Fail loud at boot, not at first request.
  const userToken = required("COYL_USER_TOKEN");
  const apiBase = process.env.COYL_API_BASE ?? "https://coyl.ai";

  log.info({ apiBase }, "starting COYL Matter Bridge v0.1");

  // Step 2: bring up the Matter controller. This either restores an
  // existing fabric from disk OR initializes an empty fabric if this
  // is the first run. Commissioning of NEW devices happens out-of-band
  // (see README §3 "Commissioning UX") — the controller only manages
  // already-commissioned devices in v0.1.
  const matter: MatterRuntime = await startMatterController({ log });

  const eap = new EAPCoordinator({
    apiBase,
    userToken,
    log,
  });

  // Step 3: register the bridge as an EAP device. The manifest is
  // built from the live Matter fabric — we publish exactly the
  // actuators / sensors that exist on devices we can address.
  const manifest = Actuators.buildManifest(matter) //
    .merge(Sensors.buildManifest(matter));

  const deviceId = await eap.registerDevice({
    deviceClass: "matter_bridge",
    model: "Matter Controller (matter.js)",
    os: `node ${process.version}`,
    deviceFingerprint: matter.fabricFingerprint,
    manifest: manifest.toJSON(),
    operationalState: {
      battery: -1,
      doNotDisturb: false,
      paused: false,
      bridgeVersion: "0.1.0",
      fabricNodeCount: matter.nodes.length,
    },
  });

  log.info({ deviceId, nodeCount: matter.nodes.length }, "EAP register OK");

  // Step 4: subscribe Matter cluster attribute changes -> EAP sensor
  // publish. This is event-driven (matter.js gives us push from the
  // device), so we don't poll on the sensor path.
  await Sensors.subscribeAll({ matter, eap, deviceId, log });

  // Step 5: poll loop for actions. EAP v0.1 §1 leaves the transport
  // upgradeable to WebSocket; for now we poll because that's what the
  // server already serves and it's enough for sub-5s latency on the
  // wind-down scenario.
  let stopping = false;

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  async function shutdown(signal: string): Promise<void> {
    log.info({ signal }, "shutdown requested");
    stopping = true;
    await matter.close();
    log.info("clean shutdown");
    process.exit(0);
  }

  while (!stopping) {
    try {
      const actions = await eap.fetchPendingActions(deviceId);
      for (const action of actions) {
        log.info(
          { actuator: action.actuator, llmPartnerId: action.llmPartnerId },
          "dispatch action",
        );
        const outcome = await Actuators.dispatch(action, matter);
        await eap.postOutcome(outcome);
      }
    } catch (err) {
      log.error({ err }, "poll iteration failed");
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

function required(key: string): string {
  const v = process.env[key];
  if (!v) {
    console.error(`[coyl-matter-bridge] FATAL: missing env ${key}`);
    process.exit(1);
  }
  return v;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  log.fatal({ err }, "boot failed");
  process.exit(1);
});
