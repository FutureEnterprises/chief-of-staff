# Founder Action Master List

> The single source of truth for everything ONLY YOU (the founder) can
> do. Sorted by urgency. Check items off as they land. Re-read top to
> bottom before any board call or investor meeting.
>
> Last updated: May 22, 2026
>
> Format: each item is a one-line task + (cost if any) + (time to
> complete) + (gating dependency).

---

## v3 EXTERNAL AUDIT — May 24, 2026

> External strategic assessment received from a third reader. Convergent
> with v1 + v2 on several findings, net-new on three. Engineering
> response shipped same day; founder-only items tracked below.

### Engineering (already shipped, today)
- [x] **Share-card title leads with stat** — `/a/[slug]` metadata title was `"<archetype> — my COYL autopilot"` even though the OG image already used the prevalence stat as eyebrow. Title now `"<archetype>: <signature script>"` so text-only link parsers (browser tab, twitter card fallback, OG description) lead with the viral element. (commit `207d151`)
- [x] **Terms page §3 — stale "task-tracking productivity platform" copy fixed.** Rewritten around behavioral support, danger-window interrupts, recovery flow, Autopilot Map. Explicit "behavioral support, not medical treatment" with link to /safety. Metadata description aligned. (commit `207d151`)
- [x] **WhatItCatches breadth band expanded 3→6 patterns + "same engine" line.** Addresses v3 concern that multiple vertical pages forced user self-segmentation, WITHOUT killing the multi-vertical engine moat. Added 3 new cards (work follow-through, decision-support, recovery) and a connective paragraph: *"Same coordinator. Different windows. COYL catches food at 9 PM, tab switches at 11 AM, follow-ups that drift past Thursday..."* (commit `472c723`)
- [x] **Autopilot Map MVP shipped — schema + cron + share page + OG render + signed-in page integration.** Real "Spotify Wrapped for self-sabotage" — the v3 critique's highest-leverage organic-growth ask, previously mockup-only. (5 files in 3 commits: `a778190`, `26d8883`, `ec109c5`)
  - New `AutopilotMapSnapshot` Prisma model + additive migration `20260524010000_autopilot_map_snapshot`
  - Weekly cron `/api/cron/autopilot-map-snapshot` (Mondays 6 AM UTC) aggregates top excuse, peak danger window, recovery rate, pattern signature from real `Excuse` + `SlipRecord` + `DangerWindow` data; upserts on `(userId, weekStart)`; per-user try/catch
  - Public share page `/m/[slug]` renders the 4-card snapshot (editorial cream + orange + charcoal); robots:noindex
  - OG image render `/api/og/autopilot-map/[slug]` returns 1200×630 PNG for Twitter / iMessage / Slack / LinkedIn previews; tombstone "this map has been revoked" fallback on missing snapshot
  - `/autopilot-map` page now renders signed-in users' real most-recent map above the existing marketing content via `<YourAutopilotMapBanner />` client component (Path B chosen — fetch via `/api/v1/autopilot-map/me` API route, defensive prisma access for cache-components compatibility)
  - Three-state UX: signed-out → unchanged marketing page; signed-in + no snapshot → "first map publishes Monday 6 AM UTC" banner; signed-in + snapshot → 4-card real-data section with share button

### V3 findings ALREADY DONE (not action — convergent signal validating rounds 2+3 work)
- [x] **Archetype OG image leads with prevalence stat** — shipped in round-3 audit. v3 reviewer was reading cached version.
- [x] **Protocols stripped from primary nav, footer-only + `/protocol` hub** — shipped in rounds 2+3. v3 reviewer was reading cached version.

### Founder action — convergent findings still on YOU
These items were flagged in v1, v2, AND v3 audits. Three separate readings, same diagnosis. Highest-leverage moves remaining:

- [ ] **(Item 6) One real advisor name on `/advisors`** — flagged in 4 audits now (v1 external, v2 founder-corrected, v3 external, recent marketing audit). Currently 6 cards saying "Seat open — confirming Q3 2026" — that's a public IOU with a deadline. Once Q3 closes without names, every returning visitor sees a missed promise. **Concrete sub-steps:**
  1. Pick ONE warm target — the ex-Novo-Nordisk pharma BD, the JITAI PhD candidate, an ex-Headspace VP, OR an FDA DTx expert (the last would also reinforce the UAP threat model)
  2. Send the warm intro request to whoever in your network knows them best (LinkedIn search → mutual connections → ask for introduction)
  3. First meeting: 30 min, pitch is "be the 1st named advisor in a 6-seat board; 0.1% equity vesting over 2 years; quarterly check-ins"
  4. Sign advisor agreement (Stripe Atlas + Carta have templates) and update `apps/web/src/app/(wedges)/advisors/page.tsx` line 71 area with the real name + photo + 1-line bio
  5. Total time: 1-2 weeks calendar, ~2 hrs of active founder work

- [ ] **(Item 7) Tier 0 revenue infrastructure** — Stripe live keys, Clerk production keys, DNS for deliverability, Vercel production env vars. **The `STRIPE_SECRET_KEY` in .env.local is literally `"sk_..."` placeholder**, and Clerk is on `pk_test_/sk_test_` dev keys. You cannot accept a dollar today. **Concrete sub-steps (~2.5 hrs total):**
  1. **Stripe — activate live mode** (60 min): Stripe dashboard → activate live mode → create products (COYL Core $12/mo, COYL Core Annual $99/yr, COYL GLP-1 Plus $19.99/mo) → copy live keys + price IDs into Vercel env (Production scope only)
  2. **Clerk — create production instance** (30 min): Clerk dashboard → create production instance for `coyl.ai` → copy `pk_live_*` + `sk_live_*` → set in Vercel Production env (the dev-key workaround in `proxy.ts` becomes redundant but harmless)
  3. **Vercel env vars** (20 min): set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET` in Production scope. (Build warns about the last two on every deploy.)
  4. **Stripe webhook → prod URL** (10 min): Stripe dashboard → Developers → Webhooks → add endpoint `https://coyl.ai/api/webhooks/stripe` → copy signing secret to `STRIPE_WEBHOOK_SECRET`
  5. **DNS for deliverability** (30 min): TXT records for SPF (`v=spf1 include:resend.com ~all`), DKIM (from Resend dashboard), DMARC (`v=DMARC1; p=quarantine; rua=mailto:postmaster@coyl.ai`)
  6. **End-to-end purchase smoke test** (20 min): buy Core on YOUR card → verify Clerk account upgraded to PRO → verify welcome email arrived → refund yourself in Stripe

### V3 findings I'm explicitly pushing back on
Documented here so you don't accept them uncritically:

- ⚠ **v3 said "pick one flagship wedge."** Doing this kills the multi-vertical engine moat — the entire defensibility argument is that the same coordinator catches food at 9pm AND tab switches at 11am AND late follow-ups. Going single-wedge reverts COYL to "a GLP-1 app" or "a productivity app" — both crowded categories with no protocol story. The fix shipped (WhatItCatches 6-pattern expansion) addresses the first-touch confusion concern WITHOUT collapsing the engine claim.
- ⚠ **v3 said "move protocol specs to developer subdomain."** Doing this splits SEO across two domains, separate hosting, loses cross-link credibility. Footer-only + single `/developers` hub (already shipped in rounds 2+3) achieves the same consumer-narrative effect at zero infrastructure cost.
- ⚠ **v3 said "RAP is a placeholder."** False — RAP-0.1.md was drafted May 23. Spec-stage, same as UAP — not abandoned, just very recent. v3 reviewer didn't see it.

