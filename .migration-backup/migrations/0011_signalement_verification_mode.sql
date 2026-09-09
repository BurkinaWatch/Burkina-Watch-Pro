-- Persist the public provenance of the automated reliability score.
-- Forward-only: apply after the database baseline has been validated.

ALTER TABLE "signalements"
  ADD COLUMN IF NOT EXISTS "reliability_score" integer,
  ADD COLUMN IF NOT EXISTS "verification_status" text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "verification_mode" text NOT NULL DEFAULT 'pending';