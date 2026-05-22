# Proactive AI Protocol (PAP) — v0.1 draft

> The bigger idea behind COYL. Not the consumer app. Not the pharma
> adjunct. The infrastructure layer that lets ANY large language model
> become proactive in a human user's life — without violating trust,
> rate limits, or the user's actual psyche state at the moment of
> firing.
>
> Status: v0.1 draft for founder + advisor review. Spec is Apache 2.0
> open from publication. Reference engine is COYL Cloud — the
> proprietary implementation that powers consumer + LLM partners.
>
> Author: founder. Date: May 2026.

---

## The insight that creates the category

**The bottleneck for proactive AI is not capability. It's trust.**

Anthropic could ship Claude that says "you've been on Reddit for 90
minutes; here's a different thing to do" — today. OpenAI could.
Gemini could. None of them do it because:

1. Users haven't granted that authority
2. There's no shared trust infrastructure
3. The risk of a single bad firing is unbounded — legal, reputational,
   churn
4. No standardized rate-limiting + consent model
5. No standardized outcome feedback (does the intervention work?)
6. No shared substrate of behavioral context to fire against

Solve those six problems and proactive AI ships. Don't solve them
and proactive AI stays in the chatbot box forever.

PAP is the infrastructure that solves those six problems.

PAP is the equivalent of:
- **OAuth** — consent infrastructure for data access → for behavioral intervention authority
- **Stripe** — rate-limit + risk-management substrate for transactions → for intervention firing
- **HTTPS** — trusted transport layer for the web → for proactive AI deliveries

PAP becomes inevitable because foundation labs **can't** ship
proactive AI without trust infrastructure, and **building** trust
infrastructure isn't core to their roadmap. They want to use PAP not
because they lack capability, but because they lack speed-to-market
on trust.

That's the wedge.

---

## What PAP is

**A protocol with seven primitives.** Each primitive is an HTTP-like
RPC with a stable schema. Spec is Apache 2.0. Reference engine
(COYL Cloud) is proprietary, but anyone can build their own
implementation.

### 1. Observation API — `GET /pap/v1/observation`

Returns the user's current Behavioral Context Object (BCO).

```json
{
  "userId": "u_xyz",
  "asOf": "2026-05-21T21:43:12Z",
  "archetype": "the-9pm-negotiator",
  "state": "high_arousal",
  "activeDangerWindow": {
    "label": "Late-night kitchen",
    "startedAt": "2026-05-21T21:00:00Z",
    "endsAt": "2026-05-21T23:00:00Z",
    "confidence": 0.87
  },
  "signalCluster": {
    "hrvDeltaPct": -22,
    "sedentaryMins": 105,
    "locationKind": "kitchen",
    "screenOnMins": 38,
    "weekdayStress": "high"
  },
  "activeCommitments": [
    { "rule": "no food after 9 PM", "kept": 14, "broken": 4 }
  ],
  "selfTrustScore": 73,
  "recentInterventions": [
    { "firedAt": "...", "mode": "high_arousal", "outcome": "caught_me", "source": "claude" }
  ],
  "quietHoursActive": false,
  "intervention60dRateLimit": { "remaining": 18, "resetAt": "..." }
}
```

The BCO is read-only. Any LLM with user-granted scope can call it.
Authentication via PAP OAuth 2.0 token (see §9).

This already exists today in COYL as part of BIP v0.1 — extending
it slightly for proactive use.

### 2. Proposal API — `POST /pap/v1/proposal`

LLM emits a proposed intervention. PAP coordinator decides whether
to allow it.