---

## v2 STRATEGY SPRINT — May 22, 2026

> Per `/Users/imanschrock/Downloads/coyl_v2.pdf` (Founder-corrected
> strategy brief): the actual 10-hour sprint that shifts M&A conversations
> this week. Engineering items below ALREADY SHIPPED today; the founder
> action items are the human-required pieces.

### Engineering (already shipped, today)
- [x] **Data-moat substantiation** — `/how-coyl-knows-you` now carries a "What COYL knows that Claude doesn't" section listing the four schema-backed moat components: slip taxonomy (8 ExcuseCategory enum values), recovery curve shape, individual danger-window histogram, longitudinal 60+ day sequences. Closes v2 WRONG #5. (commit `c2a9d56`)
- [x] **Live PAP coordinator simulator on `/protocol`** — new public `POST /api/v1/protocol/demo` runs the production `isAboveConfidenceThreshold()` function in-process; new client island lets visitors run real coordinator decisions from the page with scenario + scope + confidence dials. Section "02b · Live." Converts the protocol from "open spec" to "running surface." (commit shipped same wave)
- [x] **`/research/interim` RCT publish framework** — pre-registered ledger ready for Found Health interim data. Five endpoint rows marked PENDING today; editing one `RESULTS` array + `LAST_UPDATED` constant publishes results in minutes, not days. Honesty-frame section pre-commits to publishing a null result if the RCT comes back null — removes the temptation to bury it. (commit `0f6b975`)
- [x] **`/api/share/[userId]` consent gate** — `User.shareCardEnabled` opt-in (default OFF). Privacy default fixed; share cards now require explicit opt-in via `/settings`. (commit `11cb431`)
- [x] **`/content` marketing playbook removed from public site** — playbook moved to private `docs/marketing/content-playbook.md`. Closes competitive-intel leak. (commit `6be9235`)

### Founder action — this week, in order
- [ ] **Confirm 1 advisor name on `/advisors`** — even 1 of 6 slots flips the page from red flag to proof. Target: the ex-Novo-Nordisk pharma advisor or the JITAI PhD candidate the v2 doc named. One warm intro + one signed advisor agreement at zero/nominal equity. Time: 1–2 hrs of outreach. **This is the highest-leverage credibility move on the site.**
- [ ] **Real founder photo on `/about`** — drop your photo at `/founder/iman.jpg` (the file path is already referenced in the page). The bio is already the best personal narrative in behavioral health; the IS-initials placeholder undercuts it every page load. Time: 5 min.
- [ ] **Outreach to Found Health PI** — initiate the conversation about when interim numbers will be available. The `/research/interim` ledger is live and pre-registered; the moment you have a number, edit `RESULTS[0].value` and `LAST_UPDATED` and the page ships in one commit. Time: 30 min email.
- [ ] **Strike "Series A in conversation" specificity from `/platform`** — v2 audit flagged: pins you to delivering a Series A within a visible window; if the conversation goes cold, the next visitor sees a fundraise that didn't close. Soften to "raising" or "pre-seed funded" until a term sheet is on the table. Time: 5 min edit.
- [ ] **PMPM pricing benchmark test** — Headspace Health is $8–12 PMPM, Lyra $15+, Calm Business $6–8. COYL at $4–7 PMPM is likely 40–50% under market. Test the $8–10 band on the next 3 enterprise conversations before locking. Time: rephrase in 2 sales decks (10 min).

### Strategic / governance (next 30 days, founder-led)
- [ ] **Hand v2 strategy brief to a hostile reader** — someone who is not a believer (ex-pharma corp dev, ex-VC who passed on behavioral AI, skeptical board observer). Tell them: "rip this apart." Their critique becomes v3. **Reason:** v2 is internalized critique; it has no remaining adversarial perspective.
- [ ] **Verify the "70% accuracy" claim** for individual danger-window prediction before it appears in any pitch deck — has any model actually been trained + validated, or is the number aspirational? If no model card / no AUC / no validation cohort, strike or qualify.
- [ ] **Re-rate "Series A doesn't close"** with honest 2026 market context. v2 doc rates this Low; given no confirmed advisors + no published RCT data + no live PAP integration + 2026 Series A market being brutal, more honest rating is Meaningful. If Meaningful, bridge math becomes #1 strategic concern.
- [ ] **Series A target list specificity** — v2 doc names a credible list (a16z Bio, GV, Andreessen Health, Rock Health, Bessemer health practice, General Catalyst Health Assurance, Khosla Ventures, First Round, Index). Strategic angels: Novo Nordisk Ventures, Eli Lilly Ventures, Microsoft M12. (NOTE: there is no "Apple peripheral health-tech investing arm" as a structured CVC — strike that line from v2.) Track each as cold / warm intro / 1st meeting / 2nd meeting / partner pitch / term sheet, updated weekly.

### Engineering follow-ups
- [x] **Production PAP self-integration** (May 22, 2026, commit `79a908d`) — COYL Internal is the first PAP partner. Every `/today` server render emits a real PAPProposal row through `proposeAsCoylInternal()` with `llmPartnerId = 'coyl_internal'`. Coordinator gates (panic, quiet hours, rate limit, dedup, confidence) evaluate against the real user. `/protocol` carries a new "02c · First production integration" section so reviewers see this is running, not aspirational.
- [x] **Workflow DevKit migration — proof of concept** (May 22, 2026, commit `04b24a6`) — `danger-window-learner` cron migrated to durable step-based execution. `next.config.ts` wrapped with `withWorkflow()`, proxy matcher excludes `.well-known/workflow/`, `CronHeartbeat` table added for staleness surfacing on the admin dashboard. Pattern documented in `docs/ENGINEERING.md` §13.
- [x] **Cache Components migration — applied** (May 22, 2026) — `cacheComponents: true` is on. 11 marketing wedges converted to `"use cache" + cacheLife + cacheTag`, 5 OG image routes moved from edge to Node, 14 `force-dynamic` declarations removed, Suspense boundaries added across layouts + dynamic-API pages. Build passes with `Partial Prerender` on marketing pages and `Dynamic` on per-user pages. Details in `docs/ENGINEERING.md` §14.
- [x] **Production DB migrations applied** (May 22, 2026) — six migrations that had been committed but never deployed to prod (eap_pap_coordinator, share_card_enabled, etc.) now applied via `prisma migrate deploy`. Fixed a `User` → `users` table-name bug in `share_card_enabled` discovered during the deploy. Existing `/api/pap/v1/proposal` endpoint now works in prod.
- [ ] **Migrate next 4 crons to Workflow DevKit** — `retrain-prediction-models` (longest-running, highest crash risk), `scheduled-interrupts` (per-user push delivery), `self-trust-recompute` (daily consistency), `model-snapshot` (autopilot-map weekly). Pattern documented; copy-paste from `workflows/danger-window-learner.ts`.
- [ ] **Wire `revalidateTag` into future admin-editable marketing content** — `cacheTag('marketing-<slug>')` infrastructure is in place but no admin save action currently calls `revalidateTag()`. When admin-editable marketing copy lands, hook the save action into the tag.

---

## UAP v0.1 LAUNCH — May 22, 2026

### Shipped today (Engineering)

