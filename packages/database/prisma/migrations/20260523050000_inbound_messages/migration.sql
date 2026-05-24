-- CreateEnum
CREATE TYPE "InboundChannel" AS ENUM ('SMS', 'EMAIL');

-- CreateTable
CREATE TABLE "inbound_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "InboundChannel" NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originScheduleId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "inbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inbound_messages_userId_receivedAt_idx" ON "inbound_messages"("userId", "receivedAt" DESC);

-- CreateIndex
CREATE INDEX "inbound_messages_processed_idx" ON "inbound_messages"("processed");

-- CreateIndex
CREATE INDEX "inbound_messages_originScheduleId_idx" ON "inbound_messages"("originScheduleId");

-- AddForeignKey
ALTER TABLE "inbound_messages" ADD CONSTRAINT "inbound_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbound_messages" ADD CONSTRAINT "inbound_messages_originScheduleId_fkey" FOREIGN KEY ("originScheduleId") REFERENCES "checkin_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Defense-in-depth RLS, matching the COYL public-schema convention.
-- Every public table is accessed exclusively via Prisma using the
-- service role (which bypasses RLS), so the application keeps working
-- with zero changes. The lock-down here prevents any accidental
-- exposure via the anon Supabase REST client from leaking rows. No
-- public policies on purpose — service role is the only authorized
-- reader/writer.
ALTER TABLE "inbound_messages" ENABLE ROW LEVEL SECURITY;
