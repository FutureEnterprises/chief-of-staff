# Customer Testimonial Acquisition Plan — May 2026

**Document type:** Working marketing plan.
**Audience:** Founder, growth lead (when hired).
**Time horizon:** 30 days from kickoff to first three quotes on the site.

> **The honest starting point:** COYL has zero customer testimonials,
> zero logos, and zero case studies on the marketing site. This shows
> up in every external audit as the single biggest credibility gap
> after the compliance claims (covered separately in
> `docs/regulatory/compliance-posture-may-2026.md`).
>
> The company is also pre-revenue. There are no testimonial-ready
> *customers* in the conventional sense. So this plan is structured
> around the three real populations COYL can credibly source from
> today — and the explicit list of what NOT to do.

---

## The Four-Step Plan

### Step 1 — Sourcing Track A: existing-flow users

**Who:** The first 10 users who have completed the autopilot audit,
provided an email, and shared a share-card archetype. Pulled from the
`audit_funnel_events` table (`packages/database/prisma/schema.prisma`
line ~1935) by joining `kind = 'completed'` with
`kind = 'email_captured'` for the same `sessionId`, then cross-
referencing against any downstream `signup_started` events. The same
join also exposes which `archetypeFamily` each user landed on, which is
the hook for the personalized outreach.

**Why this is the right first track:** These users have already
voluntarily told us (a) they took the time to finish the audit (60+
seconds of engagement, which screens out tourists), (b) they trusted us
with an email, and (c) they liked their archetype enough to share it.
That sequence is roughly the warmest signal a pre-revenue consumer app
ever generates. They are also already self-selected as
behaviorally-aware people who can articulate a pattern — the exact
trait that produces a good one-line testimonial.

**The ask:** A one-line quote about the audit experience. Not the
product (which they have not yet experienced). Not the outcome (which
they have not yet earned). Just the **moment of recognition** — "I
read the Weekend Rebounder description and it was uncomfortable how
exact it was." Specific, lived, unfakeable.

**The deliverable:** 3–5 quotes by first-name + initial + city (e.g.,
"Maya R., Brooklyn") that go in a new module on `/audit/result/...`
share pages and on the homepage hero strip. Permission obtained
explicitly in the reply email; quote text confirmed verbatim before
publication.

**Success bar:** 30% reply rate on the first 10 sends. 3 publishable
quotes within 14 days.

**Operational steps:**

1. Run the SQL join above; export to CSV with columns
   `email, archetypeFamily, completedAt`.
2. Sort by `completedAt` ascending. The earliest 10 are the warmest
   (they reached the funnel before the product was polished — they're
   the *believers*).
3. Personalize each email with the actual archetype name.
4. Send from the founder's address — not a `hello@` or `team@` — so
   the reply is to a real person.
5. Use the Track A template below.

---

### Step 2 — Sourcing Track B: clinician pilots

**Who:** The first 3 GLP-1 prescribers who onboard via
`/clinician/onboarding` (after the LinkedIn / X outreach campaign
described in `docs/regulatory/regulatory-strategy.md` and in the
`/rebound/for-clinicians` page hero — the "first 25 patients free"
offer).

**Why this is the right second track:** A clinician quote is worth
roughly 10x a patient quote on a B2B-leaning surface. The signal
asymmetry is enormous: a patient saying "this helped me" is one data
point. An endocrinologist or obesity-medicine MD saying "I'm seeing
this in my panel — the late-night unlock pattern is real and COYL is
the first tool that surfaces it before the regain" is a category
endorsement.

**The ask:** A 1–2 sentence quote *after the clinic has been live for
60 days* (long enough for at least one pre-slip signal to fire and at
least one patient hold) and we have one concrete pattern to point at
together. The quote frames what the clinician noticed in their own
panel that they wouldn't have seen without the tool.