- [x] **UAP-0.1 spec published** — `docs/protocol/UAP-0.1.md`. Four models in Prisma, eight primitives, hard invariants, threat model, surface reservation. Apache 2.0. (anchor commit 794618f)
- [x] **/uap wedge page live** — public marketing surface mirroring /pap and /eap structure
- [x] **/protocol expanded to 4-protocol stack** — BIP/PAP/EAP/UAP cards, layer diagram, "Why four, not one" section
- [x] **Prisma schema + migration** — UAPGrant, UAPRule, UAPAuditEntry, UAPKillSwitchEvent models with all indexes and foreign keys; migration 20260522050000_uap_v0_1 ready for `prisma migrate deploy`
- [x] **/api/uap/v1/* namespace reserved** — eight route stubs (grant, grant/[id], precheck, execute, kill-switch, audit, rule) returning 501 with spec link. Zero DB writes.
- [x] **Threat model + irreversibility floor docs** — `UAP-0.1-threat-model.md` and `UAP-0.1-irreversibility-floor.md` companion docs for foundation-lab Trust & Safety review
- [x] **Nav, footer, sitemap, middleware** — /uap added to all four registration surfaces; /api/uap/v1/(.*) public-route-allowlisted
- [x] **/platform + /developers updated** — 4-protocol stack reflected; UAP curl GRANT example on /developers
- [x] **Master list section** — this section

### v0.1.1 patch shipped (same day, evening)

After external pushback identified the "agent-as-representative" gap that v0.1 left implicit, shipped UAP-0.1.1 in-place:

- [x] **9th primitive `PROVENANCE_SIGN` added** — every EXECUTE whose action is a representation action (send_message, calendar_rsvp, payment, public_post, share, DM) MUST attach a cryptographic provenance signature visible to the recipient. Without this, a recipient cannot distinguish "AI-mediated message" from "compromised account" — that distinction is the entire trust contract.
- [x] **§5.5 wire format** — ed25519 payload `{v, agent, subject, grant_id, audit_id, action_kind, recipient_hint, issued_at, audit_url}`. Attached per-medium: `X-UAP-Provenance` header on email/HTTP, `[via @coyl/<short_audit>]` inline tag on public posts/DMs.
- [x] **T9 threat (spoofed provenance)** added to spec §6 — coordinator holds user signing key in HSM-equivalent; compromised keys rotated via KILL_SWITCH → re-derivation → audit-chain hash-chain remains intact.
- [x] **Invariant 9** added to spec §3 — "Provenance is required for representation actions. Implementations that omit provenance are NOT UAP-compliant; they are anti-pattern."
- [x] **Endpoint `GET /api/uap/v1/provenance/[auditId]`** — public, unauthenticated; recipients verify here. Stub returning 501 with spec link.
- [x] **Schema additions** — `UAPAuditEntry.provenanceSignature` + `provenancePublicKey` + `provenanceAlgorithm` + `provenancePayload`. Migration `20260522060000_uap_v0_1_1_provenance`. Additive — does not break v0.1 data.

The v0.1.1 patch addresses the central pushback: v0.1 was bearer-token-authenticated standing authority. v0.1.1 adds the user-signed envelope that lets the LLM act AS the user to third parties with verifiable provenance. The pushback Path-A/B/C decision was held — staying on Path B (4th protocol layer) with the provenance primitive added.

### Deferred to v0.2 + post-Series-A (Engineering)

- [ ] **UAP reference engine** — actual coordinator logic, signed audit log, cryptographic chain. Ships post-Series-A. Today's commits are spec + namespace + UI only.
- [ ] **Cross-LLM portability test** — when Anthropic or OpenAI integrates UAP, verify a grant issued to Claude is revocable when reissued to GPT.
- [ ] **Consent UI implementation** — the hosted consent surface at `/consent/uap` per UAP-0.1.md §8 requirements. Heaviest UX work in the protocol; needs a 2-3 month design pass before reference engine ships.
- [ ] **Kill switch propagation infrastructure** — pub/sub (Supabase Realtime or equivalent) that hits every connected EAP surface in ≤5 seconds. Untested at scale; the v0.1 spec specifies the deadline, the infra to meet it lands with the engine.
- [ ] **v0.2 open questions** — cross-user grants, probabilistic rules, multi-LLM concurrency, hardware-bound grants, panic semantics differentiation. Tracked in UAP-0.1.md §11.

### Founder action — UAP-specific (next 30 days)

- [ ] **Publish UAP-0.1 launch announcement** — blog post / tweet thread / LinkedIn post linking to the GitHub spec + /uap. Frame: "The fourth protocol in the COYL stack. The trust layer for agentic AI."
- [ ] **Email outreach to Anthropic Trust & Safety + OpenAI safety team** — UAP is the layer they need. Send them the spec + threat model + irreversibility floor. Ask for a 30-min protocol review call. This is the move that converts UAP from "spec" to "Anthropic + OpenAI both aware and engaging."
- [ ] **Get the threat model in front of one FDA DTx expert** — bonus credibility for the safety story. Update /advisors if you can convert that conversation to an advisor agreement.
- [ ] **Talk to one corporate venture or strategic angel about UAP** — Microsoft M12, Google Ventures, OpenAI Startup Fund. Frame as "we just published the trust infrastructure for the agentic AI category." Not asking for money — asking for who they think the consumers of UAP are.
- [ ] **Update Series A target list with UAP framing** — the acquirer band per v2 strategy doc was $4-6B (pharma + tech platform). UAP raises the foundation-lab band materially — $15-30B for the trust infrastructure layer. Re-pitch the deck reflecting this; the v2 brief's $4-5.5B "weighted EV" is now low.

### Risks that are now real (you should hold these honestly)

- **Standing-authority liability is non-trivial.** UAP-0.1 is spec-only; no LLM is operating under standing authority via COYL yet. That's intentional — the reference engine ships when Series A funds the safety-engineering investment. If a partner builds their own UAP-compatible engine and ships unsafely, COYL is positioned as the spec author and may be perceived as accountable. Mitigation: keep UAP-0.1.md threat model + irreversibility floor canonical; publish public commentary on safe vs unsafe UAP implementations.
- **Anthropic-builds-it risk applies HERE too.** Same MCP playbook in reverse — Anthropic ships their own "user-authority" model bundled with Claude. Mitigation: publish, evangelize, and get one foundation lab to publicly review UAP-0.1 before they invent their own. The window is roughly 60-90 days from this launch.
- **Wedge distraction.** UAP is horizontal; COYL's product wedge is recurring autopilot loops. Pre-Series-A, you cannot fully build both. Decision point: how much of the next 90 days is UAP evangelism vs. behavioral-interrupt product/RCT/advisors. Recommend 70/30 in favor of the behavioral wedge until Series A closes, then reverse.

---

## THIS WEEK — Existential gates

### Capital + legal posture
- [ ] **Confirm corporate entity** — Delaware C-Corp via Stripe Atlas or Clerky ($500). Required before any institutional investor can wire.
- [ ] **Issue founder restricted stock + file 83(b) election** within 30 days of issuance — if you missed this window, talk to counsel TODAY (tax disaster otherwise).
- [ ] **Cap table on Carta** — even pre-Series-A. Free tier covers founder + advisor grants. Investors will ask.
- [ ] **D&O insurance** — bind a basic policy ($3-8K/yr via Embroker or Founder Shield). Without this, no one joins your board.
- [ ] **Founder employment agreement + IP assignment** — counsel drafts; you sign. Confirms COYL owns all the code + protocols you've authored.

