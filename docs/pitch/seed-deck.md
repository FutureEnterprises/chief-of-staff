# COYL — Seed Deck

> _The behavioral interrupt protocol for AI._
> _Live in the three seconds between the impulse and the action._

**Stage:** Pre-seed → Seed · founder-led · infrastructure live · pre-revenue
**Raise:** $2.5M SAFE on a $15M post-money cap (see [seed-raise-proposal.md](./seed-raise-proposal.md))
**Founder:** Iman Schrock, PhD · iman@coyl.ai · coyl.ai
**Date:** May 2026
**This deck:** ~14 slides, designed for a 10-minute pitch + 20-minute Q&A.

> _A note on this deck before you read it._
> This document is written to be honest before it is written to be persuasive.
> Where the company is pre-revenue, it says so. Where the team is one
> person, it says so. Where a claim is a published number, it is sourced.
> Where a claim is a thesis, it is named as a thesis. If something in here
> reads like a polished number from a company three years older — flag it.
> That is the bar this deck is held to.

---

## How to use this file

Each `## Slide N` block is one slide. Body copy on the slide is the
markdown content underneath. Italic _speaker notes_ are the talk track —
never on the slide itself.

Each slide caps at ~60 words on the surface. The notes carry the rest.

---

## Slide 1 — Title

# COYL

### _The behavioral interrupt protocol for AI._

Your patterns are louder than your plans.
COYL lives in the three seconds between.

**Iman Schrock, PhD · iman@coyl.ai · coyl.ai**

_Speaker notes: 8 seconds. Don't read the slide. The hero line is the
website's hero line on purpose — the brand has one sentence, this deck
opens with it, every later channel repeats it. Repetition is the brand._

---

## Slide 2 — The Problem

# You know what to do. You don't do it.

Every behavior-change product intervenes **before** the moment
(reminders) or **after** the moment (journaling, weigh-ins, coach
calls).

Nothing intervenes _in_ the **3-second window** between the
trigger and the action.

> _That window is where every diet fails, every focus block dies,_
> _and every GLP-1 user regains the weight._

_Speaker notes: This is the pain. State it as a fact. Every adult in
the room has lived this moment. Don't argue the problem — name it and
watch them nod. The 3-second window is the deck's central frame; every
later slide compounds off it._

---

## Slide 3 — Why Now

# AI has never met human behavior before.

For thirty years software watched what you did and reported it back.
For two years language models answered what you typed.

Neither system has ever shown up at the **moment your hand reached
the handle.**

Three things finally arrived at the same time:

- **LLMs** that read patterns in real human language
- **Edge inference** cheap enough to fire per-event (<$0.001/call)
- **Always-on devices** on the wrist, in the pocket, in the browser

_Speaker notes: This is the "why now" — investors who skipped the
behavior-change category in 2018–2023 hear this and unblock their
priors. The category is genuinely new because the substrate is
genuinely new. Three years ago a $12/mo product could not have
absorbed the inference cost. Today it can._

---

## Slide 4 — The Insight

# Psychology met the technology. They stopped arguing.

The founder spent twenty years studying the gap between what people
say they will do and what they actually do under load.

The intervention nobody had built was an _outside voice_ that lives
inside the three-second window — with context, with a script, with
one quiet sentence at the threshold.

That intervention requires both halves:

- The **behavioral science** that knows what to say
- The **AI substrate** that earns permission to say it _then_

> _COYL is the first product where those halves agree._

_Speaker notes: This is the founder lens slide. Don't drift into
academic citations — name JITAI / implementation intentions / EMA only
if asked. The story is: the founder studied this gap academically,
lived it personally, and the missing piece was always the technology
that could live in the window. The technology just arrived._

---

## Slide 5 — Product

# Four open protocols. One reference engine. Three channels.

**The protocol stack** (Apache 2.0, public)

- **BIP** — Behavioral Interrupt Protocol (the context layer)
- **PAP** — Proactive AI Protocol (when an LLM may speak first)
- **EAP** — Edge AI Protocol (cross-device action)
- **UAP** — User Authority Protocol (the consent floor)
- **RAP** — Risk Assessment Protocol (when AI must defer to humans)

**The reference engine** — COYL Cloud, live at coyl.ai

**The channels** (built or in flight)
- Consumer app + web (live)
- Prescriber wedge — GLP-1 maintenance (outreach starting)
- Enterprise OEM — Microsoft Viva / 365 (conversation active)

