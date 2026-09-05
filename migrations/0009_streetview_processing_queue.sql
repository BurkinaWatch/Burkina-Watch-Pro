-- StreetView Phase 5: durable database-backed queue and worker leases.
-- Forward-only. Apply only after the Railway backup/preflight procedure.

ALTER TABLE "streetview_processing_jobs"
  ADD COLUMN IF NOT EXISTS "max_attempts" integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "available_at" timestamp NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "locked_at" timestamp,
  ADD COLUMN IF NOT EXISTS "lease_until" timestamp,
  ADD COLUMN IF NOT EXISTS "locked_by" text,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();

DROP INDEX IF EXISTS "streetview_jobs_status_idx";
CREATE INDEX IF NOT EXISTS "streetview_jobs_status_idx"
  ON "streetview_processing_jobs" ("status", "available_at");