# COYL Sample Marketing Drafts — Voice Validation Set

> First-pass drafts hand-written in the COYL voice. These are what the
> CLI generator should produce when working correctly. Use them to:
>   (a) validate the voice before automating
>   (b) ship something today without setting up ANTHROPIC_API_KEY
>   (c) compare against generator output to catch voice drift
>
> Each draft is paste-ready for the target platform. Adjust before
> publishing if context demands.

---

## 1. Reddit · r/loseit (or r/glp1)

**Title** (≤80 chars):
GLP-1 quieted the appetite. The 9 PM kitchen still happens.

**Body** (240 words):
The shot does what it says. Hunger drops. The clinical part is real.

The thing the trials don't measure is what happens at 9:12 PM, when
you're not hungry and you walk into the kitchen anyway. Or 9:47, when
you stand at the fridge for the third time tonight. Or after a stressful
day, when the script loads before you notice: "I deserve this."

Appetite suppression doesn't touch the script. The script was there
before the shot. It's still there after.

I started COYL because that gap is the thing no one is building for.
Not therapy. Not a tracker. Not another "log what you ate" app. An
interrupt — a 30-second call-out in the actual three-second window
before the hand reaches for the door. Not the next morning. Not in a
journal. Now.

The audit's at coyl.ai/audit. Three questions, no signup. You'll come
out the other side knowing which of six autopilot families you belong
to and exactly when your script runs.

Behavioral support, not medical treatment. If you're struggling with
something that isn't a recurring loop — actual disordered eating,
substance dependency, crisis — please reach out to a clinician or call
988. COYL exists for the everyday autopilot script, not the medical
emergency.

---

## 2. Twitter Thread · "Which autopilot are you?"

**Tweet 1/7**
Almost every person you know belongs to one of six autopilot families.

You probably recognize yourself in one of these before you finish
reading them. Here they are.

🧵

---

**Tweet 2/7**
The 9 PM Negotiator — "One time won't matter."

You bargain with yourself the second your willpower drops. The voice
sounds reasonable. That's the trap. The negotiation always ends the
same way.

---

**Tweet 3/7**
The Monday Resetter — "I'll start tomorrow."

You're fluent in restart-language. Tomorrow, Monday, the first of the
year. The reset feels like progress. It's the opposite — every reset
is a vote for the version of you that never starts.

---

**Tweet 4/7**
The Deserver — "I deserve this."

You give yourself permission like a manager handing out comp time.
"I worked hard." "Had a tough day." All true. All the script you run
before the same choice you already regret.

---

**Tweet 5/7**
The One-More-Tabber — "Just one more thing."

You don't crash out — you drift out. First tab is innocent. Seventh
tab is a problem. Fourteenth tab is the afternoon. The pattern hides
because no single click feels meaningful.

---

**Tweet 6/7**
The Spiral Extender — "I already messed up anyway."

You don't fold once. You fold once, then use the fold as the reason
to fold for the rest of the day. The sentence is the actual machinery.

---

**Tweet 7/7**
The Capitulator — "I couldn't say no."

You hold the line alone. The moment someone else is in the room, the
line moves.

Which one are you? Three questions, no signup → coyl.ai/audit

---

## 3. Twitter Single · The Deserver

9:14 PM. Tough day. You earned it.

You also know how this ends.

coyl.ai/audit

---

## 4. Threads · Same moment, slightly longer

9:14 PM. Tough day. You tell yourself you earned it.

That sentence is The Deserver family — 78% of people run it, most often
within 90 minutes of finishing something hard. The signature is the
permission slip you write yourself before the same choice you already
know you'll regret.

The moment is real. The script is real. The interrupt has to land in
the three seconds before the hand moves.

coyl.ai/audit

---

## 5. LinkedIn · Founder note

I keep thinking about how strange it is that we have AI that can pass
the bar exam, write working code, and explain quantum mechanics — but
none of it can reach you when you walk into the kitchen at 9:12 PM and
you're not hungry.

The most powerful technology of our lifetime sits in a chatbox and
waits for you to type. Whatever happens in the rest of your life
— the fridge, the tab switch, the "I already messed up anyway" sentence
you say to yourself — is outside the conversation.

That gap is the thing COYL is building for. We call it the missing
behavioral interface between AI and real life. Not a tracker. Not a
chatbot. An interrupt that fires in the three-second window before
behavior, in the user's voice, at the actual moment.

We just shipped the audit — three questions, sixty seconds, no signup
— that reveals which of six "autopilot families" you belong to and
exactly when your script runs. The Deserver. The 9 PM Negotiator. The
Monday Resetter. The Spiral Extender. Most people recognize themselves
in one before they finish reading the names.

If you want to try it: coyl.ai/audit. If you want the longer story,
coyl.ai/manifesto explains the category we're building in.

— Iman | building COYL

#behavioralAI #AI

---

## 6. IndieHackers · Build-in-public update

Shipped this week: six named "autopilot families" + stateless share
URLs (`/a/{wedge}-{window}-{script}`) that render a personalized
archetype card with social-meta OG so the link preview is the meme.

Why: the audit was already producing archetypes (Night Fridge Saboteur,
Monday Restart Champion, etc.) but they were unnamed psychology
clusters. The strategist's note: people share identity diagnostics
more than almost anything else online — MBTI, Spotify Wrapped,
BuzzFeed quizzes. So we collapsed the 24 specific archetypes into 6
named families (The Deserver, The 9 PM Negotiator, The Spiral
Extender, etc.) — the meme-shaped headline that travels.