_Speaker notes: The protocol layer is the strategic asset. The consumer
app is the proof. The prescriber + enterprise channels are the wedges.
Don't try to walk all five protocols — point at them. Open the README
at coyl.ai/protocol if anyone presses. The Apache 2.0 framing is
deliberate — it is the "Switzerland of proactive AI" positioning that
makes COYL acquirable by any of Microsoft / Apple / Meta / Google
without picking sides._

---

## Slide 6 — Market Wedges

# Three doors. One engine.

| Wedge | Why it's the door |
|---|---|
| **GLP-1 maintenance (speed wedge)** | Highest urgency · clearest stat · prescriber channel · paid willingness $29/mo |
| **General autopilot (front door)** | Largest TAM · Rewire $12/mo · the consumer brand surface |
| **Enterprise OEM (scale)** | Viva 85M-seat math · API/OEM revenue · strategic acquisition path |

> _Each wedge is built on the same protocol stack._
> _Each wedge sharpens the model for the next._

_Speaker notes: Stack the wedges; sequence them. GLP-1 is first because
the speed is real — patients are paying $200+/mo for the shot and are
terrified of the day they stop. General autopilot is the brand front
door. Enterprise is the long arc that turns this into infrastructure.
Don't oversell the sequencing — the seed funds the consumer + prescriber
wedge. Enterprise is what the Series A buys._

---

## Slide 7 — The Numbers

# The three numbers that matter.

**1. The GLP-1 number (Cambridge meta-analysis, 2026)**
60% of weight lost on Ozempic/Wegovy/Zepbound returns within 12 months
of discontinuation. Plateau ~75%. The drug suppresses appetite; it
does not touch the behavioral script underneath.

**2. The enterprise number (Microsoft Viva math, illustrative)**
Viva has ~85M paid seats inside Microsoft 365. At even a $1/seat/mo
behavioral-interrupt OEM share, that is **~$1B ARR** at the ceiling.
COYL targets the partner-program path to that math.

**3. The consumer number (illustrative pathway, not a forecast)**
~278K paying users × $29/mo Rebound = **$100M ARR**. That is the
order-of-magnitude target the consumer wedge underwrites against. We
are at zero. The deck does not pretend otherwise.

_Speaker notes: The 60% number is the only one that is a peer-reviewed
fact. The other two are pathway math, named as such. Anyone who
challenges them will be told they are the upside, not the underwrite._

---

## Slide 8 — Traction

# Brutally honest: infrastructure live, no paying users yet.

**Shipped (live at coyl.ai)**
- Consumer web app + iOS scaffold
- Stripe billing wired (Recover free · Rewire $12/mo · Rebound $29/mo)
- 4 protocol specs published Apache 2.0 (BIP, PAP, EAP, UAP) + RAP draft
- Clinical study protocol v0.9 written, IRB-pathway-mapped (partner-ready, not yet enrolled)
- GLP-1 prescriber cold-outreach template + 50-name target list method

**Honest gaps**
- **No paying users to report yet.** Billing live, conversion data forthcoming.
- **No customer testimonials.** Anything you read elsewhere is hypothetical.
- **No advisory board published.** Surfaces will return when a credible name confirms.
- **No PI named on the clinical study.** PI selection is part of the partner conversation.

> _The substrate is real._
> _The revenue is the next thing to manufacture._

_Speaker notes: Lead with the gaps, not the wins. The strongest signal
a pre-revenue founder can give an investor is "I am not going to
fabricate a story." The infrastructure list is genuine; the revenue
list is empty; the next 90 days are about converting the first into the
second. If anyone presses on traction, the answer is: "we are raising to
buy the channels that produce the first cohort." That is the round._

---

## Slide 9 — Business Model

# Three tiers consumer · PMPM B2B · OEM share enterprise.

**Consumer (live on coyl.ai/pricing)**
- **Recover** · Free — audit + archetype + 3 interrupts/week
- **Rewire** · $12/mo or $99/year — generic behavioral interrupt
- **Rebound** · $29/mo or $199/year — GLP-1 anti-regain layer

**B2B prescriber + clinic**
- $12–$18 PMPM, outcomes-tracked
- First 25 patients free during pilot
- Co-branded `/rebound/[clinic]` landing page

**Enterprise OEM (Viva / 365 + adjacencies)**
- Per-seat revenue share with the platform partner
- Protocol licensing for OEMs building on BIP

_Speaker notes: The three consumer tiers are live. The PMPM number is
what the prescriber cold-outreach offers. The OEM share is the Viva
conversation. Don't promise an ACV; promise the structure._

