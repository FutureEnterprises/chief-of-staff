# COYL Marketing Automation — Phased Plan

> Last revised: 2026-05-20 — by Iman, with the May 2026 virality dispatch in hand.

## Goal

Move COYL from "we have a website" to "COYL is being talked about." Achieve
this without (a) sounding like a wellness app, (b) tripping moderator wires
on Reddit / IndieHackers / ProductHunt, or (c) appearing to autopost in a
way that violates platform rules.

The strategist's framing: virality is the real question. We need agents that
write + post + interact in the COYL voice while respecting platform norms.

## What we are NOT going to do

- **No drive-by autoposting.** Reddit + IndieHackers + ProductHunt all have
  norms against automation that drowns out the human surface. We will
  generate drafts and approve them manually, at least until the voice is
  validated.
- **No fake personas.** Every post is from the COYL account (or a named
  founder voice). No sockpuppets, no astroturfing.
- **No addiction-coded community targeting.** Strategist's explicit rule:
  do not post in r/stopdrinking or similar. Our blessed lanes are:
  late-night eating, GLP-1 rebound, doomscrolling, procrastination,
  follow-through.
- **No clinical claims.** SafetyBanner copy is locked. Any post that
  implies treatment / cure / diagnosis is rejected at generation time.

## Phase 1 — Voice Validation (THIS SHIP)

**Goal:** Generate 20-40 sample posts across 8 platforms. Read them. Adjust
the voice until they sound like COYL. No external posting yet.

### Deliverables

1. **Voice-locked templates** (`apps/web/src/lib/marketing/templates.ts`):
   8 post archetypes per platform with explicit prompt scaffolding —
   what the post should DO, what it should AVOID, what voice tics to use.

2. **CLI draft generator** (`apps/web/scripts/marketing-draft.ts`):
   `pnpm tsx scripts/marketing-draft.ts <platform> <archetype> [--topic ...]`
   Outputs a fully-formed draft to stdout. Uses the existing AI SDK
   (`@ai-sdk/anthropic`, claude-sonnet-4-6).

3. **This document** (`docs/marketing/automation-plan.md`): the full
   Phase 1 → 3 plan.

### Acceptance criteria

- 8 platform templates exist and produce non-cringe drafts.
- Drafts feel like the COYL voice from manifesto + audit + share cards.
- Founder can paste a draft into Reddit/Twitter/etc. and ship.

## Phase 2 — Approval Queue + Database (~next sprint)

**Goal:** Move from CLI to UI. Drafts get stored, reviewed, approved, marked
as posted.

### Schema additions

```prisma
model MarketingPost {
  id           String              @id @default(cuid())
  platform     MarketingPlatform
  archetype    String              // "the-deserver" | family slug | "category-launch" | etc.
  topic        String              // free-text seed
  draftBody    String              @db.Text
  finalBody    String?             @db.Text
  status       MarketingPostStatus @default(DRAFT)
  approvedBy   String?             // userId of the approver
  postedAt     DateTime?
  postedUrl    String?
  generatedAt  DateTime            @default(now())
  rejectionReason String?

  @@index([status, platform])
  @@index([archetype])
}

enum MarketingPlatform {
  REDDIT
  TWITTER
  THREADS
  LINKEDIN
  INDIEHACKERS
  PRODUCTHUNT
  HACKERNEWS
  EMAIL
}

enum MarketingPostStatus {
  DRAFT
  APPROVED
  REJECTED
  POSTED
  ERRORED
}
```

### Routes

- `/admin/marketing` — list drafts, filter by platform/status
- `/admin/marketing/new` — generate a new draft (form: platform, archetype, topic)
- `/admin/marketing/[id]` — edit, approve, mark-posted
- `/api/v1/marketing/draft` — POST → generate + store
- `/api/v1/marketing/[id]/approve` — POST → flip to APPROVED
- `/api/v1/marketing/[id]/mark-posted` — POST → flip to POSTED + record URL

