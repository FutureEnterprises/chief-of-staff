/**
 * @coyl/protocol — the COYL protocol stack SDK (alpha).
 *
 * Typed clients for the two action-layer protocols in the COYL stack:
 *
 *   UAPClient        — User-Authority Protocol: standing, scoped, expiring
 *                      grants an LLM partner acts under without per-action
 *                      user presence. Grant / precheck / execute / revoke /
 *                      rule / audit / kill-switch / provenance.
 *
 *   EAPDeviceClient  — Execution Action Protocol (device side): register a
 *                      device, poll for approved actions, report outcomes,
 *                      publish sensor snapshots.
 *
 * Zero runtime dependencies. Targets native `fetch` (Node ≥18, browsers,
 * edge runtimes). See README.md for the auth model and quickstarts, and
 * SPEC_NOTES.md for where the live implementation diverges from
 * docs/protocol/UAP-0.1.md.
 *
 * Stability: ALPHA (0.1.0-alpha.1). Wire shapes may change before 1.0.
 */

export { UAPClient } from './uap'
export type { UAPClientOptions } from './uap'

export { EAPDeviceClient } from './eap'
export type { EAPDeviceClientOptions } from './eap'

export { CoylProtocolError, coylErrorFromBody } from './errors'
export type { CoylProtocolErrorInit } from './errors'

export { UAP_SCOPES, UAP_IRREVERSIBLE_FLOOR, UAP_REPRESENTATION_ACTIONS } from './types'

export type {
  // UAP scopes / enums
  UAPScope,
  Reversibility,
  UAPIrreversibleAction,
  UAPRepresentationAction,
  UAPRuleKind,
  UAPRuleInput,
  UAPConsentArtifact,
  // GRANT
  GrantRequest,
  GrantResponse,
  GetGrantResponse,
  RevokeGrantResponse,
  GrantLiveStatus,
  // EXECUTE / PRECHECK
  ExecuteAction,
  ExecuteContext,
  ExecuteRecipient,
  ExecuteRequest,
  ExecuteResponse,
  PrecheckResponse,
  UAPDenialReason,
  ProvenanceEnvelope,
  ProvenancePayload,
  // RULE
  DeclareRuleRequest,
  DeclareRuleResponse,
  // AUDIT
  QueryAuditParams,
  QueryAuditResponse,
  UAPAuditEntryWire,
  // KILL_SWITCH
  KillSwitchRequest,
  KillSwitchResponse,
  // PROVENANCE
  VerifyProvenanceResponse,
  // EAP
  EAPManifest,
  EAPOperationalState,
  EAPDeviceManifest,
  EAPRegisterResponse,
  EAPPendingAction,
  EAPPendingActionsResponse,
  EAPOutcome,
  EAPActionOutcome,
  EAPOutcomeResponse,
  EAPSensorSnapshot,
  EAPSensorPublishResponse,
} from './types'