```json
{
  "proposalId": "p_abc",
  "llmId": "anthropic-claude-sonnet-3.7",
  "userId": "u_xyz",
  "scopeRequested": ["proactive_food"],
  "action": {
    "kind": "interrupt",
    "modality": "voice",
    "mode": "high_arousal",
    "headline": "Stop. Hand on the counter. 4 breaths.",
    "subhead": "9:47 PM. You said no food after 9. Decide at 9:55."
  },
  "context": {
    "trigger": "danger_window_active:late_night_kitchen",
    "confidence": 0.84,
    "reasoning": "HRV dropped 22pts in 90min + sedentary 105min + geofence:kitchen + active commitment:no_food_after_9"
  }
}
```

Response:

```json
{
  "decision": "allowed",
  "scheduledFor": "2026-05-21T21:47:30Z",
  "executionToken": "et_xyz"
}
```

OR:

```json
{
  "decision": "denied",
  "reason": "rate_limited",
  "retryAfter": "2026-05-21T23:00:00Z"
}
```

OR:

```json
{
  "decision": "queued",
  "reason": "deduplication_pending",
  "competingProposals": ["p_def", "p_ghi"],
  "decisionAt": "2026-05-21T21:47:35Z"
}
```

This is the gatekeeper. Even if 5 different LLMs all want to fire
in the same window, PAP coordinates — picks the highest-confidence,
deduplicates similar headlines, respects rate limits, respects
quiet hours, respects user consent scope.

### 3. Execution API — `POST /pap/v1/execute`

The LLM (or coordinator) actually fires. Uses the `executionToken`
from the proposal response.

```json
{
  "executionToken": "et_xyz"
}
```

PAP delivers via the user's preferred modality:
- iOS Live Activity / lock-screen push
- Apple Watch haptic + visual
- iOS voice (on-device TTS)
- Android push notification
- Browser extension full-screen overlay
- Email (low-priority fallback)
- Microsoft Teams channel message
- Slack DM
- In-app card

The LLM does NOT need to know which modality fired. PAP picks based
on user preference + active surface + recent firings.

### 4. Outcome API — `POST /pap/v1/outcome`

Triggered by PAP, not the LLM. The LLM subscribes to outcomes via §5.

When the user tags or PAP infers an outcome:

```json
{
  "executionToken": "et_xyz",
  "outcome": "caught_me",
  "outcomeSource": "user_tag",
  "outcomeAt": "2026-05-21T22:13:00Z",
  "outcomeMetadata": {
    "tagModality": "live_activity_button",
    "userSentiment": null
  }
}
```

Or the inferred case:

```json
{
  "executionToken": "et_xyz",
  "outcome": "ignored",
  "outcomeSource": "inferred",
  "outcomeAt": "...",
  "outcomeMetadata": {
    "inferenceMethod": "slip_within_30min",
    "slipId": "s_xyz"
  }
}
```

The outcome flows back to the proposing LLM via webhook (§5) so the
LLM can update its per-user proposal-quality model.

### 5. Subscription API — `POST /pap/v1/subscribe`

LLMs subscribe to user state transitions OR outcome events.

```json
{
  "llmId": "anthropic-claude-sonnet-3.7",
  "userId": "u_xyz",
  "subscriptionKind": "state_transition",
  "conditions": {
    "fromState": ["calm"],
    "toState": ["high_arousal", "low_arousal"],
    "minConfidence": 0.7
  },
  "webhookUrl": "https://api.anthropic.com/pap/webhooks/state-transition",
  "webhookSecret": "..."
}
```

PAP fires the webhook when conditions match. The LLM then has the
opportunity to call Proposal API (§2) if it wants to intervene.

This is how proactive AI works without polling. Webhook-driven.

### 6. Authorization model — granular consent scopes

User grants specific LLMs specific authorities via PAP OAuth 2.0
consent flow. Scope tokens look like:

```
proactive_food                 — food + eating interventions
proactive_focus                — work + attention interventions  
proactive_relational           — message-you-shouldn't-send moments
proactive_sleep                — late-night wind-down
proactive_purchase             — impulse buy prevention
proactive_recovery             — post-slip support
proactive_substance            — alcohol / nicotine / etc. (sensitive — extra confirmation)
proactive_mood                 — mood-state interventions (sensitive — clinical caveat)
read_observation               — read BCO only, no firing authority
read_outcome_aggregate         — read aggregate outcome stats, not per-firing
```

