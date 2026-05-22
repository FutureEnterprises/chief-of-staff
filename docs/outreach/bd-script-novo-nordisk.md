# BD Script — Novo Nordisk (the pharma-first acquirer path)

> Target: Novo Nordisk US Strategy + Innovation, US Corp Dev, and the
> obesity / cardiometabolic R&D leadership in Bagsværd. Best paths
> ranked below — read Section 1 first.
>
> Per the $6B Acquisition Roadmap (May 2026 revision): pharma is the
> primary acquirer path, not Microsoft. Novo + Lilly bidding in
> parallel is what creates the $4-6B premium. Single-bidder = $1-2B
> base case. The framing matters less than the parallel pressure.
>
> This script replaces the tech-platform-first sequencing as the
> primary path. Microsoft Viva stays alive as a parallel track — see
> `bd-pharma-strategy.md` Section 5 and
> `../integrations/microsoft-viva-engineering-spec.md`.

---

## Section 1 — Outreach (the four channels)

The cold-email-to-corp-dev path is necessary but insufficient. Pharma
corp dev gets 200+ inbound pitches per quarter; the inbound channel
has a ~3% reply rate at best. The real path is four parallel channels,
not one.

### Channel (a) — Corp dev cold email

Send to Doug Wamsley (US Corp Dev) and Anna Wallach (Strategy +
Innovation) simultaneously. The subject line is doing 80% of the
work. Do not use "partnership" in the subject — it pattern-matches
to vendor sales and gets filtered.

**Subject:** The Wegovy maintenance gap — quick context from COYL

**Body:**

Hi [name],

I'm Iman, founder of COYL. We're the behavioral interrupt layer that
fires in the 3-second window before a person commits the autopilot
behavior the drug is supposed to be solving. 50K consumer users today;
six named obesity archetypes; clinical study with Found Health in IRB
review.

Why I'm writing Novo specifically: the maintenance window is your
fastest commodity wave. Wegovy patients on the taper or maintenance
phase regain 60-70% of lost weight within 12 months of stopping or
de-escalating. Every payer + clinician knows this. The drug got them
to the weight; nothing gets them to keep it.

COYL is the layer that runs after the prescription stops. We've
shipped:
- Real-time interrupts at the moment of the autopilot script (9 PM
  kitchen, post-injection day-3 rebound, "I'll restart Monday")
- Six obesity archetypes the model has earned from 50K users
- The Self-Trust Score and Model Snapshot — measurable behavioral
  outcomes Novo could license as the maintenance-adjunct for Wegovy
- Open-spec Behavioral Interrupt Protocol (Apache 2.0 at
  coyl.ai/protocol) — so the integration is documented public, not
  black-box

The ask: a 30-minute call with whoever owns the Wegovy maintenance
strategy inside Novo. Could be R&D, could be Strategy & Innovation,
could be Commercial. I'd rather you route me than guess.

I'm having parallel conversations with one other Top-2 obesity
pharma (you can imagine who). Not pushing urgency — flagging it so
you know the timing is real.

— Iman Schrock · iman@coyl.ai · coyl.ai/protocol

**Why this works:**
- Names the specific gap (Wegovy maintenance) in subject
- Doesn't pitch acquisition. Pitches a 30-minute call.
- Mentions the parallel (Lilly) without naming, which Novo will
  understand. Pharma corp dev reads "Top-2 obesity pharma" as Lilly,
  every time.
- Ends with a routing ask, not a sell ask. Routing asks are easy to
  say yes to.

### Channel (b) — Warm intro via health-tech VC portfolio

The fastest path is not corp dev. It's a warm forward from a Novo
exec's portfolio-company founder. The Novo Holdings + Novo Ventures
LP relationships create a soft network we can tap.

**Target intermediaries:**
- General Atlantic (Novo Holdings co-investor in multiple deals;
  GA's health portfolio includes Hims, Ro adjacent. If anyone on our
  cap table — or our investor's portfolio — overlaps GA, that's the
  fastest forward.)
- Andreessen Horowitz Bio fund partners (a16z has done multiple
  drug-adjacent investments; the partners socialize with Novo R&D
  leadership at JPM Healthcare)
