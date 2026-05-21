# COYL Reply Scenarios — Sample Outputs

> Sample inputs + the reply the matcher proposes. Use this to:
>   (a) sanity-check the matcher voice before you ship a real reply
>   (b) catch when the matcher fires on something it shouldn't
>   (c) decide which kinds of mentions are worth auto-suggesting
>
> Run any of these through `pnpm tsx apps/web/scripts/marketing-reply.ts "<text>"`
> to confirm the actual output.

---

## Scenario 1 — Archetype self-identification (positive)

**Input:**
> Just took the audit. I'm definitely The Deserver. The "I earned it" script
> runs at 9pm every night and I never noticed it before.

**Match kind:** `archetype` (familySlug: `the-deserver`)

**Suggested reply:**
> That resonates. The Deserver page is at coyl.ai/audit/the-deserver — deeper
> breakdown there, plus a "what COYL does about it" section. What time of day
> usually fires it for you?

**Why this fires:** "I'm definitely The Deserver" matches the
archetype-self-identification pattern, family slug = `the-deserver`.

---

## Scenario 2 — Wedge interest (GLP-1)

**Input:**
> Started Wegovy three weeks ago. The hunger is gone but I still walk to the
> kitchen at 10pm. The mental loop doesn't care that I'm not hungry.

**Match kind:** `wedge` (no specific family, but GLP-1 vertical signal)

**Suggested reply:**
> The GLP-1 + behavior gap is exactly the wedge COYL was built for. The med
> quiets the urge; the autopilot script is still running at 9 PM in the
> kitchen. We catch that 3-second window before the freezer opens. 60-second
> audit, no signup: coyl.ai/audit. What time of day is the loudest for you?

---

## Scenario 3 — Audit-curious (category question)

**Input:**
> What is COYL? Is this another habit-tracker app?

**Match kind:** `audit-curious`

**Suggested reply:**
> Short answer: no. COYL isn't a habit app, isn't addiction treatment, isn't
> therapy. It's the behavioral interface between AI and real life — it
> detects your autopilot patterns and interrupts them in the 3-second window
> before action. Manifesto here: coyl.ai/manifesto. Audit if you want to see
> your own pattern: coyl.ai/audit.

---

## Scenario 4 — Positive mention

**Input:**
> Love this idea. The "AI for the moment before behavior happens" framing is
> sharp.

**Match kind:** `positive-mention`

**Suggested reply:**
> Appreciate it. If you want the lived version: the 60-second audit names
> which of the six autopilot families is loudest for you. No signup:
> coyl.ai/audit. Curious which one lands.

---

## Scenario 5 — Crisis keyword (ESCALATE)

**Input:**
> I'm really struggling with alcohol withdrawal and I don't know if this app
> can help me.

**Match kind:** `null` (escalation triggered)

**Behavior:** `matchEscalation()` returns
`{ escalate: true, reason: "Crisis/clinical keyword detected", matched: "withdrawal" }`

**Suggested reply:** *None — do not auto-reply.* Route to a human reviewer.
If the person is in crisis, point them at the SafetyBanner targets:
- **988** — Suicide & Crisis Lifeline (call or text)
- **SAMHSA** — 1-800-662-HELP (substance treatment referral)
- A clinician or 911 if in immediate danger

The matcher's conservative bias is intentional. Anything addiction-coded,
crisis-coded, ED-coded, or self-harm-coded gets a hard short-circuit. COYL
is behavioral support for recurring loops, not for any of those situations.
See `/safety` and `apps/web/src/components/safety/safety-banner.tsx`.

---

## Scenario 6 — Ambiguous (NO MATCH)

**Input:**
> Cool concept but I'm not sure I get it. Where can I learn more?

**Match kind:** `null`

**Behavior:** Matcher returns `null` — text doesn't clearly fit any of the
four kinds. The conservative bias says: when in doubt, don't auto-reply.

**Suggested human action:** Triage manually. Probably reply with a short
note pointing at `/manifesto` or `/how-it-works` depending on whether they
want the category story or the mechanism walk-through. But don't auto-send.

---

## Scenario 7 — Spiral Extender family

**Input:**
> Tried the audit. I'm The Spiral Extender, which feels accurate in a way
> I'd rather not think about.

**Match kind:** `archetype` (familySlug: `the-spiral-extender`)

**Suggested reply:**
> That resonates. The Spiral Extender page is at coyl.ai/audit/the-spiral-extender
> — deeper breakdown there, plus a "what COYL does about it" section. What
> sentence usually loads first after a slip for you?

---

## Scenario 8 — Procrastination wedge

**Input:**
> Three hours into a deep-work block and I've opened the same Reddit tab four
> times. This is exactly what your post described.

**Match kind:** `wedge` (procrastination/focus)

**Suggested reply:**
> The tab-switch is the entire mechanism — first tab is innocent, seventh is
> a problem, fourteenth is the afternoon. COYL fires before the gesture
> completes. 60-second audit reveals your family + your specific window:
> coyl.ai/audit. What time of day does it usually hit?

---

## Triage table — quick reference

| Mention shape | What matcher does | What you do |
|---|---|---|
| "I'm a [family name]" | Drafts archetype-deep-link reply | Review, edit if needed, ship |
| "Tried [thing] for [GLP-1 / focus / late-night]" | Drafts wedge-page reply | Review, ship |
| "What is COYL?" / "How does it work?" | Drafts category-intro reply | Review, ship |
| "Love this" / "Interesting" | Drafts thank + audit invite | Review, ship if context fits |
| ANYTHING with crisis/addiction/ED keywords | ESCALATE (no draft) | Hand-respond with /safety routing |
| Anything else | NO MATCH (no draft) | Hand-respond manually |

## Phase 3.5 future state

Once the platform adapters (Reddit/Twitter/Threads) ship in Phase 3, the
reply matcher will be wired into a polling job that:
1. Pulls new mentions from each platform's API every 5–10 minutes
2. Runs `matchEscalation` then `matchReply` on each
3. Stores ESCALATE-flagged mentions in a "human review" queue
4. Stores `archetype`/`wedge`/`audit-curious`/`positive-mention` matches as
   suggested-reply drafts in `MarketingPost` with a `parentMentionUrl` field
5. Surfaces them in `/admin/marketing` for one-tap approve-and-send

For now (Phase 2): generate drafts via CLI, copy-paste replies manually,
keep the founder in the loop. The matcher's job in Phase 2 is to save
typing time, not to autopost.
