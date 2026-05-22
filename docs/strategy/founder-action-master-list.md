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
