-- CreateEnum
CREATE TYPE "CheckinCadence" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "CheckinChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateTable
CREATE TABLE "checkin_schedules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "cadence" "CheckinCadence" NOT NULL,
    "channel" "CheckinChannel" NOT NULL DEFAULT 'EMAIL',
    "intervalHours" INTEGER,
    "windowStart" TEXT,
    "windowEnd" TEXT,
    "dailyTime" TEXT,
    "weeklyDay" INTEGER,
    "weeklyTime" TEXT,
    "monthlyDay" INTEGER,
    "monthlyTime" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastFiredAt" TIMESTAMP(3),
    "nextFiresAt" TIMESTAMP(3),
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkin_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checkin_schedules_userId_active_idx" ON "checkin_schedules"("userId", "active");

-- CreateIndex
CREATE INDEX "checkin_schedules_active_nextFiresAt_idx" ON "checkin_schedules"("active", "nextFiresAt");

-- AddForeignKey
ALTER TABLE "checkin_schedules" ADD CONSTRAINT "checkin_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Defense-in-depth RLS. Every COYL public-schema table is accessed
-- exclusively via Prisma using the service role (which bypasses RLS),
-- so the application keeps working with zero changes. The lock-down
-- here prevents any accidental exposure via the anon Supabase REST
-- client from leaking rows. No public policies on purpose — service
-- role is the only authorized reader/writer.
ALTER TABLE "checkin_schedules" ENABLE ROW LEVEL SECURITY;