---

## Slide 10 — Competition + Moat

# The category is empty. The moat is the protocol.

**The empty category**

| Incumbent | Where they live | Why they don't fit the window |
|---|---|---|
| Noom | The morning after | Daily lesson model · not real-time |
| Calm / Headspace | The session | Pull-based · user has to open the app |
| BetterHelp | Tuesday at 3 PM | Scheduled · not in the moment |
| Hims / Ro | The prescription pad | Treats the chemistry, not the script |

**The moat (compounding)**

1. **The protocols are Apache 2.0** — open spec, COYL Cloud is the
   reference engine. First-mover on the behavioral-context standard.
2. **The data flywheel** — every interrupt + outcome sharpens the
   timing model for every user in the same archetype × window.
3. **The Switzerland posture** — the spec is open, which lets
   Microsoft, Apple, Meta, and Google all build against it without
   picking a side. The reference engine becomes the natural anchor.

_Speaker notes: The strongest argument is structural: incumbents'
engagement metrics (session length, lesson completion, renewal rate)
are directly cannibalized by a push-first JITAI surface. They can copy
features; they cannot copy the architecture without breaking their own
investor narrative. The protocol-Switzerland framing is the second-order
moat — it is what makes the company acquirable by any platform giant._

---

## Slide 11 — Team

# Founder-led. Recruiting technical cofounder + clinical advisor.

**Iman Schrock, PhD** — Founder
- PhD, Organizational Psychology
- Disruptive Strategy certificate (AI focus), Harvard
- AI Strategy certificate, Cornell
- Twenty years studying the behavior-intention gap
- Built the protocol stack + reference engine + consumer surface to date

**The personal "why-Iman"**
The founder lost the weight twice and regained it twice. Recognized
the autopilot script in real time at 11:14 PM on a Tuesday — and the
intervention that would have caught it didn't exist. _The founder's
own behavior was the first dataset._

**Recruiting (honest)**
- **Technical cofounder** — distributed-systems + ML, equity-led
- **Clinical advisor / co-PI** — obesity medicine or behavioral medicine
- **First engineer** — full-stack, hands-on the protocol surface

_Speaker notes: Don't apologize for being solo. Lead with the velocity
of what shipped — the protocol stack + reference engine + consumer
surface from one person is the strongest signal you can give. Then be
explicit: the seed funds the team that gets past the solo-founder
ceiling. The technical cofounder + clinical advisor are explicit hires,
not "we'll figure it out." If an investor wants to introduce one, that
is an offer the founder takes immediately._

---

## Slide 12 — Use of Funds

# $2.5M · 18 months · three milestone gates.

> _Tied 1:1 to the raise proposal — see [seed-raise-proposal.md](./seed-raise-proposal.md)._

| Bucket | $ | What it buys |
|---|---|---|
| **Engineering** | $0.9M | Technical cofounder + 1 senior engineer + designer |
| **Clinical** | $0.4M | Clinical advisor stipend · IRB submission · PI fees |
| **Growth** | $0.5M | Prescriber outreach lead · audit-funnel paid pilot |
| **BD** | $0.3M | Viva partner-program execution · OEM conversations |
| **Compliance + legal** | $0.2M | HIPAA / BAA / SOC 2 readiness |
| **Infra + tooling** | $0.1M | Vercel · Supabase · Anthropic · Twilio · Resend |
| **Operating buffer** | $0.1M | 18-month runway floor |
| **Total** | **$2.5M** | |

_Speaker notes: The buckets are tied to the milestone gates in the
raise proposal. Engineering is the biggest line because the technical
cofounder + first engineer is the unlock. Clinical is small because the
clinical study is partner-funded post-PI. The growth line is small on
purpose — the prescriber wedge is a 50-DM outbound motion, not a paid-
acquisition burn._

---

## Slide 13 — The Ask

# $2.5M SAFE · $15M post-money cap · founder-led, channel-validated.

**The structure**
- $2.5M raised on a SAFE (post-money valuation cap)
- $15M post-money cap, MFN, standard YC SAFE
- Lead check $1M–$1.5M; remainder as a small syndicate of operators

**What this buys**
- 18 months of runway
- The technical cofounder + clinical advisor + first engineer
- First 1,000 paying users via the prescriber wedge
- Microsoft Viva partner-program through to commercial conversation
- IRB-submitted RCT in flight by Month 9

