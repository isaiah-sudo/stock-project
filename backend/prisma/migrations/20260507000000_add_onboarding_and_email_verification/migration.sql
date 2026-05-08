-- Add onboarding and email verification fields
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "portfolioPreset" TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailVerificationExpiresAt" TIMESTAMP(3);

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "lastPortfolioDigestSentAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_emailVerificationToken_key" ON "User"("emailVerificationToken");
