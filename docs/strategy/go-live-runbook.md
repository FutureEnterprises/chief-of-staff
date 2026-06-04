# COYL — go-live runbook (consumer craze)

*The tactical checklist to flip from "code shipped" to "users flowing."
Sits beneath `path-to-100m-arr.md` (the strategy). Owner: founder.
Last updated June 2026.*

---

## What is code-complete and deploying right now

| Piece | State | Where |
|---|---|---|
| 90-second audit → archetype reveal | ✅ live | `/audit` |
| Craze share card (9:16, rarity "1 in N" pill, Web-Share) | ✅ live | `/card/[slug]` |
| **Viral loop wired** (audit reveal → card → share + waitlist) | ✅ just shipped | reveal block in audit-view |
| Invite-only waitlist + line-jump referrals | ✅ live | `/waitlist` |
| **Waitlist confirmation email** (position + invite link) | ✅ just shipped | `api/v1/waitlist` |
| `/waitlist` in nav (desktop + mobile), hero, footer | ✅ just shipped | landing components |
| **Marketing agent** (daily drafts → approval queue) | ✅ just shipped | `/admin/marketing` + cron |
| PostHog telemetry (`audit.started/completed/shared`) | ✅ live (verify ↓) | CSP fixed last session |

**Canonical host is `www.coyl.ai`** (apex `coyl.ai` 307-redirects to www).

---

## THE GO-LIVE SEQUENCE

### STEP 1 — Confirm the deploy + smoke-test the loop *(15 min, today)*
1. Vercel dashboard → confirm the latest deploy (commit `1a3cab8`) is **Ready**.
2. In a fresh/incognito window, walk the whole loop on **www.coyl.ai**:
   - Take `/audit` → finish it → confirm the new **"Get your [archetype] card. Claim your spot."** block appears at the reveal.
   - Click **"See your card + claim your spot"** → lands on `/card/[slug]` (rarity pill + share buttons).
   - Click the waitlist CTA → `/waitlist?archetype=…` → enter a real email → confirm you see **"You're #N"**.
   - **Check your inbox** — the confirmation email (position + invite link) should arrive within ~1 min.
3. Confirm nav shows **"Waitlist"**, the hero shows **"Request an invite →"**, the footer shows **"Join the waitlist."**

> If the email doesn't arrive → Step 2 (Resend domain). Everything else working but no email = a Resend config issue, not a code issue.

### STEP 2 — Verify the 6 env vars in Vercel (Production) *(10 min)*
Most already exist (other features use them). Confirm each is set on **Production**:

| Var | Used by | Note |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | invite links, OG, emails | **Set to `https://www.coyl.ai`** (the canonical host) so links don't take the apex→www hop. |
| `RESEND_API_KEY` | waitlist + audit emails | — |
| `RESEND_FROM_EMAIL` | waitlist email "from" | e.g. `COYL <hello@coyl.ai>`. **The from-domain must be verified in Resend** or sends silently fail. |
| `CRON_SECRET` | marketing agent + all crons | already set |
| `ANTHROPIC_API_KEY` | marketing-draft generation | already set |
| PostHog key + host | analytics | already set |

### STEP 3 — Verify analytics actually fire in prod *(10 min)*
1. Incognito → take the audit → share a card.
2. PostHog → Activity / Events → confirm **`audit.started`**, **`audit.completed`**, **`audit.shared`** land with the archetype properties.
3. If nothing lands: check the browser console for CSP/network errors on `*.posthog.com` (was fixed last session — this is the confirmation).

