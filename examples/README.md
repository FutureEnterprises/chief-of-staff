# @coyl/protocol examples

Runnable demos for the [`@coyl/protocol`](../packages/protocol) SDK.

## `authority-demo.ts` — the COYL authority demo

A narrated, end-to-end walk through UAP standing authority:

1. **GRANT** a 7-day scoped grant (`proactive_relational` +
   `proactive_food` + `proactive_purchase`) with a `$50` spending cap and
   quiet-hours rules.
2. **PRECHECK + EXECUTE** a reversible action (`meal_suggestion`) →
   allowed + audited.
3. **EXECUTE** an irreversible representation action (`send_message`,
   `reversibility: 'irreversible'`) → **DENIED** with
   `needs_per_action_confirmation`. *This failing-closed is the demo.*
4. **PROVENANCE** — execute a reversible representation action so it gets
   signed, then verify its cryptographic provenance via the public,
   unauthenticated verifier endpoint.
5. **KILL_SWITCH** — kill all standing authority, then attempt one more
   EXECUTE and watch it get denied — proving standing authority is dead.

Every step is wrapped: a server-side failure prints the real error and
the demo continues, so it degrades informatively against a coordinator
missing pieces.

### Run it

```bash
# from the repo root
pnpm install

COYL_BASE_URL=https://www.coyl.ai \
COYL_UAP_PARTNER_TOKEN='coyl_uap_<partnerId>_<secret>' \
COYL_USER_ID='u_2sj8xks0a' \
COYL_USER_SESSION_TOKEN='<clerk-session-token>' \
  pnpm --filter @coyl/examples authority-demo

# or directly with tsx:
cd examples && pnpm exec tsx authority-demo.ts
```

### Environment

| Var | Required | Purpose |
|---|---|---|
| `COYL_BASE_URL` | no | Coordinator origin. Default `https://www.coyl.ai`. Use `http://localhost:3000` against a local dev server. |
| `COYL_UAP_PARTNER_TOKEN` | **yes** | The UAP partner Bearer secret, `coyl_uap_<partnerId>_<secret>`. See below. |
| `COYL_USER_ID` | **yes** | The COYL user id the grant is issued for (the internal `User.id`, a cuid — *not* the Clerk id). |
| `COYL_USER_SESSION_TOKEN` | no | Clerk session token. If set, the demo fires the real kill-switch (step 5). If absent, it prints the `curl` to run yourself. |

---

## How to get a UAP partner token (the real mechanism)

UAP partner credentials are **distinct** from PAP/EAP credentials. On the
`LLMPartner` row:

- `apiKeyHash` holds the **PAP/EAP** key (wire prefix `coyl_pap_`).
- `uapApiKeyHash` holds the **UAP** key (wire prefix `coyl_uap_`).

They are minted and rotated independently. A valid PAP key will get a
`401` on UAP routes if no UAP key has been minted for the partner.

**Minting:** a COYL admin (allowlisted via `ADMIN_USER_IDS`) calls:

```
POST /api/admin/llm-partners/{partnerId}/mint-uap-key
```

The response returns the plaintext token **exactly once**:

```json
{ "apiKey": "coyl_uap_<partnerId>_<64-hex-secret>", "wasRotation": false }
```

Mechanics (from `apps/web/src/app/api/admin/llm-partners/[id]/mint-uap-key/route.ts`
and `apps/web/src/lib/llm-partner-keys.ts`):

- The secret is `crypto.randomBytes(32)` → 64 hex chars.
- Server-side, only the **bcrypt hash** (cost 12) is stored, in
  `uapApiKeyHash`. The plaintext is never persisted.
- The wire token is `coyl_uap_<partnerId>_<secret>`. The server parses it
  in `lib/uap/uap-partner-auth.ts`: it splits on the prefix, looks up the
  partner by id, checks `active`, and verifies the secret against
  `uapApiKeyHash`.
- Re-POSTing the mint endpoint **rotates** the UAP key in place (the old
  secret is invalidated atomically); the PAP key is untouched.

So: ask a COYL admin to run the mint endpoint for your partner row, copy
the `apiKey` from the response, and set it as `COYL_UAP_PARTNER_TOKEN`.

> The partner id is the `LLMPartner.id` (a cuid). It is also the middle
> segment of the token itself, so you can read it back out of any
> `coyl_uap_<id>_<secret>` string.

---

## What runs against production *today*

`https://www.coyl.ai` has the full UAP surface live. With a **real**
minted `coyl_uap_*` token and a **real** `COYL_USER_ID`:

- Steps **1–4 succeed**: grant issues, the reversible execute is allowed
  and audited, the irreversible send is correctly denied with
  `needs_per_action_confirmation`, and provenance verifies via the public
  endpoint.
- Step **5** (kill-switch) needs `COYL_USER_SESSION_TOKEN`; without it the
  demo prints the `curl` instead.

With a **dummy** token (no real partner), step 1 returns a real `401`
from production and the demo cleanly skips the dependent steps — which is
itself a useful proof that the routes are live and auth is enforced.

The public `verifyProvenance` endpoint is already live and unauthenticated
— `GET /api/uap/v1/provenance/{aud_…}` returns a real `404` JSON body for
a well-formed-but-unknown audit id.
