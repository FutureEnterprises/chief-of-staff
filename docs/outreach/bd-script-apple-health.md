# BD Script — Apple Health (informal first conversation)

> Target: Apple Health partnerships team. Best path is a warm intro
> from a Watch-side product manager. If cold: bd@apple.com is a dead
> end; better route is via the Apple Watch HealthKit developer
> community or a HLTH Conference connection.
>
> Tone: not selling. Not pitching. Establishing context. Per the $6B
> memo Section 05: "The framing is identical in every room."

---

## The voicemail / first email

### Subject
Quick context — COYL & the Watch behavioral layer

### Body

Hi [name],

I'm Iman, founder of COYL. We just published the v0.1 spec of the
Behavioral Interrupt Protocol (Apache 2.0, coyl.ai/protocol) — the
context layer between AI systems and a person's behavioral state.
Real-time. Persistent. Fires before the behavior runs.

We're not looking to sell. We're building. But we're having
conversations with a few strategic partners and wanted to make sure
Apple Health had context on what we're doing — specifically how COYL
+ Watch sensor data closes the loop on the "Watch detects stress;
nothing happens" failure mode.

The framing: Apple Watch is the highest-quality consumer biometric
device in the world. HealthKit holds the data. COYL is the layer that
turns "Watch detected elevated HRV at 9:42 PM" into "Watch fired a
behavioral interrupt at 9:42:03 PM, user pulled through, danger
window confidence updated."

No pitch deck. No ask. Just wanted you to know the work exists. If
the right person inside Apple Health would benefit from a 30-minute
walkthrough — happy to do it any time.

— Iman Schrock · iman@coyl.ai · coyl.ai/protocol

---

## The follow-up (after they respond positively)

### What to say in the 30-minute call

**Open (2 min):**
"Thanks for taking the call. I want to be direct about what this is
and isn't. We're not running an M&A process. We're building. But I
want Apple to have full context on what we're doing — because what
we're doing is the layer the Watch has been missing, and I'd rather
you know before someone else does."

**The product (10 min):**
- COYL is a behavioral interrupt layer. Real-time. Predictive. Fires
  at the moment behavior is about to run.
- The protocol (BIP v0.1) is open-source. Anyone can implement it.
  COYL is the reference engine.
- Today: 50K consumer users, six named archetypes, browser extension
  + iOS + Android, Apple Watch complication in beta.
- Where Watch comes in: HRV spike + accelerometer + sleep =
  perfect signal source for the Trigger API. The Watch sends the
  signal. COYL decides what to do with it.

**The category claim (5 min):**
"MCP made LLMs context-aware of software systems. COYL Protocol makes
LLMs and devices context-aware of human behavioral state. Apple's
problem is not the sensor data — Watch already has it. Apple's
problem is the missing intervention layer. We built it. We open-
sourced the spec. We want the Watch to be the highest-fidelity
signal source on the protocol."

**The ask (3 min):**
"Three things:
1. Technical: who's the right HealthKit partner-engineering contact
   for early protocol integration?
2. Strategic: if Apple Health saw the protocol map onto the Watch +
   HealthKit roadmap, what would the right next step look like?
3. Honest: if this is interesting and Apple does this work
   internally instead, I'd rather hear that early than chase shadows."

**The close (5 min):**
"We're talking with two other strategic partners at the same depth.
I'm not telling you who and I'm not asking for exclusivity. I want
you to know because the protocol category will have one winner. I'd
rather you be aware of it now than read about it later."

**Never say:**
- "We want to be acquired"
- "Make us an offer"
- "We have term sheets"
- "Microsoft is going to buy us if you don't"
- Anything that sounds like coercion or scarcity-by-deceit. Apple
  reads those signals and turns cold immediately.

**The post-call email (within 24h):**

Subject: Thanks — and the one thing I should have said

Hi [name],

Quick follow-up: I forgot to mention the Watch sensor-to-interrupt
demo we've got working. It's a 90-second walkthrough — HRV spike at
9:47 PM → COYL fires a Watch-haptic interrupt with a custom script
based on the user's archetype → user resolves "pulled through" →
HealthKit logs the behavioral intervention alongside step counts and
sleep.

Happy to send the video if useful. Or — if there's a partner-eng
person who'd want to walk through it on a call — I can do that
anytime in the next two weeks.

— Iman
