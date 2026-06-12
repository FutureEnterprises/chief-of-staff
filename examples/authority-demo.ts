/**
 * examples/authority-demo.ts — the COYL authority demo.
 *
 *   npx tsx examples/authority-demo.ts
 *
 * A runnable, narrated walk through UAP standing authority against a
 * live (or local) COYL coordinator. It demonstrates the whole trust
 * contract in one script:
 *
 *   1. GRANT      — issue a scoped, expiring, rule-bounded standing grant
 *   2. PRECHECK + EXECUTE a reversible action      → allowed, audited
 *   3. EXECUTE an irreversible representation action → DENIED (fail-closed)
 *   4. PROVENANCE — verify the cryptographic provenance of an action
 *   5. KILL_SWITCH — kill all authority, then prove the next EXECUTE dies
 *
 * Each step is wrapped so a server-side failure prints the real error and
 * the demo keeps going — it degrades informatively against a coordinator
 * that is missing pieces.
 *
 * ── Environment ───────────────────────────────────────────────────────
 *   COYL_BASE_URL              default https://www.coyl.ai
 *   COYL_UAP_PARTNER_TOKEN     required — coyl_uap_<partnerId>_<secret>
 *   COYL_USER_ID               required — the COYL user id (u_… / cuid)
 *   COYL_USER_SESSION_TOKEN    optional — Clerk session token; enables the
 *                              live kill-switch step (else we print the curl)
 *
 * See examples/README.md for how to obtain each value.
 */

import {
  UAPClient,
  CoylProtocolError,
  type UAPScope,
  type ExecuteRequest,
  type ExecuteResponse,
} from '@coyl/protocol'

/* ──────────────────── tiny console helpers ──────────────────── */

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'

function step(n: number, title: string): void {
  console.log(`\n${BOLD}${CYAN}── Step ${n}: ${title}${RESET}`)
}

function ok(msg: string): void {
  console.log(`  ${GREEN}✓${RESET} ${msg}`)
}

function info(msg: string): void {
  console.log(`  ${DIM}${msg}${RESET}`)
}

function warn(msg: string): void {
  console.log(`  ${YELLOW}⚠${RESET}  ${msg}`)
}

function fail(msg: string): void {
  console.log(`  ${RED}✗${RESET} ${msg}`)
}

/** Print a CoylProtocolError (or any thrown value) without crashing. */
function printError(err: unknown): void {
  if (err instanceof CoylProtocolError) {
    fail(`server error ${err.status} [${err.code}]: ${err.message}`)
    if (err.detail !== undefined) {
      info(`detail: ${JSON.stringify(err.detail)}`)
    }
  } else if (err instanceof Error) {
    fail(err.message)
  } else {
    fail(String(err))
  }
}

/** Pretty-print a decision body (the non-error 200 case). */
function printDecision(res: ExecuteResponse): void {
  if (res.decision === 'allowed') {
    ok(`decision = allowed`)
    if ('audit_id' in res) info(`audit_id = ${res.audit_id}`)
    if ('provenance' in res && res.provenance) {
      info(`provenance attached (representation action)`)
    }
  } else if (res.decision === 'needs_per_action_confirmation') {
    ok(`decision = needs_per_action_confirmation (reason: ${res.reason})`)
    if ('detail' in res && res.detail) info(`detail: ${res.detail}`)
    if ('audit_id' in res) info(`audit_id = ${res.audit_id}`)
  } else {
    // denied
    ok(`decision = denied (reason: ${res.reason})`)
    if ('detail' in res && res.detail) info(`detail: ${res.detail}`)
    if ('audit_id' in res && res.audit_id) info(`audit_id = ${res.audit_id}`)
  }
}

/* ──────────────────── config ──────────────────── */

const baseUrl = process.env.COYL_BASE_URL ?? 'https://www.coyl.ai'
const partnerToken = process.env.COYL_UAP_PARTNER_TOKEN
const userId = process.env.COYL_USER_ID
const userSessionToken = process.env.COYL_USER_SESSION_TOKEN

function requireEnv(): { partnerToken: string; userId: string } {
  const missing: string[] = []
  if (!partnerToken) missing.push('COYL_UAP_PARTNER_TOKEN')
  if (!userId) missing.push('COYL_USER_ID')
  if (missing.length > 0) {
    console.error(
      `\n${RED}Missing required env: ${missing.join(', ')}${RESET}\n` +
        `See examples/README.md for how to obtain them.\n`
    )
    process.exit(1)
  }
  // Narrowed by the guard above.
  return { partnerToken: partnerToken as string, userId: userId as string }
}

/* ──────────────────── the demo ──────────────────── */