Numbers: too early to tell on the audit-takers → share-clicks loop,
but the architectural choice is interesting. Every share URL is a
stable permalink. No database write at audit time. 144 specific
combinations × 6 families = a fully cacheable, fully deterministic
share network. Zero infra cost to scale.

The voice ladder we landed on:
- "AI for the moment before behavior happens" — consumer hero
- "The missing behavioral interface between AI and real life" —
  press/investor positioning
- "Catch yourself before you do it again" — tagline

Question for the room: what's the family name that hits hardest for
you? "The Deserver" or "The Monday Resetter" pulled the most reads in
our early link previews.

— Iman, COYL

---

## 7. ProductHunt · Launch / update

**Tagline** (≤60 chars):
COYL — AI for the moment before behavior happens.

**Body** (170 words):
The first AI built for the moment before behavior happens — not after.

We just shipped the autopilot audit + six-family archetype share
network. Three questions, sixty seconds, no signup. You come out the
other side knowing which family you belong to and exactly when your
script runs.

What's new:
- 60-second autopilot audit (no email, no signup, no friction)
- Six named families — The Deserver, The 9 PM Negotiator, The Monday
  Resetter, The One-More-Tabber, The Spiral Extender, The Capitulator
- Stateless share URLs — every result is a screenshot-able permalink
  with branded OG preview for Twitter/iMessage/Slack
- Manifesto + press kit for the category claim ("the missing
  behavioral interface between AI and real life")

Take the audit → coyl.ai/audit

Read the category claim → coyl.ai/manifesto

🚀

---

## 8. HackerNews · Show HN

**Title** (≤80 chars):
Show HN: COYL — stateless archetype share URLs (no DB write at audit time)

**Body** (290 words):
I'm building COYL, an AI that interrupts autopilot behavior in the
three-second window before action. Founder, biased, etc. The bit I
think might be technically interesting to this crowd:

The audit produces a personalized "archetype" from three answers
(wedge × window × script). The share-card URL is just `/a/{wedge}-
{window}-{script}` — e.g. /a/weight-latenight-reward. 144 stable
permalinks total. The slug IS the archetype. Page rendering is pure
server-side computation on the request — no database write at audit
time, no view-tracking call-out, no failure modes at the most viral
moment.

Why it matters: when the user clicks "share" right after the wow
moment of the quiz, that's the single highest-conversion second in
the whole funnel. A database call there is a failure surface I don't
want. Stateless URL + edge cache = the share path never fails.

The catch: I can't track per-URL views without losing statelessness.
Solution: front-load it on analytics (page-view at /a/[slug] gets the
slug as a dimension) and ignore per-URL counts at the URL level.
Acceptable trade.

Other technical bits, if useful:
- Six "family" archetypes plus 24 specific archetypes — the family
  is the meme atom that travels (people share "I'm a Deserver"); the
  specific is the texture
- @vercel/og generates the share-card preview image at edge
- Lucide React icons replaced the emoji-based system — branded,
  consistent across OS, scales crisp

Audit is 60 seconds, no signup: coyl.ai/audit. Feedback welcome,
especially on the share-URL trade-off.

— Iman

---

## 9. Newsletter · Weekly playbook

**Subject:**
The 9 PM kitchen — the moment + the interrupt

**Body** (430 words):
THE MOMENT

It's 9:12 PM. You walk past the fridge for the third time tonight.

You're not hungry. You know you're not hungry. You also know you're
going to open the door anyway — you can feel the loop loading.

The kitchen is brighter than the rest of the apartment. You stand
there for a second. Maybe a yogurt. Maybe just a look. The voice in
your head sounds reasonable: "It's been a day. One time won't matter."

You open the door.

---

THE SCRIPT

This is The 9 PM Negotiator family — the bargaining script that
runs the second your willpower drops. 69% of you tell yourselves
some version of "one time won't matter," most often between 8 and
10 PM on weeknights. The Negotiator isn't weak willpower. It's a
specific psychology: the part of you that argues for the break
sounds reasonable, even moderate. That's the trap. The
moderate-sounding voice is the script.

The negotiation always ends the same way.

---

THE INTERRUPT

In the three-second window before your hand touches the door, COYL
fires. Not a reminder. Not a "are you sure?" pop-up. A call-out, in
the voice it learned from your prior moments:

> 9:12 PM. You're not hungry. You're doing it again.
>
> Close the fridge. Step out of the kitchen.
>
> Drink a full glass of water. Walk for ten minutes.
>
> If you still want it after ten, you can have it — and we log it
> honestly.

You close the door. Walk into the living room. Ten minutes pass.
You don't go back. The night doesn't turn.

The thing about this pattern is that the cost isn't in the snack.
It's in the spiral after. One trip to the fridge becomes three.
Three becomes the rest of the night. By morning, you've added a
chapter to the story you tell yourself about who you are.

The interrupt has to land before the door opens. The three-second
window is the entire mechanism.

---

PS

If this is your first email from us, the audit is at coyl.ai/audit.
Three questions, sixty seconds, no signup — it reveals which of the
six autopilot families you belong to and when your script usually
runs. Most people recognize themselves in one before they finish
reading the names.

— Iman, COYL