All admin routes auth-gated to `iman.schrock@gmail.com` (single-admin model
for v1).

## Phase 3 — Platform Posting Adapters (~when Phase 2 voice is validated)

**Goal:** From APPROVED status, auto-post to the platform.

### Adapters needed

| Platform | Auth | Posting model | Notes |
|---|---|---|---|
| Reddit | OAuth (PRAW-style) | POST to subreddit | Honor rate limits (10/day per sub). Self-posts only for v1. |
| Twitter / X | OAuth 1.0a or v2 | POST tweet or thread | Thread support requires sequential POST + reply chain. |
| Threads | Meta Graph API | POST | New API; rate limits TBD. |
| LinkedIn | OAuth | POST personal or page | Personal voice is the safer initial mode. |
| IndieHackers | No API — manual | n/a | Phase 2 stays manual. |
| ProductHunt | OAuth | POST update | Launch posts only; not weekly cadence. |
| HackerNews | No API — manual | n/a | Phase 2 stays manual. |
| Email | Resend audience | POST audience email | Newsletter integration. |

### Reply / interaction agents (Phase 3.5)

For each platform where we post: poll mentions/replies/comments every 5–10
minutes. Match against patterns:
- "I'm a [archetype]" → reply with archetype card link
- "tried this for X" → reply with relevant pattern page
- Critical / negative → escalate to founder, do not auto-reply

ALL replies require human approval before sending in Phase 3.5. Phase 4
might unlock auto-reply for clearly-safe patterns (archetype mentions).

## Phase 4 — Cadence + Scheduler

**Goal:** A weekly cadence that runs without daily founder attention.

### Cadence proposal

- Mon: Reddit r/loseit GLP-1 post (Weight lane)
- Tue: Twitter "Which autopilot are you?" thread
- Wed: LinkedIn founder note on a behavioral-AI topic
- Thu: Reddit r/getdisciplined or r/productivity post (Focus lane)
- Fri: ProductHunt update + Twitter wrap of the week
- Sat–Sun: organic replies only, no scheduled posts

### Cron implementation

Vercel cron at `apps/web/src/app/api/cron/marketing-post/route.ts`:
- Runs every 30 min
- Finds approved posts scheduled for the current window
- Posts to platform adapter
- Updates status to POSTED + URL or ERRORED + reason

## Risks + how we mitigate

| Risk | Mitigation |
|---|---|
| Reddit shadowban for spam | Manual approval queue; never post in same sub > 1× / 3 days |
| Voice drift across platforms | All templates anchored to manifesto + audit family copy |
| Auto-reply tone-deaf to grief / crisis | Phase 3.5 reply matching has hard exclusion list ("crisis", "emergency", substance dependency keywords) — escalate, never auto-reply |
| Platform API key compromise | Use Vercel env vars; rotate quarterly; admin-only access |
| Founder exhaustion | Phase 1 + 2 keep the loop human; Phase 4 only kicks in once cadence is comfortable |

## Phase 1 implementation status

- [x] `docs/marketing/automation-plan.md` (this doc)
- [x] `apps/web/src/lib/marketing/templates.ts`
- [x] `apps/web/scripts/marketing-draft.ts`
- [ ] First 20 drafts generated + reviewed by founder
- [ ] Voice locked in / template adjustments made

## Open decisions

1. **Account voice — first-person founder vs. brand voice?** Twitter and
   LinkedIn lean founder-voice; Reddit + IndieHackers lean brand-voice but
   with disclosed founder identity. Decide before Phase 2.
2. **Email newsletter cadence — weekly or biweekly?** Footer signup already
   exists. Default weekly per the footer copy ("One email a week").
3. **Should COYL launch on ProductHunt?** PH still moves real volume but
   the audience skews developer-tools. Worth it if the launch post leans
   into "first behavioral interface for AI"; not worth it for a generic
   habit-app launch.
