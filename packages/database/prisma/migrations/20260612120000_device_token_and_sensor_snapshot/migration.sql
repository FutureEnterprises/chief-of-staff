-- EAP edge-execution loop: device-scoped machine token + latest sensor
-- snapshot, both hung off the existing "devices" row. Idempotent so a
-- re-apply (or a partial prior apply) is a no-op.

-- Device-scoped credential. Hash + last-four only; the plaintext token
-- is returned to the coordinator once at register time and never stored.
ALTER TABLE "devices"
  ADD COLUMN IF NOT EXISTS "deviceTokenHash" TEXT;

ALTER TABLE "devices"
  ADD COLUMN IF NOT EXISTS "deviceTokenLastFour" TEXT;

-- Most-recent sensor snapshot published by the device coordinator
-- (full snapshot every 60s; we keep only the latest).
ALTER TABLE "devices"
  ADD COLUMN IF NOT EXISTS "lastSensorSnapshot" JSONB;

ALTER TABLE "devices"
  ADD COLUMN IF NOT EXISTS "lastSensorAt" TIMESTAMP(3);