### Public visibility (fixes the #1 fundable-startup gate)
- [ ] **LinkedIn — Founder profile updated** with COYL bio + photo. Today.
- [ ] **LinkedIn — Company page created** at linkedin.com/company/coyl. 5 min.
- [ ] **Twitter/X — Founder handle active** with COYL pinned thread.
- [ ] **Crunchbase profile** for COYL + founder. Free tier, ~20 min.
- [ ] **AngelList Talent profile** (now Wellfound) — for the 5 critical hires.
- [ ] **/about page photos** — drop your photo at `/founder/iman.jpg` (referenced in apps/web/src/app/(wedges)/about/page.tsx). 1 photo, 5 min.

### Infrastructure that gates everything
- [ ] **Vercel production env vars** — full audit needed. List below in env-vars section.
- [ ] **Supabase backup configuration** — confirm point-in-time recovery is on. $30/mo Pro plan if not already.
- [ ] **DNS records** — verify `coyl.ai` MX records point at email provider; SPF + DKIM + DMARC for `iman@coyl.ai` deliverability.

---

## WEEKS 1-2 — Foundation phase

### Service accounts to set up (in priority order)

#### Email + deliverability
- [ ] **Resend account** (probably exists if `RESEND_API_KEY` is in env) — confirm domain `coyl.ai` is verified.
- [ ] **DMARC record** at `_dmarc.coyl.ai` — `v=DMARC1; p=quarantine; rua=mailto:dmarc@coyl.ai`. Critical for not landing in spam.
- [ ] **SPF record** — `v=spf1 include:_spf.resend.com include:spf.protection.outlook.com ~all`. Confirm via dig.
- [ ] **DKIM record** — Resend provides two `resend._domainkey` CNAME entries. Add both.
- [ ] **Test deliverability** via mail-tester.com — score must be 9+/10 before any cold pitch send.

#### Payments
- [ ] **Stripe live account** — enable beyond test mode. Bank account verified. Tax info filed.
- [ ] **Stripe Tax enabled** — Stripe auto-collects state sales tax. ~$10K/yr threshold per state for nexus.
- [ ] **Stripe Atlas / Connect** — if you haven't incorporated, Atlas ($500) does Delaware C-Corp + Stripe + Mercury bank in one flow.
- [ ] **Mercury or Brex business checking account** — required for receiving Stripe payouts + Series A wire.
- [ ] **Stripe products created** in dashboard:
  - "Core" — $12/mo recurring
  - "Core Annual" — $99/yr recurring (the commitment-device pricing)
  - "GLP-1 Plus" — $19.99/mo recurring
  - "Clinics & Employers" — custom invoicing (no Stripe product needed; manual invoicing)
- [ ] **Webhook endpoint** at `coyl.ai/api/webhooks/stripe` — confirm exists + signing secret set.
- [ ] **Stripe Tax IDs** — if any EU users, register VAT MOSS. EU sells via Stripe Tax automation.

#### Twilio (SMS — `/catch-me` flow)
- [ ] **10DLC registration** for A2P (Application-to-Person) SMS — Twilio requires this since 2023. ~$5/mo registration fee + per-campaign approval. Without this, messages get filtered.
- [ ] **Brand registration** as "COYL Inc." with EIN.
- [ ] **Use case registration** — pick "Behavioral Health" or "Mixed Use" template.
- [ ] **Toll-free number verified** OR short code if scaling past 10K SMS/day.
- [ ] **SHAFT-C compliance** — no Sex/Hate/Alcohol/Firearms/Tobacco/Cannabis content. COYL's intervention copy needs review for inadvertent triggers (e.g., "alcohol cravings" content gets messages flagged).

#### Google Cloud (for Calendar API + Firebase + Search Console)
- [ ] **Google Cloud project** for COYL — `coyl-prod`. Enable: Calendar API, Cloud Messaging (FCM for Android push), Identity Toolkit (if needed).
- [ ] **OAuth consent screen verified** — required for production Calendar OAuth. ~7-day verification turnaround. Provide privacy policy URL.
- [ ] **Firebase project** for Android push — link to Cloud Messaging. Download `google-services.json` for Android app.

#### Microsoft Azure (for Microsoft Graph + Teams)
- [ ] **Azure tenant** for COYL.
- [ ] **App registration** in Azure AD — for Outlook Calendar OAuth.
- [ ] **Microsoft Partner Network membership** — required for Teams Bot publication. Free for small companies.
- [ ] **Bot Framework registration** at dev.botframework.com — get bot app ID + password.

#### Apple Developer Program
- [ ] **Apple Developer Program — $99/yr** (probably already paid for iOS).
- [ ] **Apple Push Notification certificates** — generate at developer.apple.com/account/resources/certificates. Two certs: APNs Production + APNs Development.
- [ ] **CarPlay entitlement application** — developer.apple.com/contact/carplay. 4-8 weeks, ~30% approval rate. Frame as "Communication" category.
- [ ] **HealthKit entitlement** — automatic if your app uses HealthKit APIs.
- [ ] **App Group entitlement** — `group.com.coyl.shared` already used; just confirm in capabilities for all 3 targets (main app, widget, watch).
- [ ] **APNs Auth Key (.p8)** — generate for the Live Activity push integration. Required by APNS_KEY_ID env var.

#### Google Play Console
- [ ] **Google Play Developer account — $25 one-time** at play.google.com/console.
- [ ] **App identity verified** — government ID + selfie. ~3-day turnaround.
- [ ] **Data safety form** — required for all new apps. Disclose HealthKit-equivalent, location, behavioral data collection.

#### Microsoft Edge Add-ons + Firefox AMO + Chrome Web Store
- [ ] **Chrome Web Store — $5 one-time** at chrome.google.com/webstore/devconsole. Already prepped per `apps/extension/store/listing-copy.md`.
- [ ] **Microsoft Edge Add-ons — free** at partner.microsoft.com/dashboard/microsoftedge.
- [ ] **Firefox AMO — free** at addons.mozilla.org/developers.

### Cloudflare or DNS provider
- [ ] **Cloudflare** for `coyl.ai` — better DDoS + WAF than registrar-only DNS. Free tier.
- [ ] **DNS records audit** — A/AAAA point at Vercel; MX at email; TXT for SPF/DKIM/DMARC; CNAME for any subdomains.

### Sentry + observability
- [ ] **Sentry account** — already in stack (`@sentry/nextjs`). Confirm project exists + DSN in env.
- [ ] **Sentry Release tracking** — wire to Vercel deploy hooks.
- [ ] **Performance monitoring** — Sentry Performance tier ($26/mo) catches the slow API routes.

### Analytics
- [ ] **PostHog or Mixpanel** for product analytics — wire to audit completion, slip log, daily-number share, archetype reveal.
- [ ] **Google Analytics 4** for marketing pages (audience-acquisition reporting).
- [ ] **Plausible** as a lighter cookieless alternative (consider for EU users).

### Vercel env vars — full audit list

Production + Preview needs these set:

