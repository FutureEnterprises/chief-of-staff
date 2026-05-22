/**
 * eap-coordinator.ts
 *
 * Thin HTTP client for coyl.ai/api/eap/v1/*. Mirrors the Swift
 * EAPHTTP layer in homekit-bridge — same endpoints, same envelope
 * shapes. Kept separate per-bridge because they're independently
 * deployable.
 *
 * Endpoints used:
 *   POST /api/eap/v1/device/register
 *   GET  /api/eap/v1/devices/<id>/pending-actions
 *   POST /api/eap/v1/action/outcome
 *   POST /api/eap/v1/sensor/publish
 *
 * Auth: bearer COYL_USER_TOKEN. Failed auth fails hard — the server's
 * audit log needs to know which user the bridge is acting on behalf
 * of, and we never proceed with anonymous calls.
 *
 * Retries: none in v0.1. Each call either succeeds or the poll loop
 * tries again on the next tick. Idempotency is handled server-side
 * via the executionToken on outcome posts.
 */

import { fetch, Headers } from "undici";
import type { Logger } from "pino";

export interface EAPCoordinatorArgs {
  apiBase: string;
  userToken: string;
  log: Logger;
}

export interface EAPAction {
  id: string;
  executionToken: string;
  actuator: string;
  params: Record<string, unknown>;
  scopeRequested?: string;
  reasoning?: string;
  confidence?: number;
  willExecuteAt?: string;
  ttlSeconds?: number;
  llmPartnerId?: string;
}

export type EAPOutcomeKind = "executed" | "failed" | "rejected" | "expired";

export interface EAPActionOutcome {
  executionToken: string;
  outcome: EAPOutcomeKind;
  outcomeReason?: string;
  userInteracted?: boolean;
  deviceState?: Record<string, unknown>;
  userTag?: string;
}

export interface RegisterDeviceArgs {
  deviceClass: string;
  model: string;
  os: string;
  deviceFingerprint: string;
  manifest: {
    sensors: string[];
    actuators: string[];
    userGrantedScopes: string[];
  };
  operationalState: Record<string, unknown>;
}

export class EAPCoordinator {
  private readonly apiBase: string;
  private readonly userToken: string;
  private readonly log: Logger;

  constructor(args: EAPCoordinatorArgs) {
    this.apiBase = args.apiBase.replace(/\/$/, "");
    this.userToken = args.userToken;
    this.log = args.log;
  }

  /** POST /api/eap/v1/device/register. Returns the server-issued deviceId. */
  async registerDevice(args: RegisterDeviceArgs): Promise<string> {
    const res = await this.post("/api/eap/v1/device/register", args);
    const body = (await res.json()) as { deviceId?: string };
    if (!body.deviceId) {
      throw new Error("register: response missing deviceId");
    }
    return body.deviceId;
  }

  /** GET /api/eap/v1/devices/<id>/pending-actions. */
  async fetchPendingActions(deviceId: string): Promise<EAPAction[]> {
    const res = await this.get(`/api/eap/v1/devices/${deviceId}/pending-actions`);
    const body = (await res.json()) as { actions?: EAPAction[] };
    return body.actions ?? [];
  }

  /** POST /api/eap/v1/action/outcome. */
  async postOutcome(outcome: EAPActionOutcome): Promise<void> {
    await this.post("/api/eap/v1/action/outcome", outcome);
  }

  /** POST /api/eap/v1/sensor/publish. */
  async publishSensor(args: {
    deviceId: string;
    sensor: string;
    value: unknown;
  }): Promise<void> {
    await this.post("/api/eap/v1/sensor/publish", {
      deviceId: args.deviceId,
      sensor: args.sensor,
      value: args.value,
      at: new Date().toISOString(),
    });
  }

  // MARK: - HTTP

  private async get(path: string): Promise<Response> {
    const res = await fetch(`${this.apiBase}${path}`, {
      method: "GET",
      headers: this.headers(),
    });
    return this.checked(res, "GET", path);
  }

  private async post(path: string, body: unknown): Promise<Response> {
    const res = await fetch(`${this.apiBase}${path}`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    return this.checked(res, "POST", path);
  }

  private headers(extra?: Record<string, string>): Headers {
    const h = new Headers({
      Authorization: `Bearer ${this.userToken}`,
      Accept: "application/json",
      "User-Agent": "coyl-matter-bridge/0.1.0",
    });
    if (extra) for (const [k, v] of Object.entries(extra)) h.set(k, v);
    return h;
  }

  // undici's fetch returns a Response-compatible object. We narrow to a
  // tiny structural type so consumers don't need a DOM-typed Response.
  private async checked(
    res: { ok: boolean; status: number; text: () => Promise<string>; json: () => Promise<unknown> },
    method: string,
    path: string,
  ): Promise<Response> {
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      this.log.error({ method, path, status: res.status, body }, "eap http error");
      throw new Error(`EAP ${method} ${path} -> ${res.status}`);
    }
    return res as unknown as Response;
  }
}
