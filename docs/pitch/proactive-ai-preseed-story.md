# COYL — Pre-Seed Story Reframe

> Drafted June 2026 after shipping the internal proactive-agent wake loop.

## The One-Line Company

COYL is the consent layer that lets AI reach the user at the right moment.

## The Category

The first wave of LLM products waited in chat boxes.

The next wave will interact with the world: phone, watch, browser, inbox,
calendar, home, car, and the tiny behavioral window where a human either
keeps a promise or breaks it.

That world needs three things before it can happen safely:

- A behavioral context object: what moment is this?
- A user authority layer: is the model allowed to act?
- A proactive execution layer: how does the model reach the user without
  becoming spam?

COYL is the reference product and protocol stack for that layer.

## What Changed In The Product

COYL now has an internal Proactive Agent route:

- Cron wakes the system every five minutes.
- The service selects eligible moments such as a live danger window or
  silent re-entry.
- The LLM writes the intervention.
- COYL runs RAP, notification prefs, quiet hours, cooldowns, rate caps,
  idempotency, and confidence gating.
- Existing delivery rails send push, web push, email, and mobile action
  payloads.
- The event logs into the same interrupt ledger used by feedback, scoring,
  and future model improvement.

This is the demo sentence:

> "The LLM did not wait for the user. COYL woke it, constrained it, and
> let it act only when the user-authority layer said yes."

## Why This Is Fundable

Most AI products compete on model quality or workflow UI. COYL competes
on something more durable: permissioned timing.

The hard problem is not generating advice. The hard problem is knowing
when AI is allowed to interrupt a human life, what it is allowed to say,
which device it may touch, and when it must stay silent.

That is a protocol problem. A safety problem. A distribution problem.
And, because behavior change has enormous spend behind it, a venture-scale
company problem.

## The Pre-Seed Claim

The right pre-seed claim is not "we have $100M ARR in sight."

The right pre-seed claim is:

> "We shipped the first consumer proof that proactive AI can safely reach a
> user in a behavior-critical moment. The same engine becomes the protocol
> layer for GLP-1 maintenance, clinical coaching, enterprise well-being,
> and third-party LLM agents."

## Round Framing

The previous honest plan recommended $2.5M at a $15M post-money cap. That
is still the closeable default if the demo is pre-traction.

The new upside frame can support a more aggressive pre-seed if three
things are true before investor meetings:

1. The proactive-agent demo runs live or dry-run with real user-like rows.
2. The viral waitlist loop shows share-to-join attribution in the admin
   funnel.
3. The deck clearly separates shipped substrate from unproven revenue.

Recommended ask:

- Base case: $2.5M-$3.5M on $15M-$20M post-money.
- Stretch case: $4M-$5M on $20M-$30M post-money if there is visible
  waitlist velocity, a strong demo, and one credible angel/strategic already
  leaning in.
- Avoid: raising $8M+ pre-seed to "hire a big team" before retention and
  channel proof. It makes the next round harder unless the launch explodes.

## Team Plan

Do not hire a big team first. Hire a sharp team that creates proof.

First four hires or contractors:

1. Founding full-stack/mobile engineer: owns iOS, push, app store, reliability.
2. Growth operator: owns waitlist, creators, short-form testing, invite codes.
3. Clinical/behavioral advisor: gives the GLP-1/behavior-change wedge credibility.
4. Design engineer or product designer: makes the proactive-agent demo feel
   inevitable, not weird.

After proof:

- Second engineer for protocol/API surface.
- Partnerships lead for prescriber/employer/Viva.
- Data/ML engineer once the feedback loop has enough events to tune.

## Investor Talk Track

Open with the shift:

> "Chatbots wait. COYL wakes."

Then the problem:

> "People do not need another answer. They need AI that shows up in the
> three seconds before the pattern runs."

Then the defensibility:

> "The moat is not a prompt. It is the consented intervention ledger:
> context, authority, timing, execution, feedback."

Then the wedge:

> "We start with consumer behavior change because the moment is visceral and
> shareable. GLP-1 maintenance is the clinical wedge. Enterprise and OEM are
> where the protocol scales."

Then the ask:

> "We are raising to turn a shipped proactive-agent substrate into visible
> retention, viral waitlist growth, and the first clinical/channel pilots."

## The Line To Retire

Do not say:

> "We want to wake up LLMs."

Say:

> "We built the permission layer that lets AI act first."
