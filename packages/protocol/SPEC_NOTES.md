# SPEC_NOTES — where the live engine diverges from UAP-0.1.md

This SDK is typed against the **actual route handlers** under
`apps/web/src/app/api/uap/v1/**` and `apps/web/src/app/api/eap/v1/**`,
not against the prose in `docs/protocol/UAP-0.1.md`. Wherever the two
disagree, **the implementation wins** and the SDK follows the
implementation. Each divergence below is a candidate fix-up for the v0.2
spec revision.

Line references are to `docs/protocol/UAP-0.1.md` as of the version read
(v0.1.1, released 2026-05-22).

---

## 1. Scope vocabulary is `proactive_*`, NOT `calendar.write` etc. ⭐ (biggest trap)

- **Spec (§5, §1, §10):** examples use scopes `calendar.write`,
  `messaging.routine`, `purchase.recurring`.
- **Implementation (`lib/uap/types.ts` `UAP_SCOPES`):** the only accepted
  scopes are the nine `proactive_*` / `read` identifiers shared with PAP:
  `proactive_food`, `proactive_focus`, `proactive_relational`,
  `proactive_sleep`, `proactive_purchase`, `proactive_recovery`,
  `proactive_substance`, `proactive_mood`, `read`.
- **Consequence:** a GRANT using the spec's example scopes is rejected at
  GRANT time with `unknown_scope`. The SDK's `UAPScope` type encodes the
  real set, so this fails at compile time, not at runtime. Action kinds
  map to scopes via the coordinator's `ACTION_SCOPE_MAP`
  (e.g. `send_message` → `proactive_relational`, `purchase` →
  `proactive_purchase`, `meal_suggestion` → `proactive_food`).

## 2. There are 8 primitives in the title but 9 documented

- **Spec:** §2 header says "Eight Primitives" then the body adds a ninth
  (`PROVENANCE_SIGN`, v0.1.1). Cosmetic, but the count in the prose is
  stale. No SDK impact.

## 3. EXECUTE/PRECHECK take a `recipient` field the spec never shows

- **Spec (§5):** the EXECUTE request body shows only `grant_id`,
  `action`, `context`.
- **Implementation (`execute/route.ts`, `precheck/route.ts`):** both
  accept a top-level `recipient: { kind, hint }`. It drives the
  `recipient_allowlist` / `recipient_denylist` rule checks and the
  provenance `recipient_hint`. The SDK exposes it as
  `ExecuteRequest.recipient`.

## 4. Every EXECUTE/PRECHECK decision is HTTP 200 — denials are NOT error status codes

- **Spec (§5):** shows allowed/denied response *bodies* but is silent on
  status codes, implying (by analogy to REST norms) a denial might be a
  4xx.
- **Implementation:** `denied` and `needs_per_action_confirmation` are
  returned with **HTTP 200**; the decision lives in the body. Only
  transport/auth/validation failures are 4xx/5xx.
- **Consequence:** the SDK does **not** throw `CoylProtocolError` on a
  denial — callers must branch on `res.decision`. A thrown error means a
  real transport/auth failure. This is documented on `UAPClient.execute`.

## 5. Reversibility has a THIRD value: `reversible_within_window`

- **Spec (§3, §5):** only `reversible` and `irreversible` appear.
- **Implementation:** the handler validates against
  `reversible | irreversible | reversible_within_window` and rejects
  anything else with `invalid_reversibility`. The SDK's `Reversibility`
  type includes all three. (The demo uses `reversible_within_window` to
  get a *signed representation action* that clears the irreversibility
  floor — see note 8.)

## 6. Rule kinds: live set is broader, and one parses-but-isn't-enforced

- **Spec (§5):** shows `spending_cap`, `quiet_hours`, `irreversible_floor`.
- **Implementation (`lib/uap/types.ts` `UAPRuleKind`, `/rule` route):**
  accepts seven kinds: the three above plus `recipient_allowlist`,
  `recipient_denylist`, `frequency_cap`, `time_of_day_block`.
- **`frequency_cap` is accepted and stored but NOT enforced** by the
  coordinator (explicit `TODO(v0.2)` in `coordinator.ts` — needs a
  historical audit query). Treat it as a no-op until v0.2.
- **`quiet_hours` rule shape differs from spec.** Spec shows
  `{ from, to, tz }`; the coordinator only reads `{ disabled?: boolean }`
  as an opt-out marker — the actual window lives on the User row, not the
  rule. The `from/to/tz` form is ignored.
- **`spending_cap`** reads `params.max_per_action_usd` and the action's
  `params.amount_usd`, and only applies to `purchase` / `payment` kinds.

## 7. DELETE /grant/[id] response uses camelCase `terminatedAt`

- **Implementation:** every other UAP response is snake_case, but the
  revoke response returns `{ grant_id, status, terminatedAt }` — note the
  camelCase `terminatedAt` and a lower-cased `status` string (e.g.
  `"revoked"`). The SDK's `RevokeGrantResponse` matches this exactly.
  Inconsistency worth normalizing to `terminated_at` in v0.2.