Each scope is granular, revocable, logged in the audit trail.

The user always sees:
- Which LLMs have which scopes
- Last 30 interventions per LLM with outcome
- Per-LLM revoke button
- Universal pause-all-proactive-AI button (panic switch)

Granting works like OAuth 2.0 — user-initiated, redirect-based,
explicit-confirmation, revocable anytime.

### 7. Audit + transparency

Every proposal + outcome + scope grant is logged in the user's PAP
audit log. The audit log is exportable as JSON anytime by the user.
The user can also see which LLMs are competing for their attention
in real time (a "PAP queue" view).

Foundation labs can NOT delete audit entries. Even if a user revokes
Claude's scope, the historical Claude-proposed interventions remain
in the log (anonymized to "claude-sonnet-3.7" — not associated with
a specific Anthropic API key).

The audit + transparency model is what makes user trust possible.
Without it, no one grants any LLM proactive authority.

---

## How PAP relates to existing protocols

| Protocol | Owner | Scope | PAP relationship |
|---|---|---|---|
| **MCP** (Model Context Protocol) | Anthropic | LLM → tools/data | PAP complements; MCP handles "Claude reads my calendar", PAP handles "Claude proposes I should reschedule" |
| **OAuth 2.0** | IETF | User → app data access | PAP uses OAuth 2.0 as transport for scope grants |
| **BIP** (Behavioral Interrupt Protocol) | COYL | Behavioral context primitives | PAP supersedes; BIP is the consumer-app-side protocol, PAP is the LLM-integration protocol |
| **OpenAI Plugins/Tools** | OpenAI | LLM → external service calls | PAP complements; Tools enable Claude/GPT to act on user data, PAP enables them to act on user state |
| **A2A** (Agent-to-Agent) | Google | Inter-agent communication | PAP complements; A2A is agents-talking-to-agents, PAP is agents-talking-about-users |

The key positioning: **PAP is to behavioral state what MCP is to
tool calls.** Both are open-source protocols. Both have a reference
implementation owner (Anthropic for MCP, COYL for PAP). Both enable
a category that didn't exist before.

---

## The Behavioral Context Object — extended for PAP

BIP v0.1's BCO had the basics. PAP v0.1 extends it for proactive
use. New fields:

```json
{
  "// existing BIP fields": "...",
  "state": "high_arousal | low_arousal | post_slip | calm",
  "stateConfidence": 0.84,
  "intervention60dRateLimit": {
    "interventionsAllowed": 25,
    "interventionsUsed": 7,
    "remaining": 18,
    "resetAt": "2026-06-20T00:00:00Z"
  },
  "quietHours": [
    { "dayOfWeek": -1, "startHour": 23, "endHour": 7 }
  ],
  "modalityPreference": ["voice", "haptic", "push"],
  "recentInterventions": [...],
  "competingProposals": [...],
  "consentedScopes": [
    {
      "scope": "proactive_food",
      "grantedAt": "...",
      "grantedTo": "anthropic-claude-sonnet-3.7",
      "expiresAt": null
    }
  ]
}
```

This is the substrate every PAP-integrated LLM reads from.

---

## The Coordinator — the COYL engine

The PAP Coordinator is the proprietary part. It's the brain that
evaluates each proposal, deduplicates competing LLM proposals,
picks the highest-confidence intervention, schedules execution,
fires through the right modality, and routes the outcome back to
the proposing LLM.

Inside the Coordinator:

1. **State classifier** — multi-modal model that ingests SignalCluster
   data → produces state classification with confidence interval.
2. **Rate limit engine** — per-user, per-LLM, per-modality rate limits.
3. **Deduplication engine** — semantic similarity over competing
   proposal headlines + same-window detection.
