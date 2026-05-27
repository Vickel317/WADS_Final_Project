-- Add AI moderation fields to Post table
ALTER TABLE "Post"
  ADD COLUMN IF NOT EXISTS "aiScore"    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "aiLabel"    TEXT,
  ADD COLUMN IF NOT EXISTS "aiReason"   TEXT;