**The deliverable:** The clinician's quote, name, credential, and
clinic name, used on:
- The co-branded `/rebound` landing page (legally required to name them
  anyway, since it's their co-branded surface).
- `/clinician` as a "what prescribers are noticing" module.
- The homepage as a quote-with-credential bar.

**Success bar:** 1 publishable clinician quote within 90 days of the
first signed clinic. 3 within 180 days.

**The "what I noticed in my panel" framing matters.** Asking a doctor
for a testimonial gets a refusal or a useless platitude. Asking a
doctor "what was the one moment in the last 60 days where the COYL
dashboard told you something about a patient before the patient told
you" gets a specific, citable observation. The first version is a
testimonial. The second is publishable clinical narrative.

**Operational steps:**

1. Schedule a 30-minute call at the 60-day mark with each pilot
   clinician — frame it as a "what's working / what's not" review, not
   as a testimonial request.
2. Record (with permission). Listen for the specific moment. Pull the
   two best sentences. Send them back to the clinician verbatim with
   "Mind if we use this on the co-branded page and on /clinician?"
3. Most will say yes. Some will edit. A few will decline; respect
   that and ask if they'd refer one peer instead.

---

### Step 3 — Sourcing Track C: founder's own circle

**Who:** Beta testers from the founder's existing personal and
professional network. This is uncomfortable to acknowledge but it is
how every consumer software company gets its first three testimonials
without fabricating them. Notion, Linear, Superhuman, Cron — all of
them seeded their first wave with named friends-of-founder.

**Why this is legitimate:** The bar is *named, real, credible
people, accurately quoted, with disclosed relationships when material.*
Beta testers who are friends are still real users with real experiences.
The lie is calling them strangers; the truth is calling them what they
are: early users who happened to be in the founder's network.

**The ask:** A short, specific quote from 2–3 people who genuinely use
the product. Use their real names. If the person is materially known
(a notable founder, a relevant clinician, a respected researcher) the
quote carries even more weight, and a brief credential line is
acceptable. If the person is a personal friend with no domain
credibility, **do not pretend they are a clinician or a notable
operator** — use first name + city + role only.

**The deliverable:** 2–3 quotes on the homepage as a "Day 1 anchor"
testimonial strip, deployed before the audit-flow Track A quotes are
ready (Track C is week 1, Track A is week 2–3).

**Success bar:** 3 publishable quotes within 7 days, all with verified
real users behind them.

**The disclosure rule:** If a quoted person has a material financial
relationship with COYL (advisor, investor, employee, equity holder),
**that relationship must be disclosed** next to the quote. "Mira K.,
COYL advisor and former Calibrate clinical lead" is honest and
credibility-additive. "Mira K., obesity medicine specialist" when she's
also a paid advisor is a quiet misrepresentation that the FTC and a
class-action lawyer will both find. The 2023 FTC *Endorsement Guides*
revisions made this enforcement-active.

---

### Step 4 — What NOT To Do

These are the failure modes that cost more than the testimonials are
worth:

1. **Never fabricate.** No invented quotes, no invented users, no
   "John D., software engineer" who does not exist. The cost-benefit
   is catastrophic and one-way: discovery is permanent; credibility is
   permanently lost. Every wellness-app blow-up of the last five
   years has had this somewhere in its post-mortem.
2. **Never use stock-photo "users."** Stock-photo headshots next to
   testimonial blocks are immediately, visibly fake to a 2026 audience
   that has seen them 10,000 times. Even with real quotes, the
   stock-photo signal cancels the quote signal. Either use a real
   photo (with permission) or no photo at all. A monospace name on a
   clean rule is more credible than a smiling stock photo above a
   real name.
3. **Avoid generic 5-star pull-quotes.** "I love COYL!" "Game-changer!"
   "Best app I've ever used!" — these read as fake even when they are
   real, because they are devoid of the specific lived detail that
   distinguishes a real user. Specificity is the cheapest
   anti-fabrication signal we have. Push every quote toward a single,
   testable, falsifiable observation. "It caught me at 9:47 PM in
   front of the freezer" beats "amazing product."
4. **Never quote a clinician on a clinical claim COYL has not
   substantiated.** A doctor saying "I've seen 30% lower regain in my
   COYL patients" without the n, the methodology, and the controls
   reachable from the same page is the exact pattern the FTC has hit
   in the *Modere*, *NeuroBeauty*, and 2024 *DermaTech* actions.
   Clinician quotes must stay in the realm of qualitative observation
   ("I'm seeing the pattern before the patient calls me") not
   quantitative claim.
5. **Avoid the "We're trusted by 10,000+ users" hero strip without
   substantiation.** Vanity user-count strips age catastrophically and
   are the first thing diligence asks for receipts on. If a number
   appears on the homepage, it must be exact, dated, and reproducible
   from the database the same day.
6. **Do not publish a testimonial without explicit written
   permission.** Email reply with "yes you can use this" is the
   minimum bar. Screenshot of the email kept in
   `docs/marketing/testimonials-permissions/` with the user's name and
   the date. This protects against the user later asking it to be
   taken down and the company having no record of the original
   consent.

---

## Email Templates

> Template philosophy: short, personal, asks for something small,
> from a real person. Do not use a marketing automation tool for these
> first 10. The reason these convert is that they don't look like
> marketing.

### Template A — Audit-flow user (Sourcing Track A)

> Subject: that COYL archetype you got
>
> Hi [first name],
>
> [Founder name] here — I'm the founder of COYL. You took the
> autopilot audit on [date], landed on **The [Archetype Name]**, and
> shared it. I wanted to reach out personally to ask one question.
>
> When you read the archetype description, was there a specific
> sentence that landed — one that felt uncomfortably exact?
>
> If yes, would you mind sending me that sentence and a one-line
> reaction to it? I'd love to put it on the page as a real
> first-name testimonial (first name + first initial of your last
> name + city only — nothing more identifiable than that). I'll
> send you the exact text before anything goes live.
>
> If not — no worries, and thanks for taking the audit. I read
> every reply.
>
> [Founder first name]
> founder, coyl.ai

### Template B — Pilot clinician (Sourcing Track B), 60 days in

> Subject: 30 min to compare notes — COYL pilot at [Clinic Name]
>
> Dr. [last name],
>
> It's been 60 days since [Clinic Name] onboarded onto the COYL
> Rebound pilot. I'd love 30 minutes on the calendar to walk
> through what the panel has shown so far — both what's working
> (where COYL caught a slip before you would have) and what isn't
> (what we'd need to change for it to be worth more of your time).
>
> If something specific has stood out — a pattern in the panel, a
> particular patient who held when historically they wouldn't have,
> a piece of the dashboard you wish worked differently — that's
> exactly the kind of thing I'm hoping to hear, and the kind of
> thing that, with your permission, would be useful to point other
> prescribers at when they're evaluating the tool.
>
> Calendly: [link]. Or just reply with two times that work.
>
> Thanks for piloting,
> [Founder first name]
> founder, coyl.ai

### Template C — Beta tester in founder's circle (Sourcing Track C)

> Subject: a small ask
>
> Hey [first name] —
>
> Quick one. We're putting the first round of real testimonials up
> on coyl.ai this week, and I'd love to use a sentence or two from
> you if you're up for it.
>
> The honest version: you've actually used the product, you're a
> real person with a real archetype, and your name on the page
> would be credibility-additive in a way stock-photo testimonials
> are not. The bar is just a specific, lived sentence — something
> like "the 9:47 PM interrupt is genuinely embarrassing in how well
> it works." Not "great product."
>
> Three asks:
> 1. Send me one sentence I can use verbatim.
> 2. Confirm I can use your real name + role (e.g., "[First Last],
>    [role at company]"). If you'd rather it be first-name only,
>    that's fine — say the word.
> 3. If you're an investor / advisor / employee, I'll disclose
>    that next to the quote because the FTC now requires it; this
>    doesn't reduce the credibility, it actually increases it.
>
> No pressure — if it's not your kind of thing, I get it.
>
> [Founder first name]

---

## Rollout Sequence

| Week | Action |
|---|---|
| 1 | Send Track C asks to 3–5 people in the founder's circle. Publish 2–3 quotes to homepage as the Day 1 anchor by end of week. |
| 2 | Run the SQL join, export first 10 audit-completers with email. Send Track A template (personalized per archetype) over 2 days. |
| 3 | Replies land. Publish 3–5 Track A quotes onto `/audit/result/...` share pages and add to homepage strip. |
| 4 | Track B is dormant until first clinic onboards. Add a calendar tickler at the 60-day mark for each signed clinic to trigger Template B. |
| Ongoing | Quarterly: refresh quotes. The homepage strip rotates every quarter so it never looks frozen. Permissions folder gets updated with every new quote. |

---

## Storage & Records

Every published quote has a backing record in
`docs/marketing/testimonials-permissions/` containing:

- The user's first email or DM that included the quote.
- The follow-up email confirming the exact text and the permission
  language ("yes, you can use this on the site").
- Date of publication and the URL(s) where the quote appears.
- A material-relationship disclosure note (employee / advisor /
  investor / customer-only).

This folder is the company's defense in any future FTC inquiry about
endorsement substantiation, and it is the artifact a future diligence
team will ask for in the first hour.

---

*Document owner: founder until growth lead is hired, then growth lead
with founder review on every new quote before publication.*