- Eight Roads Ventures (Novo-adjacent UK fund with US digital health
  exposure)
- Any portfolio founder of Novo Holdings' US digital-health bets
  (Snapchat-for-medication founders, weight-management adjacencies)

The forwarding template (for the intermediary to send on our behalf):

> Hey [Novo exec] — quick forward. The COYL team has built the
> behavioral-interrupt layer that sits between GLP-1 prescription and
> long-term behavior change. Specifically interesting for the Wegovy
> maintenance + post-taper relapse window — they have data showing
> the 3-second-window intervention works at consumer scale (50K
> users). Founder is Iman Schrock; he's having parallel conversations
> with a few partners and I thought you'd want context before someone
> else here did. Worth 30 minutes — happy to make the introduction.

This forwards through the intermediary's voice. We never write it
ourselves; we draft, they ship.

### Channel (c) — External M&A advisor

Hire Qatalyst Partners as the fractional banker for the pharma
conversation specifically. Frank Quattrone's firm has run multiple
digital-health-to-pharma deals (Livongo → Teladoc was bigger, but
the strategic-bidder dynamics are identical). Qatalyst's advantage:
they're in the room at JPM Healthcare every January and have warm
lines into Novo Strategy.

Allen & Co is the alternative — Herb Allen is relationship-first,
Sun Valley conference channel, slower but higher trust. Recommendation
is Qatalyst (see `bd-pharma-strategy.md` Section 8).

The advisor's role: introduce us to Novo Corp Dev under their cover.
"Qatalyst has been advising a digital-health asset they think Novo
should see." That phrasing — Qatalyst's standard outreach format —
gets a meeting where our cold email gets a filter.

Engage Qatalyst before sending the cold email. Their first call with
Novo and our cold email should land within the same 14-day window so
Novo's corp dev sees the same name from two channels.

### Channel (d) — Conference hallway

Two conferences, non-negotiable:

**JP Morgan Healthcare Conference (San Francisco, second week of
January, 2027):** the entire pharma deal universe is in two hotel
ballrooms for four days. Novo Strategy + Innovation runs partner
meetings on a 30-minute clock. The hallway encounters at the Westin
St. Francis are the actual deal flow.

Strategy: Qatalyst books the formal 30-min meeting. We do the prep
work to make sure four specific things happen in those 30 minutes:
- Anna Wallach or her direct report is in the room
- We bring a 90-second live demo (browser extension firing a real
  interrupt on a real user account, not a video)