4. **Quiet hours enforcer** — respects user-set quiet windows + system
   defaults (e.g., sleep hours).
5. **Confidence threshold gate** — only allow proposals with confidence
   above user-set threshold (default 0.7).
6. **Outcome tracker** — pairs every fired intervention with its
   outcome, persists for training.
7. **Audit logger** — every proposal + decision + outcome.

The Coordinator is what makes PAP work. The protocol is Apache 2.0;
the Coordinator engine is proprietary. Anyone can implement their
own Coordinator, but the COYL Cloud Coordinator is the reference
implementation that ships with all the trained state-classifier
weights + the live cohort data flywheel.

That's where the moat lives.

---

## Pricing model — usage-based + strategic seats

| Tier | Cost | What's included |
|---|---|---|
| **Free** | $0 | 1,000 interventions/month per LLM partner per user |
| **Usage** | $0.001 per intervention | Pay-as-you-go after free tier; no minimums |
| **Enterprise** | Custom | Bulk discounts; SLA; dedicated tenancy; per-region data residency |
| **Strategic** | Reserved | Pharma + Microsoft + Apple + Anthropic + OpenAI + Gemini get preferred rates + reserved capacity + co-design influence |

The free tier drives adoption. The usage tier is where revenue
compounds. The strategic seats lock in the platform partners.

### Revenue projection (5 years out)

Assume:
- 100M active LLM users globally by 2031
- Each averages 30 PAP interventions/month
- 80% of those are free-tier (first 1K/month free)
- 20% are usage-tier ($0.001 each)

20% × 100M × 30 interventions × 12 months = 7.2B chargeable interventions/year
× $0.001 = **$7.2M/year revenue from interventions alone**

Hmm. That's lower than I want. Let me re-think the pricing.

Alternative pricing — VALUE-BASED, not transaction-based:
- $0.05 per outcome-graded intervention (LLM only pays if user marks "caught_me" or interrupt outcome was positive)
- This aligns LLM partner incentives with user benefit
- 100M users × 30 interventions/month × 50% caught-me rate × $0.05 = $1.8B/year revenue

That's the moonshot revenue.

Plus the existing COYL consumer + B2B + pharma channels. Plus
strategic-partner license fees. The platform layer becomes a
multi-billion-dollar business in its own right.

---

## Competitive landscape

The honest assessment.

### Who could build this themselves?

| Company | Capability | Likelihood of building own | Counter-strategy |
|---|---|---|---|
| **Anthropic** | Very high (MCP + Skills + Memory architecture) | Medium — they prefer open protocols, may adopt PAP if we publish well | Get them in early; offer co-design seat |
| **OpenAI** | Very high (Operator + Agents + Memory + GPTs) | High — they tend to centralize | Compete on speed; consumer distribution matters |
| **Google** | High (Gemini + Workspace + Calendar surfaces) | Medium — usually integrate vs build from scratch | Workspace integration is the obvious wedge |
| **Apple** | High (HealthKit + Live Activity + Watch) | High — they own the device | Position as their LLM-integration layer; they don't have one yet |
| **Microsoft** | High (Copilot + Teams + Viva) | Medium — usually buy or partner | Microsoft Viva integration → Microsoft acquires COYL |
| **Meta** | Medium (WhatsApp + Reality Labs) | Low — focused on social + AR | Less of a threat |

The differential is: **we have working code with real users + we
ship the spec first + we have consumer distribution.**

If we publish PAP v0.1 next week and get Anthropic to RFC-comment,
the strategic positioning locks in.

If OpenAI ships their own behavioral layer first, we're competing
on capability + distribution. Harder fight.

The race is to publish + get the first foundation lab partnership
within 90 days.

---

## The 90-day execution plan

### Days 1-14: Spec freeze + partner outreach

