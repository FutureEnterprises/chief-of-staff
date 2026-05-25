-- Recover the missing scheduled_interrupts table.
--
-- This table was defined in packages/database/prisma/schema.prisma as
-- `model ScheduledInterrupt` since at least April 2026, but never
-- successfully applied to production at the COYL Supabase project.
-- /api/cron/scheduled-interrupts has been silently failing every minute
-- with Prisma error P2021 ("The table `public.scheduled_interrupts`
-- does not exist in the current database") since deploy.
--
-- The cron's error happened BEFORE the recordHeartbeat() call (added in
-- commit bdae3eb), so cron_heartbeats never showed the failure — the
-- silent failure was only discovered via vercel runtime logs on
-- 2026-05-25 while investigating a "Server Components render" crash on
-- the /today dashboard.
--
-- Applied to prod via the supabase MCP apply_migration tool on
-- 2026-05-25 with a corresponding _prisma_migrations row inserted (so
-- prisma migrate deploy is a no-op for this on the next deploy). This
-- file commits the schema-of-record for fresh-DB deploys to other
-- environments (staging, branch DBs, local dev resets).

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ScheduledInterruptStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "scheduled_interrupts" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "archetypeFamily" TEXT NOT NULL,
    "wedge" TEXT NOT NULL,
    "window" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" "ScheduledInterruptStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_interrupts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_interrupts_status_scheduledFor_idx" ON "scheduled_interrupts"("status", "scheduledFor");

-- Defense-in-depth RLS — matches the COYL pattern (service-role bypass,
-- anon-key REST is locked out).
ALTER TABLE "scheduled_interrupts" ENABLE ROW LEVEL SECURITY;
