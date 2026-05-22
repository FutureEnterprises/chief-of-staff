-- Share-card opt-in
--
-- Adds a per-user boolean that gates GET /api/share/[userId] — the
-- public OG-image endpoint that previously rendered first-name +
-- executionScore + selfTrustScore + currentStreak + primaryWedge +
-- excuseStyle for ANY userId, with no auth or opt-in.
--
-- Default OFF: existing users land with share cards disabled. The
-- endpoint will return 404 until they toggle it on in /settings.
-- This intentionally breaks any previously-shared OG URLs in the wild
-- (DM screenshots, web archive crawls, link-preview caches) — the
-- privacy default is correct, and re-enabling is one click away.

ALTER TABLE "User" ADD COLUMN "shareCardEnabled" BOOLEAN NOT NULL DEFAULT false;
