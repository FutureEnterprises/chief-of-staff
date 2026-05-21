# BD Script — Microsoft Viva (informal first conversation)

> Target: Microsoft Viva corp dev OR Viva Insights product leadership.
> Best paths: (1) the Viva partner program (60-90 day clock; see
> microsoft-viva-partner-application.md), (2) warm intro from an
> ex-Microsoft connection, (3) a Microsoft Ignite hallway conversation.
>
> Microsoft is the highest-probability close. The framing matters less
> than the timing. Get in the room first.

---

## First email (after partner program acceptance OR warm intro)

### Subject
Quick context — COYL × the Viva behavioral layer

### Body

Hi [name],

I'm Iman, founder of COYL. We just published the v0.1 spec of the
Behavioral Interrupt Protocol (Apache 2.0, coyl.ai/protocol) — and
the closest commercial analog to where Microsoft Viva has been trying
to land for four years.

Quick context, not a pitch:

- Viva measures focus, sentiment, meeting load. Reporting layer.
- COYL fires the interrupt at the moment the follow-up gets dropped,
  the deep-work block dies, the reactive Slack goes out.
- We ship as a Teams Bot + Edge browser extension + iOS/Android.
  Zero new install in Microsoft 365 environments.
- We just open-sourced the protocol so the broader industry can build
  against it. Microsoft is the natural anchor partner.

We're talking with a few strategic partners. I'd rather Microsoft have
context on what we're doing before someone else inside the company
asks where the behavioral interrupt layer is. If a 30-minute
walkthrough makes sense, I'll bring the Teams Bot prototype and the
3-second-window demo.

— Iman Schrock · iman@coyl.ai · coyl.ai/protocol

---

## In the room (30-minute call)

**Open (2 min):**
"Thanks for the time. I want to be direct: we're not running an M&A
process. We're building. But I want to make sure Viva has full
context on what we're doing — because it lands directly inside the
Viva surface."

**The Viva gap (5 min):**
"Viva Insights measures. Viva Topics organizes. Viva Goals tracks.
What none of them do is fire at the moment the user is about to drop
the follow-up. That moment is where behavior change actually happens —
the three-second window between intention and action. COYL is built
specifically for that window."

**The protocol (8 min):**
- Behavioral Interrupt Protocol v0.1 — coyl.ai/protocol
- Three primitives: Context (read user state), Trigger (signal-source
  push), Outcome (webhook back)
- Open Apache 2.0 spec; COYL Cloud is the reference engine
- Maps directly onto Viva's data plane: Microsoft Graph as signal
  source, Teams as delivery channel, Outlook follow-ups as commitments

**The integration (5 min):**
- Teams Bot Framework: zero-install COYL inside Teams
- Microsoft Graph API: calendar + commitment signals
- Edge browser extension: ambient infrastructure (already a Microsoft-
  owned distribution channel)
- SCIM via Azure AD, SOC 2 in progress, customer-tenant isolation

**The acquirer-relevant claim (5 min):**
"Microsoft has been trying to build the behavioral layer for four
years. The problem isn't engineering — it's the model. The behavioral
model takes 6+ months of per-user interrupt data across millions of
users. We have it. Microsoft can build the integration, the protocol,
the surfaces — what Microsoft cannot generate organically is the
behavioral model itself."

**The ask (3 min):**
"Three things:
1. Apply to the partner program (already in flight — see #4 below).
2. Joint 30-day pilot inside three enterprise Microsoft 365 customers.
   We fund. We co-instrument. You bring the customer relationships.
3. If there's a corp dev counterpart who should also be in the room —
   put them in the room. I'd rather have the full conversation than a
   product-only one."

**The close (2 min):**
"We're talking with two other strategic partners. I'm not telling you
who and I'm not asking for exclusivity. I want Microsoft to know
because behavioral interrupt protocols will have one winner. I want
it to be obvious to you."

**Never say:**
- Anything that sounds like "we're being acquired"
- Anything that pits Microsoft against Apple by name
- "We'd love a term sheet"
- "Make us an offer"

**The post-call follow-up:**

Subject: The 90-second demo I should have sent first

Hi [name],

Forgot to send: the Teams Bot prototype is live in a test tenant. If
you want to see what the interrupt looks like inside Teams — at the
moment a meeting commitment is about to lapse — I can demo it in 15
minutes any time this week.

Two specific contexts where I think Viva needs this most:

1. Reactive Slack — manager about to send the "where are we on X"
   ping. COYL fires before the ping. "You committed to this at the
   Tuesday standup. The deadline is 2 hours out. Send the follow-up
   instead."

2. Skipped deep-work block — the calendar event the user double-books
   over. COYL fires before the double-book. "You've cancelled this
   block six times. Cancelling again means it isn't real. Move it or
   commit to it."

Both demos use real signal from Microsoft Graph + the protocol's
Trigger API. Happy to walk through either.

— Iman

---

## After the first call

Within 7 days: introduce them to the Microsoft Viva partner program
application (already submitted; see microsoft-viva-partner-application.md).
This gives Microsoft a formal commercial path without needing to
position the conversation as M&A.

The Viva BD relationship becomes the channel for everything else: pilot
customer intros, technical integration meetings, eventually corp dev
visibility. The slow build is the point — Microsoft moves at
Microsoft speed.

Per the $6B memo: Microsoft is the highest-probability close (Viva
stalled four years, structural fit, Edge owns the browser, Teams owns
the surface). Don't pitch acquisition. Plant the seed. Let them come
to it.