```
# Core
DATABASE_URL (Supabase pooler — required)
DIRECT_URL (Supabase direct — required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CRON_SECRET (random 32-byte hex)

# Email
RESEND_API_KEY
RESEND_FROM_EMAIL="COYL <noreply@coyl.ai>"

# SMS
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER (10DLC-registered)
TWILIO_MESSAGING_SERVICE_SID

# Payments
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET

# Push
APNS_KEY_ID
APNS_TEAM_ID
APNS_BUNDLE_ID=ai.coyl.app
APNS_KEY_P8 (full .p8 contents)
APNS_ENV=production
EXPO_ACCESS_TOKEN
VAPID_PUBLIC_KEY (web-push)
VAPID_PRIVATE_KEY (web-push)

# AI
ANTHROPIC_API_KEY (for the autopilot autopsy + model snapshot generation)
OPENAI_API_KEY (backup for AI_MODEL_FAST)

# Integrations (set when each ships live)
DEXCOM_CLIENT_ID / DEXCOM_CLIENT_SECRET / DEXCOM_REDIRECT_URI
LIBRE_CLIENT_ID / LIBRE_CLIENT_SECRET / LIBRE_REDIRECT_URI
WITHINGS_CLIENT_ID / WITHINGS_CLIENT_SECRET / WITHINGS_REDIRECT_URI
GOOGLE_CALENDAR_CLIENT_ID / GOOGLE_CALENDAR_CLIENT_SECRET / GOOGLE_CALENDAR_REDIRECT_URI
MS_CALENDAR_CLIENT_ID / MS_CALENDAR_CLIENT_SECRET / MS_CALENDAR_REDIRECT_URI
INTEGRATION_ENCRYPTION_KEY (32-byte AES base64)

# Teams + Slack
MS_BOT_APP_ID / MS_BOT_APP_PASSWORD / MS_BOT_TENANT_ID
SLACK_CLIENT_ID / SLACK_CLIENT_SECRET / SLACK_SIGNING_SECRET

# Admin
ADMIN_USER_IDS=<clerk-user-id>,<clerk-user-id>
ADMIN_EMAILS=iman@coyl.ai

# Observability
SENTRY_DSN
SENTRY_AUTH_TOKEN
POSTHOG_API_KEY
NEXT_PUBLIC_POSTHOG_KEY

# Site
NEXT_PUBLIC_SITE_URL=https://coyl.ai
NEXT_PUBLIC_VERCEL_ENV=production
```

Audit your current Vercel project vars against this list. Missing items = features that fail silently.

---

## WEEKS 3-4 — Operational launch

### Database migrations
- [ ] **Run all pending Prisma migrations** in production:
  ```
  cd packages/database
  pnpm prisma migrate deploy
  ```
  Includes: `20260521000000_live_activity_registrations`, `20260521010000_phase_1_4_models`, `20260522010000_eap_pap_coordinator`.
- [ ] **Backup before migration** — Supabase auto-snapshots but trigger a manual snapshot via dashboard before each new migration in production.

### Mobile app submission
- [ ] **TestFlight build uploaded** for COYL iOS app. Target: 50 invited users in first cohort.
- [ ] **App Store screenshots** generated for all required sizes:
  - 6.7-inch (iPhone 15 Pro Max): 1290×2796
  - 6.5-inch (iPhone 14 Plus): 1284×2778
  - 6.1-inch (iPhone 15): 1179×2556
  - iPad Pro 13-inch: 2064×2752
  - iPad Pro 12.9-inch: 2048×2732
- [ ] **App Store metadata** drafted — title (30 char), subtitle (30 char), promotional text (170 char), description (4000 char), keywords (100 char comma-separated).
- [ ] **App Privacy Labels** in App Store Connect — declare all data types collected per HealthKit usage.
- [ ] **Privacy Policy URL** — point at `coyl.ai/privacy`. Update privacy page to include HealthKit + behavioral data collection disclosure.
- [ ] **First TestFlight invitation list** — 20 friends/family + 30 early-Twitter-recruited beta users.
- [ ] **App Store submission** — submit for review. Typical review: 1-3 days.

### Browser extension submission
- [ ] **Chrome Web Store** — zip per `apps/extension/store/asset-checklist.md`. Pay $5. Upload + submit. 1-3 days review.
- [ ] **Edge Add-ons** — same zip. Submit at Partner Center. Free. ~3 days.
- [ ] **Firefox AMO** — same zip. Submit at addons.mozilla.org. Free. <24h auto-review.
- [ ] **Safari Extension** — submit via Xcode archive → Mac App Store Connect. $99/yr Apple Developer covers it.

### Press + SEO
- [ ] **Google Search Console** — verify ownership at search.google.com/search-console. Add `coyl.ai` property.
- [ ] **Bing Webmaster Tools** — same. ~10% of US search traffic.
- [ ] **Submit sitemap** — `coyl.ai/sitemap.xml` (already auto-generated by Next.js). Submit to both consoles.
- [ ] **robots.txt audit** — verify `apps/web/src/app/robots.ts` allows all marketing routes + blocks `/api`, `/admin`, `/today`.
- [ ] **Schema.org Organization markup** on `/`, `/about`, `/protocol` — already partially in code; verify renders correctly via Google Rich Results Test.
- [ ] **OpenGraph images** — every key page has `/api/og` route generating its own. Verify via opengraph.xyz.
- [ ] **Press kit** — page exists at `/press`. Drop founder photo + logo files into `/press/assets/`.

### Press list — top 5 cold pitches this week
Per the editorial press kit (`docs/outreach/press-kit-editorial.md`):
- [ ] **Casey Newton — Platformer / formerly The Verge** — pitch BIP open-source + COYL Cloud reference engine angle.
- [ ] **Sarah Frier — Bloomberg consumer tech** — pitch pharma adjacency + $4-6B strategic acquisition angle.
- [ ] **Steven Levy — Wired** — pitch founder profile + behavioral OS layer.
- [ ] **Will Knight — MIT Technology Review** — pitch the per-user logistic regression model outperforming generic LLMs.
- [ ] **Olga Khazan — The Atlantic** — pitch founder story + JITAI research literature.

Each pitch: ONE outlet at a time, 72h embargo offer. Don't blast.

---

## MONTHS 1-2 — Clinical + Regulatory + IP

### Clinical
- [ ] **Found Health partnership LOI signed.** Use `docs/outreach/clinical-pitch-found-health.md` as the opener. Negotiate to ~$200-220K total partnership fee for N=80 trial.
- [ ] **IRB protocol submitted** via Found Health's preferred IRB (likely WCG, Advarra, or institutional). Use `docs/clinical-study/irb-protocol-skeleton.md` as the draft.
- [ ] **ClinicalTrials.gov registration** — required by ICMJE for journal submission. Register BEFORE enrollment starts. Free, ~1 week to NCT number.
- [ ] **Clinical trial insurance** bound — Coverys, Marsh, or Chubb. $15K-25K/yr for $5M coverage.
- [ ] **BAA with Found Health** — signed.
- [ ] **BAA with Vercel** — required for HIPAA-compliant hosting. Vercel Pro tier covers. ~$20/mo upgrade.
- [ ] **BAA with Supabase** — included in Pro plan ($30/mo).
- [ ] **BAA with Resend** — included in Pro plan ($35/mo).
- [ ] **HIPAA training certificates** — every team member who touches PHI does CITI training. ~6 hours, $80/person.
- [ ] **Investigator Brochure** drafted — for IRB submission. Includes the COYL app technical specs + risk assessment.
- [ ] **Recruitment materials** — flyer + email template + social media copy. Approved by IRB before deployment.