- We exit with a specific follow-up commitment ("we'll have your
  R&D contact on a call within 30 days") and the next 30-min
  meeting is in their calendar within 7 days

**Bio CEO Summit (New York, second week of February, 2027):** smaller
than JPM, denser pharma C-suite presence, better for the moonshot
conversation with Lars Fruergaard Jørgensen (CEO) if he attends.
Plan B if JPM doesn't land the strategic conversation.

### The cold email template (3-paragraph + ask)

For founders who are not me, who want to use this template directly:

> **Paragraph 1 — Who you are + what COYL is in one sentence.**
> "I'm Iman, founder of COYL. We're the behavioral interrupt layer
> that fires in the 3-second window before the autopilot behavior the
> drug is supposed to be solving."
>
> **Paragraph 2 — The Novo-specific frame.**
> "Why Novo: the Wegovy maintenance problem is the fastest commodity
> wave the obesity category has ever seen. The drug got patients to
> the weight; nothing gets them to keep it. We built the layer that
> runs after the prescription stops. 50K consumer users, six obesity
> archetypes, clinical RCT in IRB review with Found Health."
>
> **Paragraph 3 — The proof artifacts + the parallel.**
> "Open protocol at coyl.ai/protocol. Demo at coyl.ai/audit. We're
> having a parallel conversation with one other Top-2 obesity pharma
> — not pushing urgency, flagging timing."
>
> **The ask:** "30 minutes with whoever owns Wegovy maintenance
> strategy. R&D, Strategy, or Commercial — happy to be routed."

### The warm-intro request template (to forward via mutual contacts)

For the intermediary's voice — they say this, not us:

> Hey [Novo exec] — quick forward. The COYL team built the
> behavioral-interrupt layer between GLP-1 prescription and long-term
> behavior change. Specifically interesting for the Wegovy
> maintenance + post-taper window — they have data showing the
> 3-second-window intervention works at consumer scale (50K users).
> Founder is Iman Schrock; he's having parallel conversations and
> I thought you'd want context before someone else here did. Worth
> 30 minutes — happy to make the introduction.

---

## Section 2 — First call (30 min)

The first 30 minutes is not a sales call. It's a context-setting call
that determines whether there's a second 30 minutes. Treat it that
way.

### 5 min — Open (founder story + COYL one-paragraph)

"Thanks for the time. I want to be direct about what this is and
isn't. I'm not running an M&A process. We're building. But Novo's
the right room for this conversation, and I'd rather you know the
shape of what we've built before someone else inside the company
asks where the maintenance-adjunct layer is.

Quick founder context: I built COYL after watching every
behavior-change app I'd ever tried fail at the same moment — the
3-second window between the trigger and the behavior. Apps measure
the behavior. Coaches discuss the behavior. Drugs suppress the
behavior. Nothing fires at the moment the behavior is about to run.
That's the COYL window. We built the protocol for it, and we open-
sourced the spec (Apache 2.0) so it becomes the category standard,
not a black box.

50K consumer users today. Six named obesity archetypes. RCT in IRB
review with Found Health. Open protocol at coyl.ai/protocol. Closed
production reference engine at coyl.ai."

### 10 min — Product walkthrough (live demo)

Open the laptop. No pitch deck. Real account, real data.

**Demo 1 — The audit (3 min):** Walk through a 90-second user audit
on coyl.ai/audit. Show the archetype assignment in real-time (e.g.,
"Night Fridge Saboteur") and the danger-window calibration ("Tuesday
+ Thursday + Sunday between 9:08 PM and 10:18 PM"). The audit is the
product surface that produces the most reliable "oh." moment in BD
rooms. Use it.

**Demo 2 — An interrupt firing (4 min):** Either live on the real
extension in the test tenant, or the 60-second video if logistics
require. Show:
- The trigger fires at 9:08 PM (real timestamp)
- The interrupt delivers — "You committed to not eating after 9.
  This is the script you're running. The kitchen is not a snack
  store. Pull through."
- The user resolves: pulled through / slipped / negotiating
- The outcome webhook hits the user's behavior graph
- The Self-Trust Score updates in real time

**Demo 3 — The Self-Trust Score + Model Snapshot (2 min):** Show
the dashboard. The Self-Trust Score is the metric. The Model
Snapshot is the patient-facing summary of "what your behavior graph
looks like." These two surfaces are what Novo's medical-affairs team
would license as the clinically-meaningful outcome measure for any
maintenance-adjunct trial.

**Demo 4 — The daily-number ritual (1 min):** Open the Wrapped-style
weekly review card. The daily-number is the engagement loop that
keeps users in the model. Daily active rate is 67% — meaningful for
pharma, who are used to GLP-1 daily injection compliance rates in the
40-60% range.

### 5 min — Strategic frame (the Novo-specific argument)

"Here's the strategic frame, and I'll be specific:

**The Wegovy maintenance problem is your fastest commodity wave.**
Lilly's pricing pressure on Zepbound is real. Compounding pharmacies
are taking the easy share. Insurers are tightening coverage. The
field is moving to per-month-retention metrics — and the leading
indicator of per-month-retention is whether the patient sustains the
behavior after the drug.

**COYL is the layer the drug needs after the prescription stops.**
We can't compete with the molecule. We can extend the molecule's
effective window from "during prescription" to "12-24 months
post-taper." That's the difference between Wegovy as a 12-month drug
and Wegovy as a 36-month behavioral-pharmaceutical combination.

**Three concrete configurations Novo could ship within 12 months:**

1. **Wegovy + COYL bundle.** Patient gets prescription; patient
   gets COYL access included in the maintenance protocol. Novo
   markets it as "the only GLP-1 with a built-in behavior layer."
   Lilly cannot ship this in 12 months. They'd need to acquire or
   build, and they're behind.

2. **Post-taper relapse-prevention RCT.** Novo funds the multi-site
   RCT (we already have the IRB-stage trial with Found Health).
   Endpoint: weight regain at 12 months post-taper. If COYL
   reduces regain by 30%+ vs standard of care, you have the
   regulatory + payer story that makes Wegovy maintenance covered,
   not optional.

3. **Behavioral evidence platform.** The Self-Trust Score, Model
   Snapshot, and slip-window data become the behavioral evidence
   layer for every Novo cardiometabolic trial — not just Wegovy.
   Ozempic, Rybelsus, future molecules. This is the long-horizon
   acquisition rationale.

Novo's existing partnerships (Wegovy + Garmin smartwatch tracking)
measure. They don't intervene. The structural difference is the
3-second window. Measurement doesn't change behavior. Interruption
does."

### 5 min — Business model

"Two paths. I'll name both clearly so you can pick.

**Path A — Strategic deal (the right next step).** $50-100M LOI for:
- Exclusive behavioral-layer adjunct partnership in obesity/
  cardiometabolic globally
- Co-funded clinical evidence program (Novo provides the cohort
  access through investigator-initiated study network; COYL
  provides the platform + protocol + behavioral data infrastructure)
- 12-month exclusivity period during which Novo cannot acquire or
  invest in a direct competitor (Noom Med, Calibrate, Sequence)
- Optional second tranche linked to commercial milestones

**Path B — Acquisition.** $4-6B at the right milestone (RCT data
in hand + 500K users + parallel conversation with Lilly visible).
Path B becomes the right move when:
- Path A pilot lands with measurable behavioral outcomes (Month 6-9
  of the strategic deal)
- COYL hits 500K consumer users + 10K paying users + clinical RCT
  preliminary data
- The Lilly conversation creates a parallel bidder

We're not asking for Path B today. We're asking for Path A as the
right next step. The strategic deal is what builds the evidence base
that Path B requires. Skip Path A and Path B becomes a $1-2B
discussion, not a $4-6B discussion.

**The honest scenario tree:**
- Path A signs in 90 days; Path B signs 12-18 months later: $4-6B
- Path A signs, Path B doesn't follow: COYL keeps building, IPO
  trajectory or later sale at $2-3B
- Neither signs: COYL builds independently to $100M ARR and the
  conversation reopens at Series B/C valuations

I'd rather be honest about all three than pitch a single outcome."

### 5 min — Q&A + close

Two questions you should be ready for:

**"How is this different from Noom Med?"** Noom is a 6-month
clinician-led behavior program that runs alongside the drug. It's a
weekly cadence. COYL fires in real time at the moment of the
behavior — 100s of times per week, not weekly. We're a runtime
behavioral layer; Noom is a coaching program. Both can coexist; only
one is integrable as a real-time pharma adjunct.

**"Why should we buy when we can build?"** Two answers:
- (a) The 50K-user behavioral model is unreplicable. You can hire
  the engineers; you can't generate the slip-event data without
  6+ months at consumer scale. We have it.
- (b) The protocol is open-source (Apache 2.0). Anyone can implement
  the BIP spec. What you'd be acquiring is the reference engine, the
  data, and the team that knows how to operate it. Building takes
  18-24 months and starts from zero behavioral data. We started
  18 months ago.

**Close (the line that exits the room):**

"Three concrete next steps:

1. The follow-up call within 14 days with your R&D leadership and
   our clinical research lead. We walk through the IRB protocol and
   the Found Health structure.

2. Diligence packet review. I'll send the non-NDA tier today; the
   NDA-tier follows once we're on the same page about a strategic
   deal as the framing.

3. Whoever inside Novo would own the maintenance-adjunct strategy —
   put them in the room. I'd rather have the full conversation than
   the corp-dev-only one.

Thanks for the time. I'll send a recap within 24 hours."

---

## Section 3 — Diligence packet structure

Three tiers. Never send tier 2 or 3 without the correct prior step.

### Tier 1 — Pre-meeting (no NDA, share before the first call)

These are public or near-public; the goal is to get Novo into the
room having read the framing.

- One-pager (`docs/pitch/one-pager.md`)
- Strategy v3 (`docs/strategy/strategy-v3.md`) — the financial frame
- Behavioral Interrupt Protocol v0.1 spec (Apache 2.0,
  coyl.ai/protocol)
- Press kit (`docs/outreach/press-kit-editorial.md`) — for context
  on category framing
- The audit demo URL (coyl.ai/audit)
- The 90-second product video (coyl.ai/demo)

Sanitization: no patient-level data, no IP details on the predictive
model architecture, no enterprise customer names, no investor names.

### Tier 2 — Post-NDA (share once mutual NDA signed)

NDA template: standard 2-year mutual NDA, no exclusivity tie. Send
within 7 days of the first call if Novo expresses interest in
"deeper conversation."

- Clinical study protocol (`docs/clinical-study/protocol.md`)
- IRB submission narrative (`docs/clinical-study/irb-narrative.md`)
- Aggregate cohort behavioral data (de-identified, n-based not
  user-based)
- Six-archetype taxonomy (`docs/strategy/cohort-refresh-process.md`)
- Self-Trust Score + Model Snapshot specification
- Engineering architecture overview (`docs/ENGINEERING.md`)
- Revenue model + cap table (the Strategy v3 financial sections in
  full detail)
- Letter from the M&A advisor (Qatalyst, if engaged) confirming
  asset-shape diligence has been done

### Tier 3 — Acquisition diligence only (full data room)

Open only after an LOI is on the table — meaning Novo has expressed
a number (even an indicative range) and signed a 30-day no-shop or
similar.

- Per-user behavioral logs (de-identified, full slip-event data)
- Source code repository access (read-only)
- All commercial agreements + enterprise pilot contracts
- Investor agreements + cap table in full
- Founder + key personnel employment agreements
- Patent + IP filing status
- Customer + revenue audit (Stripe data, monthly cohort retention)
- Regulatory + privacy posture (HIPAA, GDPR, SOC 2, BAA-ready)
- The protocol licensing strategy + open-source governance plan
- Tax + corporate structure
- Pending litigation + indemnification disclosure (we have none —
  document this affirmatively)

The data room lives on a HIPAA-compliant VDR (Datasite or Intralinks,
not Dropbox). Access is logged. Novo's diligence team gets named
seats. No bulk download.

---

## Section 4 — The honest counter

Every BD conversation has a moment where the acquirer's smartest
person makes the counter-argument. Prepare for it. Don't dodge it.

### Novo's strongest counter: "We already partnered on Wegovy + Garmin"

This is true. Novo + Garmin shipped the smartwatch integration in
2025. From Novo's perspective: "We already have the connected-device
behavioral layer."

**The honest response:**

"You have the measurement layer. The Garmin partnership tracks step
count, sleep, heart rate, and weight trend. It tells the patient and
the clinician what happened. It doesn't intervene at the moment the
patient is about to commit the autopilot behavior.

The structural difference: Garmin is a sensor + tracking stack. COYL
is a runtime interrupt stack. Garmin doesn't fire at 9:08 PM when
the Night Fridge Saboteur opens the fridge. COYL does. The integration
isn't competitive — they're at different points in the behavior loop.

If anything, COYL + Garmin is the right architecture: Garmin as the
biometric signal source, COYL as the runtime decision + intervention
layer. The BIP protocol natively supports Garmin as a Trigger source.
We could ship the integration in 60 days post-LOI."

This reframe is critical. Novo's existing partner ecosystem is not a
reason to skip COYL — it's a reason COYL slots in. Don't lose the
room by pitching against Garmin. Pitch alongside it.

### Novo's secondary counter: "Why not a smaller deal? License the data."

A common pharma corp dev move: "We don't need to acquire you. Let's
just license the dataset and integrate the API."

**The honest response:**

"Two things:

(a) The data is downstream of the runtime engine. Licensing the
output of a system is licensing a snapshot. The system is the asset
— the engine that produces new slip-event data every day at consumer
scale, the team that knows how to operate it, and the protocol that
makes the engine extensible. Licensing the data without the engine
is a one-time procurement. We're worth more than that.

(b) The strategic value of the parallel-acquirer dynamic is real.
Licensing arrangements do not create the parallel-bidder pressure
that drives the strategic premium. If Novo licenses, COYL stays
independent — and the parallel conversation with Lilly continues.
That's a worse outcome for Novo than a clean strategic deal at
Path A scale."

The license trap is real. Don't take a license-only deal unless the
license fee is north of $25M annually with a clean acquisition right
of first refusal — and even then, only as a bridge to acquisition.

---

## Section 5 — Specific contact list

Five named contacts at Novo Nordisk, ranked by best channel + reason
to engage. The titles reflect public LinkedIn + Novo press as of May
2026; verify before outreach.

### 1. Anna Wallach — Strategy + Innovation lead, US

**Role:** Heads Novo US Strategy + Innovation. The bridge between
US Commercial leadership and Bagsværd corporate strategy. Has
public-speaking history on GLP-1 maintenance economics + obesity
commercial roadmap.

**Best channel:** Warm intro via Novo Ventures portfolio company
founder, OR Qatalyst-introduced 30-min slot at JP Morgan Healthcare
Conference.

**Reason to talk to her:** Anna is the right altitude — senior enough
to convene R&D + Commercial + Corp Dev in the same room, junior
enough to actually run a deal cadence. She's the single most
important first contact at Novo. Open with her.

**Talking points specific to Anna:**
- The maintenance gap as the next obesity commercial wave
- The Garmin integration as complement, not competitor
- Path A as the right next step (not Path B)
- COYL's protocol-first architecture as the long-horizon strategic
  positioning Novo needs vs. Lilly's vertical-build approach

### 2. Lars Fruergaard Jørgensen — CEO

**Role:** Group CEO of Novo Nordisk. Public-facing on the obesity
strategy, the global commercial pivot, and the "what comes after the
GLP-1 patent cliff" question.

**Best channel:** Bio CEO Summit hallway, OR Qatalyst's
Quattrone-to-Lars warm channel, OR via Novo Holdings chairman.

**Reason to talk to him:** Moonshot case only. Lars doesn't run
30-min product demos. The conversation with him happens after Path A
LOI is signed and Path B is on the table. He's the person who makes
the $4-6B yes/no decision when corp dev has done the work.

**Talking points specific to Lars:**
- The 10-year obesity moat (post-patent-cliff Wegovy positioning)
- The behavioral evidence platform across the full Novo
  cardiometabolic portfolio (Ozempic, Rybelsus, future molecules)
- The parallel-acquirer dynamic with Lilly as the explicit framing
- The Pear Therapeutics lesson — why digital health adjuncts need
  to be acquired, not built in-house

Don't ask for a 30-min meeting with Lars cold. Get to him via Anna.

### 3. Doug Wamsley — Corp Dev US

**Role:** US Corporate Development. The transactional layer. Owns
diligence, LOI structuring, and deal mechanics.

**Best channel:** Direct cold email (highest reply rate of any Novo
contact for the corp-dev-shaped pitch) OR Qatalyst intro.

**Reason to talk to him:** Doug is the deal mechanic. He's the
person who actually structures Path A. The first cold email goes to
Doug + Anna simultaneously — Doug for transactional engagement,
Anna for strategic.

**Talking points specific to Doug:**
- The financial frame in Section 2 (Path A vs Path B numbers)
- The diligence packet structure (Section 3)
- The 90-day LOI cadence as the realistic timing
- The license-only counter (Section 4) — Doug will raise this; have
  the answer ready

### 4. Kim Sigh Andersen — R&D leadership (obesity)

**Role:** Obesity R&D leadership, Bagsværd. Has run the clinical
trial portfolio for Wegovy + adjacent semaglutide indications.

**Best channel:** Via Anna Wallach (don't cold-email R&D directly;
it pattern-matches to vendor pitch). Anna routes us in once she's
warm on the strategic frame.

**Reason to talk to him:** Kim is the clinical conversation. Once
Path A is on the table, the next 30-min meeting is Kim + our
clinical research lead. We walk through:
- The Found Health IRB protocol
- The behavioral-interrupt RCT design + powering
- How the Self-Trust Score becomes a clinically-meaningful endpoint
  (validation pathway)
- The investigator-initiated study network Novo could open up for
  the multi-site version

The Kim conversation determines whether the strategic deal includes
the co-funded clinical evidence program (which is the highest-value
component for both sides).

### 5. Mads Krogsgaard Thomsen — Chief Science Officer

**Role:** Group CSO. Long-horizon science strategy. Less involved in
acquisition mechanics; very involved in the "is this real science
or is this an app?" diligence question.

**Best channel:** Via Kim Sigh Andersen, OR via the Novo Foundation
medical advisory network.

**Reason to talk to him:** Mads is the credibility gate. If the
clinical conversation goes well with Kim, the next layer up is Mads
— and Mads either signs off on "yes, this is real science worth
acquiring" or kills the deal at the science-credibility level.

**Talking points specific to Mads:**
- The Behavioral Interrupt Protocol as a public, peer-reviewable
  specification (not a black box)
- The JITAI (Just-in-Time Adaptive Intervention) academic precedent
  — Nahum-Shani et al. 2018, Annals of Behavioral Medicine — as
  the scientific lineage COYL extends
- The RCT design + the registered SAP (statistical analysis plan)
- The data + IP strategy: open protocol, proprietary engine,
  defensible behavioral model

Mads is the hardest sell at Novo. He's seen 100 digital health
pitches. He'll vote yes only if the science is real. The clinical
study + the published protocol are how we earn his yes.

---

## Section 6 — Post-call follow-up (within 24 hours)

**Subject:** Recap + the three documents

Hi [name],

Thanks for the time. Three things from the call:

1. Recap of what we covered, in one paragraph: COYL is the
behavioral-interrupt layer that fires at the 3-second window between
trigger and behavior. The maintenance gap (Wegovy patients regaining
60-70% of lost weight within 12 months of taper) is the specific
problem we're built for. Path A is a $50-100M strategic deal —
exclusive behavioral-layer adjunct + co-funded clinical evidence
program — as the right next step. Path B (acquisition) becomes the
right conversation 12-18 months later once Path A pilot lands.

2. Three documents attached:
- The one-pager (public, share freely)
- The protocol spec (Apache 2.0, share freely)
- The Found Health clinical study structure (NDA-tier; please don't
  forward without checking with me)

3. The proposed next step: a 30-minute follow-up call with you +
Kim Sigh Andersen (R&D) + our clinical research lead within 14 days.
The agenda is the IRB protocol + the multi-site investigator-
initiated study structure. Let me know who else from Novo should be
in that room.

I'll loop back in 5 business days if I haven't heard. Open to push
or pause based on what you're seeing inside the company.

— Iman · iman@coyl.ai · coyl.ai/protocol

---

## Section 7 — What never to say in a Novo room

- "We want to be acquired" — kills the deal cadence in 10 seconds
- "Make us an offer" — pharma corp dev hears "I have no leverage"
- "Lilly is going to buy us if you don't" — specific naming is
  coercion; pharma reads it and turns cold
- "We have term sheets" — unless we actually do, and if we do, you
  don't lead with it
- "Our $30M ARR" — when we're at $4M ARR. Lying about revenue is
  the single fastest way to lose Novo. They will diligence.
- "We've talked to Apple" — pharma is suspicious of consumer-tech
  cross-pollination at this stage. Mentioning Apple in a Novo room
  signals confusion about category positioning.
- "Our exit multiple is 50x ARR" — multiples are an investor frame.
  In a pharma room, frame the conversation around strategic value
  (the maintenance commercial moat) and clinical evidence (the RCT
  endpoint), not multiples.

---

## Section 8 — The closing line (verbatim, per memo Section 09)

If the conversation lands in the right zone — strategic frame
accepted, follow-up call scheduled, R&D in the next meeting — close
with the line:

> "We own the 3-second window between every human intention and the
> behavior that betrays it. That window exists in 8 billion people,
> 65% of their waking hours. The Wegovy patient who's running the
> 9 PM kitchen script tonight — Novo can intervene at 9:08 PM, or
> Novo can read about it in someone else's earnings call. The
> protocol category will have one winner. I'd rather Novo see it
> now."

This line is the headline of the entire pharma BD strategy. Use it
verbatim. Don't paraphrase. The specificity is the point.

---

*BD Script — Novo Nordisk — v1 May 2026. Replaces the
tech-platform-first BD sequencing per the $6B Acquisition Roadmap.
Pair with `bd-script-eli-lilly.md` for the parallel bidder strategy
and `bd-pharma-strategy.md` for the unified pharma BD frame.*
