-- CreateTable
CREATE TABLE "teams_user_auths" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accessTokenCipher" TEXT NOT NULL,
    "refreshTokenCipher" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "scopesGranted" TEXT[],
    "lastRefreshedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_user_auths_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_user_auths_userId_key" ON "teams_user_auths"("userId");

-- CreateIndex
CREATE INDEX "teams_user_auths_tenantId_tokenExpiresAt_idx" ON "teams_user_auths"("tenantId", "tokenExpiresAt");

-- AddForeignKey
ALTER TABLE "teams_user_auths" ADD CONSTRAINT "teams_user_auths_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Defense-in-depth RLS, matching the COYL public-schema convention.
-- Every public table is accessed exclusively via Prisma using the
-- service role (which bypasses RLS), so the application keeps working
-- with zero changes. The lock-down here prevents any accidental
-- exposure via the anon Supabase REST client from leaking rows. No
-- public policies on purpose — service role is the only authorized
-- reader/writer.
ALTER TABLE "teams_user_auths" ENABLE ROW LEVEL SECURITY;