### Regulatory (FDA)
- [ ] **Regulatory consultant retained** — $20-30K to retain + $200K trial-cost contribution. RAPS-certified. Names: Greenleaf Health, Eichelberger Regulatory, BridgePoint Regulatory.
- [ ] **FDA Q-Submission filed** at `cdrh.fda.gov/cdrhq` (Q-Sub portal). Use `docs/regulatory/fda-q-submission.md` as the draft. Free. 75-day FDA response timeline.
- [ ] **Pre-Sub meeting scheduled** — FDA assigns a date within 75 days. Meeting is 60-90 min with CDRH reviewer + your team.
- [ ] **510(k) submission target** — Month 7 per the strategic roadmap. Application fee: $19,250.

### IP
- [ ] **IP attorney retained** — names: Wilson Sonsini IP, Cooley IP, Fenwick & West. Retainer $5-10K, ongoing ~$300-400/hr.
- [ ] **3 provisional patent applications filed** via attorney. Use `docs/ip/provisional-patents/*.md` as drafts. Cost: ~$1,500-3,000 per provisional. 12-month window before conversion to full utility patents.
- [ ] **Trademark "COYL"** — file at USPTO ($350-500 per class). Class 9 (software) + Class 42 (SaaS) + Class 44 (medical services if applicable).
- [ ] **Trademark international** — Madrid Protocol for EU + UK + Canada. ~$1,500 per country.
- [ ] **Copyright registration** for the BIP + PAP + EAP spec documents — $65/each at copyright.gov.

### Team — 5 critical hires
Per `docs/finance/capital-allocation-memo.md`:
- [ ] **CTO / Head of Engineering** — mobile-first, Health+ML capable. $280K base + 4-6% equity.
- [ ] **Head of Clinical** — PhD-level, IRB-experienced. $240K + 1-2%.
- [ ] **Head of BD** — ex-Novo/Lilly/Pfizer BD. $260K + 1-1.5%.
- [ ] **Head of Growth** — viral-mechanics experienced. $230K + 0.75-1.25%.
- [ ] **Head of Compliance** — HIPAA + SOC 2 + FDA-software experienced. $210K + 0.5-1%.

Recruiters: Sequoia Talent, Stryde, True. ~25% placement fee.

### Advisory board (sign at least 2 before Series A close)
- [ ] **Behavioral health operator** — ex-Noom VP or ex-Headspace VP.
- [ ] **Pharma commercial leader** — ex-Novo Nordisk or ex-Eli Lilly.
- [ ] **Clinical researcher** — JITAI specialist.
- [ ] **Mobile platform veteran** — ex-Apple Health.
- [ ] **Strategic finance advisor** — M&A in digital health.
- [ ] **Behavioral neuroscience PhD** — habit research.

Equity: 0.25-0.5% each, 4-year vest, 1-year cliff.

---

## MONTHS 3-8 — Scale + Acquisition Prep

### Fundraising — $10M Series A
- [ ] **Deck refresh** complete (`docs/pitch/series-a-deck.md` shipped).
- [ ] **One-pager** complete (`docs/pitch/series-a-one-pager.md`).
- [ ] **Investor pipeline** — 30 named investors per `docs/finance/investor-pipeline.md`.
- [ ] **First-meeting target** — 15 investor meetings booked in 2 weeks.
- [ ] **Data room** assembled per `docs/finance/data-room-structure.md`. Use Notion or DocSend.
- [ ] **SAFE template** — Y Combinator post-money SAFE is standard. Modify for $40-50M post-money valuation cap.
- [ ] **Term sheet signed** — target by Month 2 of the raise. Don't accept anything below $40M post.
- [ ] **Wire instructions** distributed to investors.
- [ ] **Closing target** — $10M total, 18-month runway.
- [ ] **Cap table updated on Carta** post-close.

### Distribution + Growth
- [ ] **Apple HealthKit Featured pitch** — `docs/outreach/apple-health-featured-packet.md`. Three channels:
  1. Warm intro via ex-Apple operators
  2. Apple Developer Relations submission
  3. AppStore editorial nomination
- [ ] **First foundation-lab partnership** — Anthropic primary target. Use `docs/outreach/bd-pharma-strategy.md` (which also covers tech-platform paths).
- [ ] **First pharma LOI** — Novo Nordisk OR Eli Lilly. Use `docs/outreach/bd-script-novo-nordisk.md` + `bd-script-eli-lilly.md`.
- [ ] **Microsoft Viva partner program** application — `docs/outreach/microsoft-viva-partner-application.md`.
- [ ] **50K users by Month 5** — Apple Featured + press + viral daily-number ritual compounding.
- [ ] **200K users by Month 7** — strategic partnership announcements compound user acquisition.

### Compliance
- [ ] **SOC 2 Type II audit kickoff** — Vanta or Drata at ~$15-30K/yr. 6-8 month audit window. Required for enterprise B2B.
- [ ] **HIPAA risk assessment** — required if any clinical data flows. Independent assessor ~$10-20K.
- [ ] **Penetration test** — annual; ~$15-30K. SOC 2 requires.
- [ ] **GDPR data processing impact assessment** — if any EU users. Counsel ~$5K.
- [ ] **CCPA + state privacy compliance** — California / Virginia / Colorado / Texas have specific consumer rights now. Counsel review ~$5K.

### Exit prep — Months 6-8
- [ ] **Investment banker engaged** — Qatalyst primary (digital health expertise) or Allen & Co. Engagement fee ~$50-150K + ~3-5% success fee on exit.
- [ ] **Data room finalized** — all 12 folders per the data room structure doc.
- [ ] **Diligence checklist** — pre-prepare answers to the 200+ questions every acquirer asks.
- [ ] **Management presentations** to Novo Nordisk + Eli Lilly + Anthropic.
- [ ] **Competitive-bid orchestration** — keep ≥2 acquirers in the room until LOI signing.

---

## App Store Submission Checklist