- Lock PAP v0.1 spec (this doc, refined)
- Submit RFC to Anthropic, OpenAI, Google, Apple for comment
- Publish at /protocol (current /protocol becomes BIP v0.1; /pap becomes the new home)
- Open-source the protocol spec at github.com/coyl/pap
- Brief 3 senior foundation-lab contacts about the protocol

### Days 15-45: Reference engine + first partner

- Implement PAP Coordinator endpoints in COYL Cloud (we already
  have most: BIP /context + /interrupt + /webhook. Add /proposal +
  /subscribe + audit + rate-limit engine)
- Sign first foundation-lab partnership LOI (probably Anthropic —
  they're the most protocol-friendly)
- Build the user-facing PAP consent UI in COYL iOS + web
- Ship PAP audit log + revoke surface in COYL settings

### Days 46-75: Public launch

- Co-marketing announcement with first partner ("Claude proactive
  interventions via PAP — built on COYL Cloud")
- Launch the open-source GitHub repo with reference Coordinator
- Pricing page: free tier + usage tier + strategic seats
- TechCrunch + Verge feature on the protocol category

### Days 76-90: Second partner + scale

- Sign second foundation-lab partnership (OpenAI OR Google)
- First million PAP interventions fired
- First aggregate outcome report published ("Across all PAP partners:
  68% of interventions land at the right moment for the user")
- First strategic-acquirer conversation around PAP-driven valuation

---

## What changes about the acquisition story

The original $6B Roadmap doc framed COYL as a pharma-adjacency
acquisition (Novo or Lilly). The Behavioral Interface for AI memo
framed COYL as a tech-platform acquisition (Apple, Microsoft, Meta).

PAP changes the math.

Old acquirer set:
- Pharma: Novo Nordisk, Eli Lilly (45% probability of $4-6B)
- Tech-platform: Apple, Microsoft, Meta (15-25% probability of $4-8B)

New acquirer set with PAP:
- **Foundation lab acquisition** — Anthropic, OpenAI, Google buy
  COYL outright to OWN the proactive AI protocol category
  (10-15% probability of $5-10B if PAP gets traction; protocol
  ownership at the foundation-model layer is worth more than
  applications)
- Pharma: still 45% probability of $4-6B (PAP doesn't hurt pharma
  story; PAP supports it)
- Tech-platform: now 25-35% probability of $4-8B (because PAP makes
  COYL the obvious "behavioral OS" for Apple Watch / Microsoft Viva
  / Meta AR)

Probability-weighted expected valuation moves from $2.5-3B to
$3.5-4.5B.

The moonshot ($8-10B) probability moves from 5% to 15-20%.

---

## What this means for COYL today

We have ~90% of PAP already built. The remaining 10% is:

1. **Proposal endpoint** with rate-limit + dedup engine (new code, ~2 weeks)
2. **Subscription/webhook engine** (new code, ~1 week)
3. **PAP consent UI** for users to grant per-LLM scopes (web + iOS, ~2 weeks)
4. **PAP audit log surface** (web + iOS, ~1 week)
5. **Reference Coordinator implementation on GitHub** (open source, ~1 week to clean up)
6. **PAP v0.1 spec document** (mostly this doc, plus formal JSON schema, ~3 days)

Total engineering effort: **~5-6 weeks of one ML engineer + one
backend engineer + one product designer**, post-Series-A hire.

This fits comfortably inside the Foundation phase (Months 1-2) of
the $6B Roadmap.

---

## The strategic move

The original strategy was: ship BIP at /protocol → developers
discover it → builds developer momentum.

The new strategy is: ship PAP at /pap → foundation labs adopt it as
the trust infrastructure for proactive AI → COYL becomes the layer
between LLMs and human behavior.

BIP stays. /protocol stays. BIP is the consumer-app-side protocol —
COYL Cloud users (consumer mobile, web, browser extension) all
emit + consume BIP messages.

PAP is the NEW protocol for LLM partners. It's a superset that
includes BIP plus the proactive-firing infrastructure.

Position:
- **BIP** — "the open protocol for behavioral interrupts" (consumer
  developer audience)
- **PAP** — "the open protocol for proactive AI" (foundation lab +
  enterprise audience)

Both Apache 2.0. Both reference-implemented by COYL Cloud. Both
spec-led.

---

## The acquirer-tier insight

If Anthropic acquires COYL: they get the PAP reference engine + the
consumer distribution + the user-data flywheel. Worth $6-10B.

If OpenAI acquires COYL: same, but they likely re-write the protocol
to be OpenAI-flavored (less open) and we lose the open-protocol
positioning. Still worth $4-8B.

If Google acquires COYL: they integrate into Workspace + Pixel. Worth
$3-6B because they bundle vs. let the protocol stand alone.

If pharma (Novo or Lilly) acquires COYL: they buy the consumer app +
the clinical evidence + the pharma adjacency. They don't extract the
PAP value because they're not foundation labs. Worth $4-6B but
they leave $5-10B on the table.

This is why founder + board need to decide BEFORE the acquisition
conversations begin: are we selling COYL Consumer (pharma + tech-
platform path) or COYL Platform (foundation-lab path)?

The answer for maximum EV: build to the platform path, accept
pharma offers as the floor. The foundation-lab acquirer pays the
most because they get the most.

---

## Open questions for the founder + board

1. **PAP v0.1 publication timing.** Next week? Or wait until the
   reference Coordinator implementation is more complete?
2. **GitHub org for PAP.** github.com/coyl/pap? Or a separate org
   like github.com/behavioral-protocol/pap to signal openness?
3. **First foundation-lab outreach.** Anthropic first (most likely
   to adopt), or OpenAI first (largest scale)?
4. **Pricing call.** Transaction-based ($0.001/intervention) or
   outcome-based ($0.05/positive-outcome)? Outcome-based aligns
   incentives but is harder to bill against.
5. **Consent scope granularity.** 9 scopes as drafted, or fewer
   (3-4)? More scopes = better UX but harder to maintain.
6. **Strategic-seat pricing.** What does Anthropic / Apple / Microsoft
   pay for a reserved seat with co-design influence?
7. **Open-source license.** Apache 2.0 (same as BIP) keeps it
   permissive. Or MIT for maximum adoption? Apache 2.0 has the
   patent-grant clause, which protects us.
8. **Coordinator implementation rights.** Anyone can build their own
   Coordinator, but does the reference implementation stay COYL-only?
   Yes — that's the moat. The protocol is open; the engine is not.

---

## Why we ship this NOW

Every quarter PAP isn't published is a quarter:
- Foundation labs are evaluating "build vs adopt" — and the longer
  we wait, the more they choose "build"
- Consumer trust in proactive AI is being formed — without trust
  infrastructure, the early proactive products will fail and poison
  the well
- COYL's consumer + clinical + pharma channels are real but capped
  in their valuation ceiling without the platform-layer story

This isn't a "build it when we have bandwidth" item. This is the
single highest-leverage strategic move COYL can make in the next 6
months.

---

## What to do this week

1. Founder reads this doc + comments
2. Board call: present PAP v0.1 strategy
3. If approved: schedule the 90-day execution plan
4. Spec freeze meeting (engineers + founder, 4 hours)
5. First Anthropic outreach (warm intro path — we know who)

If approved this week, PAP v0.1 ships next month. First foundation-
lab partnership signed by month 3. First million interventions
through PAP by month 5. First strategic acquisition conversation
opens by month 6.

---

*Proactive AI Protocol v0.1 — May 2026. Author: founder. This
document supersedes the Behavioral Interrupt Protocol RFC as the
canonical specification for LLM-integrated proactive intervention
infrastructure. Apache 2.0 once published. Reference engine:
COYL Cloud.*