**Why now is the moment**
The protocol stack is shipped. The website is live. The cold-outreach
templates are written. The next dollar produces the first channel —
not the first feature.

> _See [seed-raise-proposal.md](./seed-raise-proposal.md) for the full_
> _milestone tranches, investor-profile targets, and risk register._

_Speaker notes: The cap is defensible because the substrate is real.
Don't reach for a higher cap than the channels justify — a founder-led,
pre-revenue company at a $15M post-money cap is honest. A lower cap
buys a faster close. The SAFE structure preserves optionality for a
priced seed extension in 9–12 months if the prescriber wedge produces
the cohort the deck promises._

---

## Slide 14 — Appendix

### A1 — Protocol stack diagram

```
            ┌─────────────────────────────────────┐
            │  CONSUMER · PRESCRIBER · ENTERPRISE │
            │   (the three channels above ground)  │
            └─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │      COYL Cloud (engine)      │
            │    The reference engine for   │
            │     the protocols below       │
            └───────────────┬───────────────┘
                            │
   ┌────────────────────────┴──────────────────────┐
   │                                               │
   │  BIP — Behavioral Interrupt Protocol          │
   │  PAP — Proactive AI Protocol                  │
   │  EAP — Edge AI Protocol                       │
   │  UAP — User Authority Protocol                │
   │  RAP — Risk Assessment Protocol               │
   │                                               │
   │  All Apache 2.0 · all published · all live    │
   └───────────────────────────────────────────────┘
```

_[diagram: stack rendered as a slide-ready visual for the deck export]_

---

### A2 — The four rebound archetypes (Rebound tier)

| # | Archetype | Highest-risk window | The script |
|---|---|---|---|
| 01 | **Night Rebounder** | 9:00 – 11:30 PM | "One snack won't matter." |
| 02 | **Weekend Rebounder** | Sat 14:00 – Sun 23:00 | "Five clean days. I earned it." |
| 03 | **Stress Rebounder** | Stress event + 2h | "I'll restart Monday." |
| 04 | **Reward Rebounder** | 60–120 min after a win | "I deserve this." |

Each archetype is a specific moment × script × interrupt window — the
exact 3 seconds COYL fires in. The quiz at `/rebound/quiz` places the
user in one of the four families.

---

### A3 — Prescriber pilot terms (one-pager)

- **Offer:** free for the first 25 patients on the clinic panel
- **Asset:** co-branded `/rebound/[clinic-slug]` landing page
- **Channel:** cold DM on X/LinkedIn to ~50 published GLP-1 prescribers
- **Source list:** ASMBS · Obesity Medicine Association · Endocrine Society GLP-1 SIG
- **HIPAA:** BAA executed before pilot starts
- **Post-pilot pricing:** $12–$18 PMPM or $9/patient/mo consumer
- **Target:** 50 DMs Week 1 · 10+ replies · 3+ pilots started by end of Week 2

Full operating doc: `docs/outreach/glp1-prescriber-cold-outreach.md`.

---

### A4 — What we will NOT do

- **No medical claims.** COYL is behavioral support, not medical
  treatment or diagnosis. The site, the deck, and every channel stay
  inside that framing.
- **No fabricated testimonials.** Zero customer quotes appear anywhere
  in COYL marketing until real ones exist with permission.
- **No fake advisors.** The /advisors page returns when a credible name
  is published, not before.
- **No data brokerage.** User behavioral data is never sold. Export +
  deletion shipped on day one.
- **No dark patterns on cancel.** Recovery engine framing throughout —
  shame is the competitor being displaced.

---

### A5 — Risk register (short form)

See the full register in [seed-raise-proposal.md](./seed-raise-proposal.md) §6.

| # | Risk | First-order mitigation |
|---|---|---|
| 1 | Solo founder ceiling | Technical cofounder is the first seed hire |
| 2 | Clinical PI not yet named | Partner clinic chooses jointly with COYL |
| 3 | Prescriber wedge zero-reply | Pivot to Found / Ro / Calibrate warm-intro path |
| 4 | Viva conversation stalls | Partner program is one of three OEM lanes |
| 5 | App Store rejection on health framing | Behavioral-support copy reviewed; export/delete shipped |
| 6 | Consumer conversion underperforms | Single-tier impulse pricing is the test; re-price at Month 3 if it misses |

---

*Seed deck — May 2026. Confidential. Iman Schrock · iman@coyl.ai*
*The honest version. Read alongside [seed-raise-proposal.md](./seed-raise-proposal.md).*