### Apple App Store
- [ ] App Store Connect account active
- [ ] App created in App Store Connect with bundle ID `ai.coyl.app`
- [ ] App icon: 1024×1024 PNG (no transparency, no alpha)
- [ ] App icon set in Asset Catalog for all required sizes
- [ ] Privacy nutrition labels filled
- [ ] App Privacy Policy URL: `coyl.ai/privacy`
- [ ] Support URL: `coyl.ai/help`
- [ ] Marketing URL: `coyl.ai`
- [ ] Screenshots (see sizes above)
- [ ] Preview video (optional but lifts conversion ~25%)
- [ ] Age rating: 17+ (behavioral health context)
- [ ] Sign-in info for App Review team (test account)
- [ ] Health data justification (mandatory for HealthKit apps)
- [ ] Subscription products configured (StoreKit 2)
- [ ] In-app purchase agreements signed (Apple's Paid Apps Agreement)
- [ ] Tax info: W-9 or W-8BEN
- [ ] Banking info: ACH for revenue
- [ ] App Review submission

### Google Play Store
- [ ] Google Play Console account active
- [ ] App created in Play Console with package `ai.coyl.app`
- [ ] App icon: 512×512 PNG, no transparency
- [ ] Feature graphic: 1024×500 PNG/JPEG
- [ ] Screenshots: at least 4 phone screenshots, optional tablet
- [ ] Data safety form: all data types declared
- [ ] Content rating: IARC-compliant (~PEGI 16 expected)
- [ ] Privacy policy URL
- [ ] Target API level 34+ (required since Aug 2024)
- [ ] App content questionnaire complete
- [ ] Pricing & distribution: countries selected (start with US only)
- [ ] In-app billing products configured
- [ ] Closed testing track first (TestFlight equivalent)
- [ ] Production release submission

### Chrome Web Store
- [ ] Per `apps/extension/store/asset-checklist.md`:
- [ ] Manifest V3 compliant
- [ ] Icon: 128×128 PNG
- [ ] Screenshots: 1280×800, at least one
- [ ] Promotional tile: 440×280 + (optional) 920×680
- [ ] Detailed description per `apps/extension/store/listing-copy.md`
- [ ] Privacy practices form
- [ ] Single purpose justification
- [ ] $5 one-time developer fee paid
- [ ] Submission

### Edge Add-ons
- [ ] Partner Center account active
- [ ] Same zip as Chrome submission
- [ ] Edge-specific store listing (mostly auto-populated)
- [ ] Free; ~3-day review

### Firefox AMO
- [ ] developer.mozilla.org account
- [ ] Manifest V3 compliant (Firefox supports MV3 since v109)
- [ ] Free; auto-review <24h for non-restricted permissions

### Safari Extension (macOS App Store)
- [ ] Xcode archive of `apps/safari-extension/`
- [ ] App Store Connect entry (separate from iOS app)
- [ ] App Review submission; 1-3 day turnaround

---

## SEO + Marketing Checklist

### On-page SEO
- [ ] All marketing pages have unique `<title>` tags ≤60 chars
- [ ] All pages have meta description ≤160 chars
- [ ] All pages have canonical URLs
- [ ] OpenGraph + Twitter Card images for every page (auto via `/api/og`)
- [ ] Internal links between related pages (footer + nav already cover)
- [ ] Structured data: Organization, WebSite, FAQPage, Article (where applicable)

### Off-page SEO
- [ ] **Crunchbase profile** with link back to coyl.ai
- [ ] **Wikipedia article** for COYL — only after press coverage; Wikipedia disallows self-promo
- [ ] **AngelList Wellfound profile**
- [ ] **LinkedIn company page** with regular posts
- [ ] **Twitter/X founder presence** with weekly threads
- [ ] **ProductHunt launch** — coordinate with press for Tuesday or Wednesday launch (highest traffic days)
- [ ] **Hacker News Show HN** — separate from ProductHunt, time independently

### Content marketing
- [ ] **Changelog updates** weekly at `coyl.ai/changelog` — drives recurring SEO + serves as press surface
- [ ] **Long-form essays** on `/content` — start with 3 essays per `/content` brief
- [ ] **Founder Twitter/X threads** — one per shipping milestone, archived to `/press`

### Paid acquisition (after Series A close)
- [ ] **Google Ads** — search campaigns on "GLP-1 maintenance", "behavioral interrupt", "9 PM kitchen". $5K/mo cap initially.
- [ ] **Meta Ads** — Instagram + Facebook. Test creative against the 6 archetypes.
- [ ] **TikTok organic** — founder TikTok with the daily-number ritual.
- [ ] **CAC target** — $15 blended (free + paid) for first 100K users.

---

## Hardware + Distribution Surfaces (the new EAP coordinators)

The 9 platform coordinators are shipping via the agent army RIGHT NOW. Once they land, founder must:

### iOS
- [ ] Add the new modules (`coyl-eap-coordinator`, `coyl-health-bridge`, `coyl-watch`, `coyl-voice`, `coyl-live-activity`) to Xcode workspace.
- [ ] Run `expo prebuild --clean` from `apps/mobile/`.
- [ ] Wire HealthKit + App Group + Background Modes capabilities.
- [ ] Test on physical device (Watch + iPhone).

### macOS
- [ ] Open `apps/desktop-macos/` in Xcode.
- [ ] Create new macOS App target via Xcode wizard.
- [ ] Notarize via `xcrun notarytool`.
- [ ] Distribute via direct download at `coyl.ai/download/macos` (faster than App Store).

### watchOS
- [ ] Already covered by iOS Xcode wiring (Watch target was scaffolded).
- [ ] Test on paired physical Watch.

### Chrome / Edge / Firefox extensions
- [ ] Submit per the Chrome Web Store checklist above.
- [ ] Edge accepts same zip; Firefox accepts same zip with minor manifest tweak (browser-* polyfill already in code).

### Safari extension
- [ ] Submit via Xcode archive.

### Android
- [ ] Open `apps/android/` in Android Studio.
- [ ] Set up Firebase project; drop `google-services.json` into `app/`.
- [ ] Generate signing keystore for release.
- [ ] Submit to Google Play.

### Wear OS
- [ ] Included in Android Studio project at `apps/android/wear/`.
- [ ] Submit to Play Console as a separate Wear OS app entry.

### HomeKit + Matter
- [ ] Decide: Mac App Store distribution (sandboxed) OR direct download (notarized).
- [ ] Matter bridge: ship as Docker image at `ghcr.io/coyl/matter-bridge` + Raspberry Pi installer at `coyl.ai/download/matter-bridge`.
- [ ] (Commercial future) — "COYL Hub" Raspberry Pi pre-loaded with the bridge, $99 retail.

### CarPlay + Android Auto
- [ ] **CarPlay entitlement application** — already in this-week list. 4-8 weeks, ~30% rate.
- [ ] **Android Auto submission** — 1-3 weeks, ~85% rate.
- [ ] Test on rental car with CarPlay/Auto support OR Apple CarPlay simulator + Android Auto Desktop Head Unit.

---

## What you absolutely cannot delegate

Some things only the founder can do. These never come off your plate:

1. **First investor meetings** — the first 5-10 meetings ARE the founder testing the pitch. Don't hire an outsourced fundraising service before week 6 of the raise.
2. **First foundation-lab BD meeting** — Anthropic/OpenAI/Google corp dev wants to meet the founder, not a BD hire (until you HAVE a BD hire after Series A close).
3. **First clinical KOL conversation** — your name on the trial gives it credibility.
4. **Press interviews** — first 5 are founder-only. Then add the head of clinical as a second voice.
5. **First Apple Health meeting** (if it lands) — founder + CTO if you have one.
6. **Sign every BAA + key contract personally** until you have a head of legal.

---

## The 10-item daily checklist

Print this. Tape it to your monitor.

1. Inbox zero before 10am — investor emails first, BD second, support last.
2. One investor meeting / one BD meeting / one technical decision per day minimum.
3. Twitter or LinkedIn post by noon (build the public profile).
4. Founder-direct response to first 5 user emails of the day.
5. Review yesterday's signups + audit completions + slip logs.
6. Check Sentry for new errors. 5-min triage.
7. Check Vercel deploys. Verify production is healthy.
8. Update the master TODO file (this doc) — check off completed items.
9. 30-min focused work block on the ONE thing only you can do today.
10. Pause + reflect: what was the highest-leverage activity I did today? Plan tomorrow against that.

---

## Engineering follow-ups (post-Series-A, before pharma diligence)

Two real technical-debt items surfaced when I honestly engaged with the
Vercel + Next.js skill nudges this session. Not blocking the raise but
worth scheduling in the engineering roadmap before pharma diligence
teams pen-test the platform.

### 1. Vercel Workflow migration for orchestration + scheduled interrupts

The current `/api/eap/v1/orchestration` endpoint (commit `ddabbc1`)
handles multi-device atomic flows with `all_or_none` vs `best_effort`
semantics — but lacks:

- Auto-rollback of prior steps when `all_or_none` violations occur
- Retry semantics on failed step delivery
- Crash-safe step recovery if a Vercel function dies mid-orchestration
- Durable timer for scheduled fires ("fire at user's local 8 PM")

Today: works for n=1-1,000 users. Becomes a real liability at n=100K
with multi-step orchestrations.

The right primitive: **Vercel Workflow DevKit** — durable workflows
with pause/resume, retries, step-based execution, `step.sleepUntil()`
for user-local-time firings.

Migration scope:
- `/api/eap/v1/orchestration` → durable workflow with per-step retry +
  compensating-action rollback for `all_or_none` failures
- `/api/cron/scheduled-interrupts` (commit `11e0518`) → replace
  hourly-poll-then-match-timezone pattern with
  `step.sleepUntil(scheduledForLocal)`
- `/api/cron/daily-number` (commit `d690993`) → same; durable
  per-user "fire at local 8 PM" timer

Effort estimate: 1-2 weeks of one backend engineer post-Series-A.
Schedule for Month 2-3.

### 2. Cache Components migration (Next.js 16)

This session shipped `export const revalidate = 86400` on 10 marketing
pages — the LEGACY ISR pattern. Provides 1-day cache TTL but NOT the
surgical tag-based invalidation the new Cache Components system
enables.

Next.js 16 introduced `cacheComponents: true` config flag + `'use cache'`
directive + `cacheLife()` + `cacheTag()` + `updateTag()` /
`revalidateTag()`. The full migration would let you ship a copy edit
to `/pap` and surgically invalidate just that page's cache without a
full deploy.

Why I didn't do it this session:
- Enabling `cacheComponents: true` is project-wide; affects all 81
  page.tsx files
- 5 pages currently use `cookies()` / `headers()` / `searchParams`
  outside Suspense boundaries (homepage variant-picker, onboarding,
  3 admin pages) — would break at build time
- Full audit + Suspense refactor + build verify = 4-6 hours, not
  the "1 hour" I optimistically promised

Migration scope:
- Enable `cacheComponents: true` in `apps/web/next.config.ts`
- Wrap dynamic-data fetches on homepage + onboarding + admin pages
  in `<Suspense>` boundaries (or mark `force-dynamic` explicitly)
- Replace `export const revalidate = N` on marketing pages with
  `'use cache'` + `cacheLife('weeks')` + `cacheTag('marketing:<slug>')`
- Add `updateTag()` calls in any future copy-edit server actions

Effort estimate: ~1 day of one engineer once you have one. Schedule
for Month 2.

### 3. Server-side EAP endpoints missing

The macOS coordinator (and the Safari + browser coordinators) poll
these endpoints which the cloud wave's EAP core agent didn't ship:
- `GET /api/eap/v1/devices/<deviceId>/pending-actions` — 30s poll target
- `POST /api/eap/v1/sensor/<deviceId>/publish` — periodic sensor snapshot

Both are 1-2 hour additions. Required before any platform coordinator
is functional in production. Schedule for Week 1 of post-Series-A
engineering.

---

## v4 external audit response — shipped May 24, 2026

The v4 audit ("COYL Audit & Growth Plan, May 2026") was read with
ultrathink and triaged into Tier A (high-leverage fast wins), Tier B
(structural fixes that pay off through the funnel), and Tier C
(longer arcs already underway).

### What shipped (commits)

| Item | What | Commit |
| ---- | ---- | ------ |
| A2 | Clinician pricing block on /rebound (free-for-providers + $12-18 PMPM) | c9b5f2f |
| A3 | "Early read · still narrowing" preview on audit step 2 | c9b5f2f |
| A5 | Footer changelog label "What's new (changelog)" | c9b5f2f |
| B3 | /patterns "engine-of-engines" hub + lib/research-stats.ts | 00b4040 |
| B4 | General↔Rebound family bridge + GLP-1 callout on audit result | 00b4040 |
| B1 | Animated 7-step loop on /how-it-works (step 4 = three-second window) | 98ddc61 |

### What was held

**A1 (lead-with-GLP-1 homepage)** — the auditor's strongest
recommendation. HELD by founder decision. The hero-variants.tsx
file carries a round-3 doc-comment documenting an empirical reversal
of exactly this recommendation based on observed bounce-rate data
when the GLP-1-led hero shipped. Until we have new data that
overturns that round-3 finding, the general-autopilot lead stays.
This is the right call: empirical founder decisions outweigh
theoretical audit recommendations from outside the data.

### What the auditor got factually wrong

Worth tracking so we don't over-trust the next external audit:
- Claimed RAP was a placeholder — actually shipped end-to-end
  (6bc4352, cf92cbf)
- Claimed annual pricing wasn't built — actually fully shipped
  including Stripe `interval: 'monthly' | 'annual'` body param
- Claimed "MY COYL AUTOPILOT" share card headline needed fixing —
  already fixed in 207d151
- Claimed UC Irvine 23-min stat was duplicated across /work and
  /procrastination — only on /procrastination

Net: 4 of the audit's 13 findings were already shipped or
factually wrong. The 9 valid findings produced 7 ships (above) and
1 held (A1).

### B3 + B4 architectural payoff (worth flagging)

Two of the shipped items have leverage beyond the immediate audit
response:

1. **`lib/research-stats.ts`** — single source of truth for every
   research citation in marketing copy. When the next study lands,
   we update one constant and every page picks it up. The auditor's
   specific dedup case was fictional but the principle holds.

2. **`lib/family-taxonomy-map.ts`** — bridges the 6 general audit
   families to the 4 GLP-1 Rebound families *without* collapsing
   them (auditor wanted collapse; collapse loses signal). Lets us
   cross-pollinate between the two funnels in future surfaces
   without having to re-think the bridge each time.

### What was deliberately NOT shipped

- A4 (autopilot map): the auditor flagged a /how-it-works gap that
  was actually addressed by the /patterns hub (B3). Subsumed.
- B2 (annual pricing): already shipped before this audit landed.
- C-tier recommendations (RAP build-out, GLP-1 partner pilot,
  longitudinal cohort): not single-day work. Each is a roadmap
  arc, not an audit response item. Tracked in respective sections
  above (Engineering follow-ups, Hardware + Distribution Surfaces).

---

## Sources

This document synthesizes from:
- `docs/strategy/army-deployment-handoff.md` — code-shipped delta
- `docs/finance/capital-allocation-memo.md` — capital + hires
- `docs/finance/investor-pipeline.md` — investor list
- `docs/finance/data-room-structure.md` — data room
- `docs/regulatory/*` — FDA + 510(k) + Breakthrough
- `docs/clinical-study/*` — IRB + Found Health
- `docs/outreach/*` — BD scripts + press kit + investor update
- `docs/ip/provisional-patents/*` — patent claim drafts
- `docs/pitch/series-a-deck.md` — fundraising
- `apps/extension/store/*` — Chrome submission
- The full repo state as of `c787a08` HEAD.

---

*Founder Action Master List v1 — May 22, 2026. Owner: founder.
Re-read before every board call and every investor meeting. Update
weekly. When in doubt: ship the harder thing first.*
