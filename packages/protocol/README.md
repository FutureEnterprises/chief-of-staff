# @coyl/protocol

Typed TypeScript SDK for the **COYL protocol stack** — the trust
infrastructure under autonomous AI action.

- **`UAPClient`** — User-Authority Protocol: standing, scoped, expiring
  grants an LLM partner acts under *without per-action user presence*.
  Grant / precheck / execute / revoke / declare-rule / audit /
  kill-switch / provenance.
- **`EAPDeviceClient`** — Execution Action Protocol (device side):
  register a device, poll for approved actions, report outcomes, publish
  sensor snapshots.

Zero runtime dependencies. Targets native `fetch` — Node ≥18, browsers,
Deno, and edge runtimes.

> ⚠️ **Alpha (`0.1.0-alpha.1`).** Wire shapes may change before `1.0`.
> This SDK is typed against the **live route handlers**, not the spec
> prose — see [`SPEC_NOTES.md`](./SPEC_NOTES.md) for every place the
> implementation diverges from
> [`docs/protocol/UAP-0.1.md`](../../docs/protocol/UAP-0.1.md).

---

## Install

Inside this monorepo (workspace):

```jsonc
// package.json
{ "dependencies": { "@coyl/protocol": "workspace:*" } }
```

Future (when the founder publishes to npm):

```bash
npm i @coyl/protocol
# or: pnpm add @coyl/protocol
```

---

## Auth model

Pick the right credential per surface. Mixing them up is the #1
integration error.

| Surface / method | Authenticated as | Credential |
|---|---|---|
| `UAPClient.grant` / `precheck` / `execute` / `getGrant` | **Partner** | Bearer `coyl_uap_<partnerId>_<secret>` |
| `UAPClient.revokeGrant` / `declareRule` / `queryAudit` | **User** | Clerk user session token (passed per-call) |
| `UAPClient.killSwitch` | **User** | Clerk user session token — *not* the partner token |
| `UAPClient.verifyProvenance` | **Public** | none — recipient-facing, unauthenticated |
| `EAPDeviceClient.registerDevice` | **Partner** | Bearer `coyl_pap_<partnerId>_<secret>` (PAP/EAP key) |
| `EAPDeviceClient.reportOutcome` | **Capability** | none — the single-use `executionToken` authorizes it |
| `EAPDeviceClient.pollPendingActions` / `publishSensors` | **Device** | Bearer device token (Clerk JWT in bootstrap, then EAP device token) |

UAP partner keys (`coyl_uap_*`) are a **separate credential** from the
PAP/EAP key (`coyl_pap_*`) on the same partner row. A PAP key gets `401`
on UAP routes. See `SPEC_NOTES.md` #13.

To get a UAP partner token, a COYL admin mints one via
`POST /api/admin/llm-partners/{id}/mint-uap-key` — the plaintext
`coyl_uap_<id>_<secret>` is returned exactly once. See
[`examples/README.md`](../../examples/README.md).

---

## Quickstart — `UAPClient`

```ts
import { UAPClient } from '@coyl/protocol'

const uap = new UAPClient({
  baseUrl: 'https://www.coyl.ai', // default; omit for production
  partnerToken: process.env.COYL_UAP_PARTNER_TOKEN, // coyl_uap_<id>_<secret>
})

// 1. Issue a 7-day standing grant (PARTNER auth).
const grant = await uap.grant({
  user_id: 'u_2sj8xks0a',
  scopes: ['proactive_relational', 'proactive_food', 'proactive_purchase'],
  expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
  rules: [{ kind: 'spending_cap', params: { max_per_action_usd: 50 } }],
  consent_artifact: { user_response: 'explicit_grant', ui_surface: 'settings' },
})

// 2. Execute a reversible action — allowed + audited.
const res = await uap.execute({
  grant_id: grant.grant_id,
  action: { kind: 'meal_suggestion', operation: 'suggest', reversibility: 'reversible' },
  context: { trigger: 'routine', confidence: 0.9 },
})
if (res.decision === 'allowed') console.log('audit:', res.audit_id)

// 3. Irreversible representation action → DENIED (per-action confirm). Fail-closed.
const sent = await uap.execute({
  grant_id: grant.grant_id,
  action: { kind: 'send_message', operation: 'dm', reversibility: 'irreversible' },
  recipient: { kind: 'external_email', hint: 'a@example.com' },
})
console.log(sent.decision) // 'needs_per_action_confirmation'

// 4. Verify provenance of an executed representation action (PUBLIC, no auth).
//    (auditId comes from an *allowed* representation EXECUTE.)
// const prov = await uap.verifyProvenance('aud_…')

// 5. Kill all standing authority (USER auth — needs the session token).
// await uap.killSwitch({ userSessionToken, userId: 'u_2sj8xks0a' })
```

A denial is a **successful HTTP-200 response** carrying a `decision`, not
a thrown error — branch on `res.decision`. `CoylProtocolError` is thrown
only for transport / auth / validation failures (`4xx`/`5xx`).
See `SPEC_NOTES.md` #4.

---

## Quickstart — `EAPDeviceClient`

```ts
import { EAPDeviceClient } from '@coyl/protocol'

const eap = new EAPDeviceClient({
  baseUrl: 'https://www.coyl.ai',
  deviceToken: process.env.COYL_EAP_DEVICE_TOKEN, // PAP key for register; device token for poll
})

// 1. Register this device into the user's fleet (idempotent on fingerprint).
const { device } = await eap.registerDevice({
  user_id: 'u_2sj8xks0a',
  device_class: 'macos_laptop',
  device_fingerprint: 'fp_abc123',
  manifest: {
    sensors: ['battery', 'foreground_app'],
    actuators: ['notification', 'voice_tts'],
    userGrantedScopes: ['edge:laptop:notification'],
  },
})

// 2. Poll for approved actions.
const { actions } = await eap.pollPendingActions(device.id)

// 3. Execute locally, then report the outcome (authorized by executionToken).
for (const a of actions) {
  await eap.reportOutcome(a.executionToken, { outcome: 'executed', userInteracted: true })
}

// 4. Publish a sensor snapshot. Canonical envelope is { snapshot, asOf }.
await eap.publishSensors(device.id, {
  snapshot: { battery: { percent: 82 }, screen_state: { displayOn: true } },
})
```

The sensor-publish body is `{ snapshot, asOf }` (NOT `{ readings, … }`) —
the server clamps `snapshot` to ≤8KB. See `SPEC_NOTES.md` #10–#11 for the
pending-actions nullability + ISO-8601-no-fraction details.

---

## Errors

Every `4xx`/`5xx` is normalized to `CoylProtocolError`:

```ts
import { CoylProtocolError } from '@coyl/protocol'

try {
  await uap.grant(/* … */)
} catch (err) {
  if (err instanceof CoylProtocolError) {
    console.error(err.status, err.code, err.message, err.detail)
    if (err.isAuthError) {/* 401/403 */}
    if (err.isNotFound) {/* 404 */}
  }
}
```

---

## Links

- Spec: [`docs/protocol/UAP-0.1.md`](../../docs/protocol/UAP-0.1.md)
- Threat model: [`docs/protocol/UAP-0.1-threat-model.md`](../../docs/protocol/UAP-0.1-threat-model.md)
- Irreversibility floor: [`docs/protocol/UAP-0.1-irreversibility-floor.md`](../../docs/protocol/UAP-0.1-irreversibility-floor.md)
- Implementation divergences: [`SPEC_NOTES.md`](./SPEC_NOTES.md)
- Runnable demo: [`examples/authority-demo.ts`](../../examples/authority-demo.ts)

Apache-2.0.
