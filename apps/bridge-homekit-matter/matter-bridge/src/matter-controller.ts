/**
 * matter-controller.ts
 *
 * Initializes the matter.js CommissioningController, restores fabric
 * state from disk, and exposes a stable `MatterRuntime` handle to the
 * rest of the bridge.
 *
 * In v0.1 we treat the fabric as immutable post-onboarding — the
 * bridge does NOT commission new devices itself. Commissioning is a
 * separate UX (out-of-band web UI; see README §3) that mutates the
 * fabric and triggers a controller reload on completion.
 *
 * Why split this out from index.ts? Because matter.js' API surface
 * changes between minor versions and we want one file to update on
 * upgrades, not a sprawl. The `MatterRuntime` type below is the
 * stable internal contract; the rest of the bridge depends on this
 * shape, not on matter.js types directly.
 *
 * The actual matter.js calls in v0.1 are stubbed — replaced in v0.2
 * with the real CommissioningController flow. We ship the shape so
 * actuators.ts / sensors.ts can be written and code-reviewed against
 * a stable interface ahead of the matter.js integration.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Logger } from "pino";

/**
 * Public handle to the running Matter controller. The rest of the
 * bridge interacts only through this surface — keeps the matter.js
 * API churn contained to this file.
 */
export interface MatterRuntime {
  /** Stable identifier for the fabric, used as the EAP deviceFingerprint. */
  fabricFingerprint: string;

  /** Snapshot of every commissioned node currently on the fabric. */
  nodes: MatterNode[];

  /** Resolve a node by its NodeId string. */
  getNode(nodeId: string): MatterNode | undefined;

  /** Subscribe to attribute changes on a cluster. Returns a teardown fn. */
  subscribeAttribute(
    nodeId: string,
    endpointId: number,
    clusterId: number,
    attributeId: number,
    onChange: (value: unknown) => void,
  ): Promise<() => void>;

  /** Send a cluster command. Returns the raw response (often empty). */
  sendCommand(
    nodeId: string,
    endpointId: number,
    clusterId: number,
    commandId: number,
    payload?: Record<string, unknown>,
  ): Promise<unknown>;

  /** Read a single attribute value (for one-shot snapshots). */
  readAttribute(
    nodeId: string,
    endpointId: number,
    clusterId: number,
    attributeId: number,
  ): Promise<unknown>;

  /** Write a single attribute value. */
  writeAttribute(
    nodeId: string,
    endpointId: number,
    clusterId: number,
    attributeId: number,
    value: unknown,
  ): Promise<void>;

  /** Graceful shutdown. Persists fabric state, closes sockets. */
  close(): Promise<void>;
}

/**
 * Snapshot of a commissioned Matter node. We flatten the per-endpoint,
 * per-cluster structure into a simpler shape that maps cleanly onto
 * the EAP actuator / sensor mapping.
 */
export interface MatterNode {
  nodeId: string;
  /** Human-readable hint pulled from the node's BasicInformation cluster. */
  productLabel: string;
  /** Vendor name from BasicInformation. */
  vendorName: string;
  /** Endpoints (sub-devices) on this node. A power strip has many. */
  endpoints: MatterEndpoint[];
}

export interface MatterEndpoint {
  endpointId: number;
  /** Cluster ids supported by this endpoint, e.g. 0x0006 (OnOff). */
  clusters: number[];
  /** Optional room hint when the device exposes it (rare in pure Matter). */
  room?: string;
}

export interface StartArgs {
  log: Logger;
  storagePath?: string;
}

/**
 * Boot the controller. In v0.1 this returns a stub runtime backed by
 * an on-disk JSON file we treat as the fabric snapshot. v0.2 swaps the
 * implementation for matter.js' CommissioningController while keeping
 * the MatterRuntime contract identical.
 */
export async function startMatterController(args: StartArgs): Promise<MatterRuntime> {
  const { log } = args;
  const storagePath =
    args.storagePath ?? process.env.COYL_MATTER_STORAGE_PATH ?? "./.matter-fabric";

  await mkdir(storagePath, { recursive: true });
  const fabricFile = join(storagePath, "fabric.json");

  let snapshot: FabricSnapshot;
  try {
    const raw = await readFile(fabricFile, "utf8");
    snapshot = JSON.parse(raw) as FabricSnapshot;
    log.info({ nodes: snapshot.nodes.length }, "restored fabric from disk");
  } catch {
    snapshot = { fabricId: deriveFabricId(storagePath), nodes: [] };
    await writeFile(fabricFile, JSON.stringify(snapshot, null, 2));
    log.info("initialized empty fabric");
  }

  const fingerprint = createHash("sha256")
    .update(snapshot.fabricId)
    .digest("hex")
    .slice(0, 32);

  // Stub implementation. Every command resolves successfully so the
  // rest of the bridge can be wired up + integration-tested against
  // the EAP server without a live Matter fabric. The real matter.js
  // wiring lands in v0.2.
  const teardowns = new Set<() => void>();

  const runtime: MatterRuntime = {
    fabricFingerprint: fingerprint,
    nodes: snapshot.nodes,

    getNode(nodeId) {
      return snapshot.nodes.find((n) => n.nodeId === nodeId);
    },

    async subscribeAttribute(nodeId, endpointId, clusterId, attributeId, onChange) {
      log.debug(
        { nodeId, endpointId, clusterId, attributeId },
        "subscribeAttribute (stub — wires in v0.2)",
      );
      // No-op subscription. In v0.2: controller.getNode(...).subscribe(...)
      const teardown = () => {
        /* noop */
      };
      teardowns.add(teardown);
      // Silence "unused" on onChange in the stub — real impl will call it.
      void onChange;
      return teardown;
    },

    async sendCommand(nodeId, endpointId, clusterId, commandId, payload) {
      log.info(
        { nodeId, endpointId, clusterId: hex(clusterId), commandId, payload },
        "Matter sendCommand (stub)",
      );
      return null;
    },

    async readAttribute(nodeId, endpointId, clusterId, attributeId) {
      log.debug(
        { nodeId, endpointId, clusterId: hex(clusterId), attributeId },
        "Matter readAttribute (stub)",
      );
      return null;
    },

    async writeAttribute(nodeId, endpointId, clusterId, attributeId, value) {
      log.info(
        { nodeId, endpointId, clusterId: hex(clusterId), attributeId, value },
        "Matter writeAttribute (stub)",
      );
    },

    async close() {
      for (const t of teardowns) t();
      teardowns.clear();
      await writeFile(fabricFile, JSON.stringify(snapshot, null, 2));
      log.info("fabric snapshot persisted; controller closed");
    },
  };

  return runtime;
}

interface FabricSnapshot {
  fabricId: string;
  nodes: MatterNode[];
}

/**
 * Stable per-install fabric id. Hashed from the storage path so two
 * bridges on the same host with different storage dirs don't collide.
 * In v0.2 this gets replaced by the real fabric ID matter.js issues.
 */
function deriveFabricId(storagePath: string): string {
  return createHash("sha256")
    .update(`coyl-matter-bridge|${storagePath}`)
    .digest("hex");
}

function hex(n: number): string {
  return `0x${n.toString(16).padStart(4, "0")}`;
}
