-- Add missing columns for the current Prisma schema.
-- Event
ALTER TABLE "Event" ADD COLUMN "name" TEXT;
ALTER TABLE "Event" ADD COLUMN "maxPlayers" INTEGER;
ALTER TABLE "Event" ADD COLUMN "referenceImageUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN "referenceEmbedding" JSONB;
ALTER TABLE "Event" ADD COLUMN "aiWins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Event" ADD COLUMN "humanWins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Event" ADD COLUMN "referencePrompt" TEXT;

-- Backfill required fields for any existing rows, then enforce NOT NULL.
UPDATE "Event" SET "name" = 'Untitled Event' WHERE "name" IS NULL;
UPDATE "Event" SET "maxPlayers" = 10 WHERE "maxPlayers" IS NULL;
ALTER TABLE "Event" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "maxPlayers" SET NOT NULL;

-- Player
ALTER TABLE "Player" ADD COLUMN "phone" TEXT;
ALTER TABLE "Player" ADD COLUMN "prompt" TEXT;
ALTER TABLE "Player" ADD COLUMN "generatedImageUrl" TEXT;

-- Add relation constraint expected by Prisma.
ALTER TABLE "Player"
ADD CONSTRAINT "Player_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

