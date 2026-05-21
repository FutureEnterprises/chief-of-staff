# Production Schema Sync — Fix for "Server Components render error"

## The diagnosis

The Prisma client embedded in every Vercel deployment knows about ~30
User columns + 4 new tables (MarketingPost, SmsSignup, the autopilot
suite). Your production Supabase DB doesn't have them yet because no
migration has been run against prod.

Every signed-in request calls `requireDbUser()` →
`prisma.user.upsert()`. The upsert's underlying `SELECT` asks for all
known columns. Postgres errors with "column X does not exist." Next.js
turns that into the generic "Server Components render error" because
production hides exception text.

This sync fixes it.

## The fix — two paths, pick one

### PATH A — `prisma db push` (recommended, single command)

Get your prod `DATABASE_URL` from Vercel:
```bash
# Vercel → Project → Settings → Environment Variables → DATABASE_URL → reveal
export DATABASE_URL="postgresql://...supabase.co:5432/postgres"
```

Then from the repo root:
```bash
cd packages/database
npx prisma db push
```

`db push` introspects the prod DB, adds any missing columns / tables /
indexes / enums to make the live schema match `schema.prisma`. It does
NOT drop anything. Safe for additive changes (everything we've done
this month is additive).

If `db push` reports any potential data loss, **stop and read the
diff**. Should be zero — but verify before answering yes.

### PATH B — SQL Editor in Supabase (UI route)

If you'd rather paste SQL into the Supabase dashboard:

1. Supabase → SQL Editor → New query
2. Paste the contents of
   `packages/database/prisma/migrations/20260421000000_autopilot_rebuild/migration.sql`
3. Run it. It's idempotent (uses `IF NOT EXISTS` everywhere).
4. Then paste the contents below (the post-rebuild deltas) and run.

## Post-rebuild deltas — paste into Supabase SQL Editor

```sql
-- New enum for the May 2026 drive-profile field
DO $$ BEGIN
  CREATE TYPE "DriveProfile" AS ENUM ('COMFORT','STIMULATION','RELIEF');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- User: drive-profile / replacement-menu / web-push / notification prefs
-- / GLP-1 prescription fields / referral credits
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "webPushSubscription"   JSONB,
  ADD COLUMN IF NOT EXISTS "notificationPrefs"     JSONB,
  ADD COLUMN IF NOT EXISTS "glp1Drug"              TEXT,
  ADD COLUMN IF NOT EXISTS "glp1InjectionWeekday"  INTEGER,
  ADD COLUMN IF NOT EXISTS "glp1StartedAt"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "glp1EndedAt"           TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "referralCreditMonths"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "driveProfile"          "DriveProfile",
  ADD COLUMN IF NOT EXISTS "replacementMenu"       JSONB;

-- RescueSession: shareCode for /i/[code] viral share URLs
ALTER TABLE "rescue_sessions"
  ADD COLUMN IF NOT EXISTS "shareCode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "rescue_sessions_shareCode_key"
  ON "rescue_sessions"("shareCode");

CREATE INDEX IF NOT EXISTS "rescue_sessions_shareCode_idx"
  ON "rescue_sessions"("shareCode");

-- ProductivityEvent: INTERRUPT_FEEDBACK enum value
DO $$ BEGIN
  ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'INTERRUPT_FEEDBACK';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- SMS signup table for /catch-me funnel
CREATE TABLE IF NOT EXISTS "sms_signups" (
  "id"          TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "source"      TEXT NOT NULL,
  "timezone"    TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sms_signups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sms_signups_phoneNumber_idx"
  ON "sms_signups"("phoneNumber");

CREATE INDEX IF NOT EXISTS "sms_signups_createdAt_idx"
  ON "sms_signups"("createdAt");

-- Marketing automation Phase 2 tables
DO $$ BEGIN
  CREATE TYPE "MarketingPlatform" AS ENUM (
    'REDDIT','TWITTER_THREAD','TWITTER_SINGLE','THREADS',
    'LINKEDIN','INDIEHACKERS','PRODUCTHUNT','HACKERNEWS','NEWSLETTER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MarketingPostStatus" AS ENUM (
    'DRAFT','APPROVED','REJECTED','POSTED','ERRORED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "marketing_posts" (
  "id"              TEXT NOT NULL,
  "platform"        "MarketingPlatform" NOT NULL,
  "archetype"       TEXT,
  "topic"           TEXT NOT NULL,
  "draftBody"       TEXT NOT NULL,
  "finalBody"       TEXT,
  "status"          "MarketingPostStatus" NOT NULL DEFAULT 'DRAFT',
  "approvedBy"      TEXT,
  "postedAt"        TIMESTAMP(3),
  "postedUrl"       TEXT,
  "rejectionReason" TEXT,
  "generatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "model"           TEXT NOT NULL DEFAULT 'sonnet',
  CONSTRAINT "marketing_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "marketing_posts_status_platform_idx"
  ON "marketing_posts"("status","platform");

CREATE INDEX IF NOT EXISTS "marketing_posts_archetype_idx"
  ON "marketing_posts"("archetype");

CREATE INDEX IF NOT EXISTS "marketing_posts_generatedAt_idx"
  ON "marketing_posts"("generatedAt");
```

## Verify after running

After PATH A or PATH B, hard-refresh `/today` in the browser. The
Server Components error should be gone.

If it's NOT gone, check Vercel runtime logs — `apps/web/src/lib/auth.ts`
now logs the underlying Postgres error before re-throwing, so the
actual cause will be visible:

```
Vercel → Project → Deployments → click latest → Functions → Logs
```

Look for `[requireDbUser] prisma.user.upsert failed` with the Postgres
error code (e.g., `42703 column "X" does not exist`).

## After the fix lands

Re-run any prod cron / queue job that may have errored due to schema
mismatch (web-push subscription writes, danger-window cron, etc.).
They should self-heal on next tick.
