/**
 * @coyl/protocol — EAP (Execution Action Protocol) device client.
 *
 * EAP is the cross-device action layer: an edge device (a Mac menu-bar
 * coordinator, a phone, a watch) registers a capability manifest, then
 * polls for actions an LLM partner has had the coordinator approve,
 * executes them via its local actuators, and reports outcomes back.
 *
 * This client models the DEVICE side of that loop — register, poll,
 * report, publish-sensors — typed against the live EAP route handlers
 * and the macOS coordinator's wire models (apps/desktop-macos).
 *
 * ── Auth model ────────────────────────────────────────────────────────
 *
 * The poll + publish endpoints authenticate the *device*, accepting (in
 * order, per lib/eap/device-auth.ts): an EAP device token
 * (Bearer coyl_eap_<deviceId>_<secret>), an LLM-partner PAP key holding a
 * scope grant from the device owner, or the user's Clerk session cookie
 * (bootstrap). Pass whichever Bearer you hold as `deviceToken`.
 *
 * `registerDevice` authenticates the LLM *partner* (Bearer coyl_pap_*).
 * `reportOutcome` requires NO Authorization — the single-use
 * executionToken in the body authorizes it.
 */

import { httpRequest, normalizeBaseUrl } from './http'
import type {
  EAPDeviceManifest,
  EAPRegisterResponse,
  EAPPendingActionsResponse,
  EAPActionOutcome,
  EAPOutcomeResponse,
  EAPSensorSnapshot,
  EAPSensorPublishResponse,
} from './types'

export interface EAPDeviceClientOptions {
  /** Base origin of the COYL coordinator. Defaults to production. */
  baseUrl?: string
  /**
   * The device's Bearer token. In the bootstrapping window this is a
   * Clerk session JWT; after first /device/register it is the EAP device
   * token. Either is passed verbatim as `Authorization: Bearer <token>`.
   *
   * NOTE: the live /device/register handler authenticates the *LLM
   * partner* (Bearer `coyl_pap_<id>_<secret>`), since registration is
   * often initiated by the partner on the user's behalf. The
   * /action/outcome handler requires NO Authorization — it is authorized
   * by the single-use executionToken in the body. So `deviceToken` is
   * only strictly required for register; outcome works without it.
   */
  deviceToken?: string
}

const DEFAULT_BASE_URL = 'https://www.coyl.ai'

export class EAPDeviceClient {
  private readonly baseUrl: string
  private readonly deviceToken?: string

  constructor(options: EAPDeviceClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL)
    this.deviceToken = options.deviceToken
  }

  private auth(): string | undefined {
    return this.deviceToken ? `Bearer ${this.deviceToken}` : undefined
  }

  /**
   * Register (or re-register) this device into the user's fleet.
   *
   * Idempotent on `device_fingerprint` — a re-POST upserts the manifest
   * + operational state without minting a duplicate row, and flips
   * `paired=true`. Returns the server-issued device id.
   *
   * The live handler reads snake_case top-level fields but a camelCase
   * manifest (`{ sensors, actuators, userGrantedScopes }`); this client
   * sends exactly that shape. See SPEC_NOTES.md #9.
   */
  async registerDevice(manifest: EAPDeviceManifest): Promise<EAPRegisterResponse> {
    // The handler expects camelCase top-level keys (userId, deviceClass,
    // deviceFingerprint, operationalState, pushToken) — map from the
    // snake_case public input shape here.
    const body: Record<string, unknown> = {
      userId: manifest.user_id,
      deviceClass: manifest.device_class,
      model: manifest.model,
      os: manifest.os,
      deviceFingerprint: manifest.device_fingerprint,
      manifest: manifest.manifest,
      operationalState: manifest.operational_state,
      pushToken: manifest.push_token,
    }
    return httpRequest<EAPRegisterResponse>(this.baseUrl, {
      method: 'POST',
      path: '/api/eap/v1/device/register',
      authorization: this.auth(),
      body,
    })
  }

  /**
   * Poll for pending actions the coordinator has approved for this device.
   *
   * Returns `{ actions: [...] }` (empty array when the queue is empty).
   * Each action carries a single-use `executionToken` you POST back via
   * {@link reportOutcome} once you've dispatched (or failed to dispatch)
   * the actuator. A re-poll before you report an outcome re-surfaces the
   * same row (by design) — outcome reporting is idempotent on the token.
   */
  async pollPendingActions(deviceId: string): Promise<EAPPendingActionsResponse> {
    return httpRequest<EAPPendingActionsResponse>(this.baseUrl, {
      method: 'GET',
      path: `/api/eap/v1/devices/${encodeURIComponent(deviceId)}/pending-actions`,
      authorization: this.auth(),
    })
  }

  /**
   * Report the terminal outcome of an action (NO auth required — the
   * single-use `executionToken` is the capability).
   *
   * Idempotent on the token: re-POSTing the same outcome returns
   * `{ ok: true, idempotent: true }`. A different outcome for an already-
   * settled token is recorded as a conflict but does not overwrite
   * (first-write-wins).
   */
  async reportOutcome(actionId: string, outcome: EAPActionOutcome): Promise<EAPOutcomeResponse> {
    // `actionId` here IS the executionToken (the outcome endpoint keys
    // off executionToken, not the action row id).
    return httpRequest<EAPOutcomeResponse>(this.baseUrl, {
      method: 'POST',
      path: '/api/eap/v1/action/outcome',
      // No Authorization — the executionToken authorizes the call.
      body: {
        executionToken: actionId,
        outcome: outcome.outcome,
        outcomeReason: outcome.outcomeReason,
        userInteracted: outcome.userInteracted,
        deviceState: outcome.deviceState,
        userTag: outcome.userTag,
      },
    })
  }

  /**
   * Publish a sensor snapshot for this device.
   *
   * Sends the canonical `{ snapshot, asOf }` envelope. The server keeps
   * only the most-recent snapshot on the device row (clamped to ≤8KB
   * serialized — a larger snapshot is rejected with 413, not truncated).
   * The publish loop doubles as the device's online heartbeat.
   */
  async publishSensors(
    deviceId: string,
    snapshot: EAPSensorSnapshot
  ): Promise<EAPSensorPublishResponse> {
    return httpRequest<EAPSensorPublishResponse>(this.baseUrl, {
      method: 'POST',
      path: `/api/eap/v1/sensor/${encodeURIComponent(deviceId)}/publish`,
      authorization: this.auth(),
      body: snapshot,
    })
  }
}