### STEP 4 — Seed the marketing queue + post the first drafts *(15 min)*
1. Manually trigger the agent once (don't wait for 13:00 UTC):
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://www.coyl.ai/api/cron/marketing-generate
   ```
   Response shows what it generated + anything it skipped.
2. Open `/admin/marketing` → read the drafts → **Approve** the good ones → post each to its platform → **Mark posted**.
3. From here it self-stocks daily (3/run, capped at 12 pending). Your only job is approve + post.

### STEP 5 — Open access in waves *(both modes now shipped)*
The full gated flow is built: **`/admin/waitlist`** shows counts + an
**"Open a wave"** control. Granting the next N people sets `grantedAt`,
emails each a **claim link** (`/redeem/[code]` → marks redeemed, drops
the access cookie, lands them in sign-up).

Pick your mode:
- **(A) Open** *(default, ship today)* — leave `WAITLIST_GATE_ENABLED`
  unset. `/sign-up` stays open; the waitlist is hype + referral capture;
  granting still emails usable invites. Zero risk.
- **(B) Gated** *(max FOMO)* — set `WAITLIST_GATE_ENABLED="true"` in
  Vercel. Now the bare `/sign-up` requires a redeemed invite; consumers
  must come through a wave. **Before flipping it: confirm your B2B/
  clinical onboarding carries a Clerk invitation ticket or a bypass ref**
  (team/clinical/partner/org — see `WAITLIST_GATE_BYPASS_REFS`),
  otherwise it gates them too. Test `/sign-up` in incognito after
  enabling.

To run a wave (either mode): `/admin/waitlist` → enter N → **Grant** →
the N people by effective position (line-jumpers first) get the "you're
in" email.

### STEP 6 — Mobile app → TestFlight *(parallel; you run the builds)*
The web craze can launch without the app. When ready:
1. `eas build --platform ios` and `--platform android` (eas.json exists).
2. Submit to TestFlight + Play internal track.
3. App Store listing in **Lifestyle** (NOT Health — avoids medical-device disclosure). Title with the primary keyword, 5 screenshots = the archetype cards, 15-sec preview. *(I can draft the listing copy + ASO keywords on request.)*

### STEP 7 — Founder gates that block the PUBLIC launch
These don't block the soft/quiet loop, but they block paid acquisition + press:
1. **GCT General Counsel clearance** (outside-CEO/Chairman role, SEC disclosure). #1 gate.
2. **Hire the growth operator** — the content engine can't run on you alone.
3. Keep the **clinical track** alive (RCT enrollment, GLP-1 essay, 3 provisional patents).

### STEP 8 — Launch sequence *(once 1–7 are green)*
1. Seed **30–50 micro-influencers** (10K–50K, GLP-1/wellness) — each joins the waitlist and shares their invite link.
2. Faceless content engine: post the pre-made videos, all driving to `/audit`.
3. Approve the daily marketing drafts (Reddit value-posts stay **human-posted**).
4. Open access in **waves**; Spark-Ads only on organic posts already breaking.

---

## Known gaps — remaining

1. ✅ **Wave-grant email — now BUILT.** `/admin/waitlist` → "Open a wave"
   grants N people + emails each their `/redeem/[code]` claim link.
2. ✅ **Invite gating — now BUILT (opt-in).** `WAITLIST_GATE_ENABLED="true"`
   enforces invite-only at `/sign-up`; default off keeps it open. (Step 5.)
3. **Reddit auto-posting is intentionally NOT built** — the marketing agent drafts; a human posts. Auto-posting to the GLP-1 subs is a shadowban trap. (Safe auto-post for your *own* X/Threads/newsletter can be wired on request — adapter shells exist.)
4. **PostHog prod verification is manual** (Step 3) — the wiring is shipped, but "events land" needs one human confirmation.
5. **App Store HealthKit-weight decision** — `app.json` reads body weight
   from HealthKit, which conflicts with the NEDA-safe Lifestyle listing.
   See `docs/marketing/app-store-listing.md` decision #1 (recommend
   dropping the `weight` read for the consumer launch).

---

## The one-line status
The viral loop is wired end-to-end, the waitlist nurtures itself by email, and the content agent stocks your queue daily. **To go live this week: smoke-test the loop (Step 1), verify Resend + PostHog (Steps 2–3), post the first drafts (Step 4), decide gate-vs-open (Step 5).** The app + paid launch wait on the founder gates (Step 7).