## 8. Provenance is attached to ANY allowed representation action, not gated on reversibility

- **Spec (§5.5, §3):** says provenance is required for representation
  actions, implying irreversible sends carry it.
- **Implementation:** but irreversible representation actions
  (`send_message` + `irreversible`) hit the irreversibility floor FIRST
  and return `needs_per_action_confirmation` — they are never executed, so
  they are never signed. Provenance is only minted on a representation
  action that is actually **allowed** (e.g. `reversible` or
  `reversible_within_window`). The SDK reflects this: `provenance` is only
  present on `{ decision: 'allowed' }` EXECUTE responses.

## 9. EAP device/register: snake_case top level, camelCase manifest

- **Spec / README:** the README shows the pending-actions response but
  not the register request keys.
- **Implementation (`device/register/route.ts`):** the handler reads
  camelCase top-level keys (`userId`, `deviceClass`, `deviceFingerprint`,
  `operationalState`, `pushToken`) and a camelCase manifest
  (`{ sensors, actuators, userGrantedScopes }`). The SDK accepts a
  snake_case public input (`EAPDeviceManifest`) and maps it to the
  camelCase wire shape internally, so SDK callers use idiomatic
  snake_case.

## 10. EAP poll + sensor-publish endpoints landed mid-session — SDK reconciled

- The README marked `GET .../pending-actions` and
  `POST .../sensor/{deviceId}/publish` ⚠️ NOT YET. The parallel EAP agent
  **shipped both during this session**; the SDK is now reconciled against
  the live handlers.
- **Route param naming:** the pending-actions segment is `devices/[id]`
  (not `[userId]` / `[deviceId]`) — Next.js requires one param name per
  segment level and the fleet route already owns `devices/[id]`. The
  handler reads `id` AS a deviceId. The URL the SDK builds
  (`/api/eap/v1/devices/<deviceId>/pending-actions`) is unaffected.
- **pending-actions nullability:** `scopeRequested`, `reasoning`,
  `confidence`, and `llmPartnerId` are surfaced from nullable DB columns,
  so they can be `null` on the wire. The SDK's `EAPPendingAction` types
  them as `… | null` (the README sample showed them as always-present).
- **willExecuteAt has NO fractional seconds:** the handler strips
  milliseconds (`…:00Z`, not `…:00.300Z`) because the macOS Swift decoder
  (`JSONDecoder.iso8601`) rejects fractional seconds. The SDK types it as
  a plain string; consumers should not assume millisecond precision.

## 11. EAP sensor-publish envelope is `{ snapshot, asOf }` (NOT `{ readings, capturedAt }`)

- The live `POST .../sensor/{deviceId}/publish` handler's canonical body
  is `{ snapshot, asOf }` (matching `SensorPublisher.swift`'s
  `SnapshotPayload`). It also tolerates the alias `{ sensors, capturedAt }`.
  It does **not** accept a `readings` key — a body keyed on `readings`
  fails validation with `missing_snapshot`.
- The SDK's `EAPSensorSnapshot` uses the canonical `{ snapshot, asOf }`
  shape and sends it verbatim. (An earlier draft of this SDK guessed
  `{ readings, capturedAt }` before the route existed; it was corrected
  once the handler landed.)
- `snapshot` is an arbitrary string-keyed object (sensor name → opaque
  value); the server stores only the latest, clamped to ≤8KB serialized
  (a larger body → 413). The publish loop is also the device heartbeat.

## 12. EXECUTE outcome callback (`OUTCOME`) is not a UAP route

- **Spec (§7):** the coordinator sketch references a partner "OUTCOME
  callback within 30 seconds."
- **Implementation:** there is no `/api/uap/v1/outcome` route. UAP audit
  rows are written synchronously inside EXECUTE; the EAP outcome loop
  (`/api/eap/v1/action/outcome`) is the only outcome surface, and it
  belongs to EAP, not UAP. The SDK does not expose a UAP outcome method.

## 13. Partner auth: UAP key is a SEPARATE credential from the PAP/EAP key

- **Implementation (`uap-partner-auth.ts`, `mint-uap-key` route):** a
  partner row carries `apiKeyHash` (PAP/EAP, prefix `coyl_pap_`) and
  `uapApiKeyHash` (UAP, prefix `coyl_uap_`) independently. A valid PAP key
  will get 401 on UAP routes if no UAP key has been minted. The SDK's
  `partnerToken` is the `coyl_uap_*` form for `UAPClient` and the
  `coyl_pap_*` form for `EAPDeviceClient.registerDevice`. See the README
  auth table.

## 14. Default origin is `https://www.coyl.ai` (www), not `coyl.ai`

- **Spec:** URLs in the doc use bare `coyl.ai`.
- **Production:** `coyl.ai` 307-redirects to `www.coyl.ai`, which is
  canonical. The SDK defaults `baseUrl` to `https://www.coyl.ai` to avoid
  a redirect hop (and the body-dropping that some redirects cause on
  POST). Note the grant/audit URLs the server *returns* are derived from
  the request origin, so they'll reflect whatever host you call.
