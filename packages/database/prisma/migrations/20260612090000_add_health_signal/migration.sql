-- Edge health signals (HealthKit v1). Idempotent.
CREATE TABLE IF NOT EXISTS "health_signals" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "unit" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "health_signals_userId_kind_startedAt_key"
  ON "health_signals"("userId", "kind", "startedAt");

CREATE INDEX IF NOT EXISTS "health_signals_userId_kind_startedAt_idx"
  ON "health_signals"("userId", "kind", "startedAt" DESC);

DO $$ BEGIN
  ALTER TABLE "health_signals"
    ADD CONSTRAINT "health_signals_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
