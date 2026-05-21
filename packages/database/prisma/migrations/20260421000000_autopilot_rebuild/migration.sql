-- COYL Autopilot Interruption System — full migration
-- Safe to run on a Supabase DB that already has the original COYL schema.
-- All statements use IF NOT EXISTS / DO blocks where possible.

-- ============================================================
-- 1. NEW ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "PrimaryWedge" AS ENUM ('PRODUCTIVITY','WEIGHT_LOSS','CRAVINGS','DESTRUCTIVE_BEHAVIORS','CONSISTENCY','SPENDING','FOCUS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "RecoveryState" AS ENUM ('ACTIVE','SLIPPED','RECOVERING','SILENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "IdentityState" AS ENUM ('SLEEPWALKING','AVOIDANT','RECOVERING','UNSTABLE_BUT_TRYING','INCREASINGLY_CONSCIOUS','RESILIENT','DISCIPLINED','HIGH_SELF_TRUST');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ToneMode" AS ENUM ('MENTOR','STRATEGIST','NO_BS','BEAST');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ExcuseCategory" AS ENUM ('DELAY','REWARD','MINIMIZATION','COLLAPSE','EXHAUSTION','EXCEPTION','COMPENSATION','SOCIAL_PRESSURE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ExcuseSource" AS ENUM ('CHAT','DECISION','RESCUE','CHECKIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "RescueTrigger" AS ENUM ('BINGE_URGE','DELIVERY_URGE','NICOTINE_URGE','ALCOHOL_URGE','SKIP_WORKOUT','SKIP_WEIGHIN','ALREADY_SLIPPED','SPIRALING','DOOMSCROLL','IMPULSE_SPEND','OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "RescueOutcome" AS ENUM ('PENDING','INTERRUPTED','SLIPPED','UNRESOLVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CommitmentDomain" AS ENUM ('FOOD','EXERCISE','CRAVING','SLEEP','SPENDING','FOCUS','RELATIONSHIP','DIGITAL','OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CommitmentFrequency" AS ENUM ('DAILY','WEEKLY','ONE_TIME');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- 2. ADD VALUES TO EXISTING ENUMS
-- ============================================================

-- PlanType: add CORE, PLUS, PREMIUM
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'CORE';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'PLUS';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'PREMIUM';

-- EventType: all new event types
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'CHURN_EMAIL_SENT';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'FEATURE_USED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'ASSESSMENT_RUN';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'CHAT_SESSION';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'MORNING_REVIEW';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'NIGHT_REVIEW';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'STREAK_MILESTONE';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'WEEKLY_REPORT_SENT';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'BADGE_EARNED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'LEVEL_UP';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'CHALLENGE_STARTED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'CHALLENGE_COMPLETED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'CHALLENGE_FAILED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'SLIP_LOGGED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'SLIP_RECOVERED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'RESCUE_TRIGGERED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'RESCUE_RESOLVED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'DECISION_MADE';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'EXCUSE_DETECTED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'DANGER_WINDOW_CROSSED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'AUTOPILOT_INTERRUPTED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'COMMITMENT_CREATED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'COMMITMENT_KEPT';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'COMMITMENT_BROKEN';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'STAKE_PLACED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'STAKE_CHARGED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'STAKE_REFUNDED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'PARTNER_INVITED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'PARTNER_ACCEPTED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'POD_CREATED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'POD_JOINED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'SCENARIO_SIMULATED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'REFERRAL_SENT';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'REFERRAL_CONVERTED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'IDENTITY_CHANGED';

-- ============================================================
-- 3. EXTEND USERS TABLE
-- ============================================================

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "role" TEXT,
  ADD COLUMN IF NOT EXISTS "useCase" TEXT,
  ADD COLUMN IF NOT EXISTS "referralSource" TEXT,
  ADD COLUMN IF NOT EXISTS "biggestGoal" TEXT,
  ADD COLUMN IF NOT EXISTS "failurePattern" TEXT,
  ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "executionScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastCompletionDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "xp" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "profilePublic" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "profileSlug" TEXT,
  ADD COLUMN IF NOT EXISTS "primaryWedge" "PrimaryWedge" NOT NULL DEFAULT 'PRODUCTIVITY',
  ADD COLUMN IF NOT EXISTS "selfTrustScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dangerWindows" JSONB,
  ADD COLUMN IF NOT EXISTS "excuseStyle" "ExcuseCategory",
  ADD COLUMN IF NOT EXISTS "recoveryState" "RecoveryState" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "identityState" "IdentityState" NOT NULL DEFAULT 'SLEEPWALKING',
  ADD COLUMN IF NOT EXISTS "toneMode" "ToneMode" NOT NULL DEFAULT 'MENTOR',
  ADD COLUMN IF NOT EXISTS "lastSlipAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "slipsThisMonth" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT,
  ADD COLUMN IF NOT EXISTS "referredByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeConnectId" TEXT,
  ADD COLUMN IF NOT EXISTS "healthIntegrations" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "users_profileSlug_key" ON "users"("profileSlug");
CREATE UNIQUE INDEX IF NOT EXISTS "users_referralCode_key" ON "users"("referralCode");

-- ============================================================
-- 4. NEW TABLES — AUTOPILOT
-- ============================================================

CREATE TABLE IF NOT EXISTS "excuses" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "category" "ExcuseCategory" NOT NULL,
  "source" "ExcuseSource" NOT NULL DEFAULT 'CHAT',
  "context" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "excuses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "excuses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "excuses_userId_category_idx" ON "excuses"("userId","category");
CREATE INDEX IF NOT EXISTS "excuses_userId_createdAt_idx" ON "excuses"("userId","createdAt");

CREATE TABLE IF NOT EXISTS "danger_windows" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startHour" INTEGER NOT NULL,
  "endHour" INTEGER NOT NULL,
  "triggerType" TEXT,
  "source" TEXT NOT NULL DEFAULT 'user',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "danger_windows_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "danger_windows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "danger_windows_userId_active_idx" ON "danger_windows"("userId","active");

CREATE TABLE IF NOT EXISTS "rescue_sessions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "trigger" "RescueTrigger" NOT NULL,
  "customText" TEXT,
  "intervention" JSONB NOT NULL,
  "outcome" "RescueOutcome" NOT NULL DEFAULT 'PENDING',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "rescue_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rescue_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "rescue_sessions_userId_startedAt_idx" ON "rescue_sessions"("userId","startedAt");

CREATE TABLE IF NOT EXISTS "decision_logs" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "context" TEXT NOT NULL,
  "bestMove" TEXT,
  "worstCase" TEXT,
  "excuseDetected" TEXT,
  "smallestStep" TEXT,
  "userChose" TEXT,
  "outcome" TEXT,
  "savedAsTaskId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "decision_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "decision_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "decision_logs_userId_createdAt_idx" ON "decision_logs"("userId","createdAt");

CREATE TABLE IF NOT EXISTS "commitments" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rule" TEXT NOT NULL,
  "domain" "CommitmentDomain" NOT NULL DEFAULT 'OTHER',
  "frequency" "CommitmentFrequency" NOT NULL DEFAULT 'DAILY',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "stakeAmountCents" INTEGER,
  "stakeId" TEXT,
  "keepCount" INTEGER NOT NULL DEFAULT 0,
  "breakCount" INTEGER NOT NULL DEFAULT 0,
  "lastCheckedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commitments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "commitments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "commitments_stakeId_key" ON "commitments"("stakeId");
CREATE INDEX IF NOT EXISTS "commitments_userId_active_idx" ON "commitments"("userId","active");

CREATE TABLE IF NOT EXISTS "slip_records" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "commitmentId" TEXT,
  "trigger" TEXT,
  "notes" TEXT,
  "recoverySteps" JSONB,
  "recoveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "slip_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "slip_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "slip_records_userId_createdAt_idx" ON "slip_records"("userId","createdAt");

CREATE TABLE IF NOT EXISTS "scenario_sims" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scenario" TEXT NOT NULL,
  "immediate" TEXT,
  "behavioral" TEXT,
  "identityHit" TEXT,
  "alternative" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scenario_sims_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "scenario_sims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "scenario_sims_userId_createdAt_idx" ON "scenario_sims"("userId","createdAt");

-- ============================================================
-- 5. ACCOUNTABILITY + STAKES + PODS + REFERRALS
-- ============================================================

CREATE TABLE IF NOT EXISTS "accountability_partners" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "peerId" TEXT,
  "peerEmail" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  CONSTRAINT "accountability_partners_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "accountability_partners_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "accountability_partners_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "accountability_partners_ownerId_idx" ON "accountability_partners"("ownerId");
CREATE INDEX IF NOT EXISTS "accountability_partners_peerId_idx" ON "accountability_partners"("peerId");
CREATE INDEX IF NOT EXISTS "accountability_partners_peerEmail_idx" ON "accountability_partners"("peerEmail");

CREATE TABLE IF NOT EXISTS "challenge_pods" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "joinCode" TEXT NOT NULL,
  "maxMembers" INTEGER NOT NULL DEFAULT 5,
  "durationDays" INTEGER NOT NULL DEFAULT 14,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "challenge_pods_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "challenge_pods_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "challenge_pods_slug_key" ON "challenge_pods"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "challenge_pods_joinCode_key" ON "challenge_pods"("joinCode");

CREATE TABLE IF NOT EXISTS "pod_members" (
  "id" TEXT NOT NULL,
  "podId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt" TIMESTAMP(3),
  "role" TEXT NOT NULL DEFAULT 'member',
  CONSTRAINT "pod_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pod_members_podId_fkey" FOREIGN KEY ("podId") REFERENCES "challenge_pods"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "pod_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "pod_members_podId_userId_key" ON "pod_members"("podId","userId");

CREATE TABLE IF NOT EXISTS "stakes" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "charityLabel" TEXT NOT NULL DEFAULT 'GiveDirectly',
  "stripeIntentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "chargedAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stakes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "stakes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "stakes_userId_idx" ON "stakes"("userId");

-- Now add the commitments.stakeId foreign key (needs stakes to exist first)
DO $$ BEGIN
  ALTER TABLE "commitments" ADD CONSTRAINT "commitments_stakeId_fkey"
    FOREIGN KEY ("stakeId") REFERENCES "stakes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "referrals" (
  "id" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "referredId" TEXT,
  "referredEmail" TEXT,
  "code" TEXT NOT NULL,
  "converted" BOOLEAN NOT NULL DEFAULT false,
  "convertedAt" TIMESTAMP(3),
  "referrerCredit" INTEGER NOT NULL DEFAULT 0,
  "referredCredit" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referrals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "referrals_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "referrals_code_key" ON "referrals"("code");
CREATE INDEX IF NOT EXISTS "referrals_code_idx" ON "referrals"("code");
CREATE INDEX IF NOT EXISTS "referrals_referrerId_idx" ON "referrals"("referrerId");

-- ============================================================
-- 6. BADGES + CHALLENGES (if not already present from prior db:push)
-- ============================================================

CREATE TABLE IF NOT EXISTS "badges" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "xpReward" INTEGER NOT NULL DEFAULT 10,
  "requirement" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "badges_slug_key" ON "badges"("slug");

CREATE TABLE IF NOT EXISTS "user_badges" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_badges_userId_badgeId_key" ON "user_badges"("userId","badgeId");

CREATE TABLE IF NOT EXISTS "challenges" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "rules" JSONB NOT NULL,
  "xpReward" INTEGER NOT NULL DEFAULT 50,
  "badgeSlug" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "challenges_slug_key" ON "challenges"("slug");

CREATE TABLE IF NOT EXISTS "challenge_entries" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "progress" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  CONSTRAINT "challenge_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "challenge_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "challenge_entries_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "challenge_entries_userId_challengeId_key" ON "challenge_entries"("userId","challengeId");

-- ============================================================
-- Done. You can now run `pnpm db:push` locally to verify sync.
-- ============================================================