async function main(): Promise<void> {
  const env = requireEnv()
  const uap = new UAPClient({ baseUrl, partnerToken: env.partnerToken })

  console.log(`${BOLD}COYL Authority Demo${RESET}`)
  info(`coordinator: ${baseUrl}`)
  info(`user_id:     ${env.userId}`)
  info(
    `kill-switch: ${
      userSessionToken ? 'live (session token present)' : 'curl-only (no session token)'
    }`
  )

  // Carries forward between steps. Null until step 1 succeeds.
  let grantId: string | null = null
  // The audit id of the executed representation/reversible action, for
  // the provenance step.
  let provenanceAuditId: string | null = null

  /* ── Step 1: GRANT ─────────────────────────────────────────────── */
  step(1, 'GRANT — issue a 7-day scoped standing grant')
  {
    // Real scope vocabulary (NOT the spec doc's calendar.write/messaging.routine).
    // proactive_relational  → gates send_message (our irreversible demo)
    // proactive_food        → gates meal_suggestion (our reversible demo)
    // proactive_purchase    → gates purchase/payment (carries the $50 cap)
    const scopes: UAPScope[] = ['proactive_relational', 'proactive_food', 'proactive_purchase']
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    try {
      const grant = await uap.grant({
        user_id: env.userId,
        scopes,
        expires_at: sevenDays.toISOString(),
        rules: [
          // Spending cap — applies to purchase/payment kinds.
          { kind: 'spending_cap', params: { max_per_action_usd: 50 } },
          // Quiet hours — opt-out marker shape the engine understands.
          { kind: 'quiet_hours', params: { disabled: false } },
        ],
        consent_artifact: {
          version: 'uap-0.1.1',
          shown_to_user_at: new Date().toISOString(),
          user_response: 'explicit_grant',
          ui_surface: 'examples/authority-demo',
        },
      })
      grantId = grant.grant_id
      ok(`granted scopes [${scopes.join(', ')}], expires in 7 days`)
      info(`grant_id  = ${grant.grant_id}`)
      info(`audit_url = ${grant.audit_url}`)
      info(`kill_url  = ${grant.kill_switch_url}`)
    } catch (err) {
      printError(err)
      warn('cannot continue without a grant — remaining steps will be skipped')
    }
  }

  /* ── Step 2: PRECHECK then EXECUTE a reversible action ──────────── */
  step(2, 'PRECHECK + EXECUTE a reversible action (meal_suggestion)')
  if (!grantId) {
    warn('skipped — no grant from step 1')
  } else {
    const reversibleAction: ExecuteRequest = {
      grant_id: grantId,
      action: {
        kind: 'meal_suggestion',
        operation: 'suggest_lunch',
        reversibility: 'reversible',
        params: { suggestion: 'grain bowl', restaurant: 'Sweetgreen' },
      },
      context: { trigger: 'morning_planning_routine', confidence: 0.88 },
    }
    // PRECHECK — pure decision, no audit row.
    try {
      const pre = await uap.precheck(reversibleAction)
      ok(`precheck decision = ${pre.decision}`)
    } catch (err) {
      printError(err)
    }
    // EXECUTE — should be allowed + audited.
    try {
      const res = await uap.execute(reversibleAction)
      printDecision(res)
      if (res.decision === 'allowed' && 'audit_id' in res) {
        // meal_suggestion is NOT a representation action, so no provenance.
        info('(internal action — no provenance signature, as expected)')
      }
    } catch (err) {
      printError(err)
    }
  }

  /* ── Step 3: EXECUTE an irreversible representation action ──────── */
  step(3, 'EXECUTE an irreversible action (send_message) — expect DENIAL')
  info('this fail-closed denial is the whole point of the protocol')
  if (!grantId) {
    warn('skipped — no grant from step 1')
  } else {
    const irreversibleAction: ExecuteRequest = {
      grant_id: grantId,
      action: {
        kind: 'send_message',
        operation: 'send_dm',
        reversibility: 'irreversible',
        params: { body: 'Running 10 min late — start without me.' },
      },
      context: { trigger: 'calendar_conflict_detected', confidence: 0.91 },
      recipient: { kind: 'external_email', hint: 'colleague@example.com' },
    }
    try {
      const res = await uap.execute(irreversibleAction)
      printDecision(res)
      if (res.decision === 'needs_per_action_confirmation') {
        ok(
          'standing authority correctly REFUSED to send irreversibly — ' +
            'per-action confirmation required'
        )
        if ('audit_id' in res && res.audit_id) {
          // The denial is itself audited; we can verify-provenance against
          // an ALLOWED representation action only, so we don't reuse this id.
          info(`denial was audited: ${res.audit_id}`)
        }
      } else if (res.decision === 'allowed') {
        warn(
          'action was ALLOWED — the irreversibility floor did not fire. ' +
            'Check the coordinator config.'
        )
        if ('audit_id' in res) provenanceAuditId = res.audit_id
      }
    } catch (err) {
      printError(err)
    }
  }

  /* ── Step 3b: a reversible representation action (to get provenance) ─ */
  // The irreversible send is (correctly) denied, so it never produces a
  // signed provenance envelope. To demonstrate verifyProvenance against a
  // REAL signed action, we execute the same representation kind with
  // reversibility 'reversible_within_window' — a representation action
  // that clears the floor and therefore gets signed.
  step(4, 'PROVENANCE — execute a reversible representation action, then verify')
  if (!grantId) {
    warn('skipped — no grant from step 1')
  } else {
    const signableAction: ExecuteRequest = {
      grant_id: grantId,
      action: {
        kind: 'send_message',
        operation: 'send_dm',
        reversibility: 'reversible_within_window',
        params: { body: 'Confirming our 3pm. (revocable within window)' },
      },
      context: { trigger: 'calendar_confirm', confidence: 0.95 },
      recipient: { kind: 'external_email', hint: 'colleague@example.com' },
    }
    try {
      const res = await uap.execute(signableAction)
      printDecision(res)
      if (res.decision === 'allowed' && 'provenance' in res && res.provenance) {
        provenanceAuditId = res.audit_id
        ok('representation action allowed + provenance-signed')
        info(`provenance.agent   = ${res.provenance.payload.agent}`)
        info(`provenance.subject = ${res.provenance.payload.subject}`)
        info(`signature (head)   = ${res.provenance.signature.slice(0, 24)}…`)
      } else if (res.decision === 'allowed') {
        warn('allowed but no provenance envelope returned')
      }
    } catch (err) {
      printError(err)
    }

    // Now verify it via the PUBLIC provenance endpoint (no auth).
    if (provenanceAuditId) {
      try {
        const prov = await uap.verifyProvenance(provenanceAuditId)
        ok(`verified provenance for ${prov.audit_id}`)
        info(`grant_status = ${prov.grant_status}`)
        info(`action_kind  = ${prov.payload.action_kind}`)
        info(`public_key   = ${prov.public_key.slice(0, 24)}…`)
        info(`audit_url    = ${prov.payload.audit_url}`)
      } catch (err) {
        printError(err)
      }
    } else {
      warn('no signed audit_id to verify — skipping provenance fetch')
    }
  }

  /* ── Step 5: KILL_SWITCH, then prove authority is dead ─────────── */
  step(5, 'KILL_SWITCH — kill all authority, then prove the next EXECUTE dies')
  if (!userSessionToken) {
    warn('COYL_USER_SESSION_TOKEN not set — printing the curl to run it yourself:')
    console.log(
      `\n${DIM}  curl -X POST '${baseUrl}/api/uap/v1/kill-switch' \\\n` +
        `    -H 'Authorization: Bearer <YOUR_CLERK_SESSION_TOKEN>' \\\n` +
        `    -H 'Content-Type: application/json' \\\n` +
        `    -d '{"user_id":"${env.userId}","reason":"demo"}'${RESET}\n`
    )
  } else {
    try {
      const kill = await uap.killSwitch({
        userSessionToken,
        userId: env.userId,
        reason: 'authority_demo',
      })
      ok(`kill switch fired at ${kill.killed_at}`)
      info(`affected grants: ${kill.affected_grant_ids.length}`)
      info(`audit_url = ${kill.audit_url}`)
    } catch (err) {
      printError(err)
    }
  }

  // One more EXECUTE — must now be denied (grant killed / global kill).
  if (grantId && userSessionToken) {
    info('attempting one more EXECUTE under the (now-killed) grant…')
    try {
      const res = await uap.execute({
        grant_id: grantId,
        action: {
          kind: 'meal_suggestion',
          operation: 'suggest_dinner',
          reversibility: 'reversible',
        },
        context: { trigger: 'post_kill_probe', confidence: 0.9 },
      })
      printDecision(res)
      if (res.decision === 'denied') {
        ok('standing authority is DEAD — post-kill EXECUTE correctly denied')
      } else {
        warn(`expected a denial after kill, got ${res.decision}`)
      }
    } catch (err) {
      printError(err)
    }
  } else if (grantId) {
    info('skipping post-kill probe (kill switch was not actually fired)')
  }

  console.log(`\n${BOLD}Demo complete.${RESET}\n`)
}

main().catch((err) => {
  // Last-resort guard — main() already wraps each step, but a thrown
  // value from requireEnv/construction lands here.
  printError(err)
  process.exit(1)
})
