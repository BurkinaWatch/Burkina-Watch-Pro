-- StreetView Phase 3: authenticated video contributions and preparation jobs.
-- Forward-only. Apply only after the Railway backup/preflight procedure.

CREATE TABLE "streetview_contributions" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "city" text NOT NULL,
  "quartier" text,
  "latitude" numeric(10, 7) NOT NULL,
  "longitude" numeric(10, 7) NOT NULL,
  "status" text NOT NULL DEFAULT 'DRAFT',
  "progress" integer NOT NULL DEFAULT 0,
  "status_message" text,
  "error_code" text,
  "original_file_name" text,
  "media_type" text,
  "storage_key" text,
  "thumbnail_key" text,
  "file_size_bytes" integer,
  "duration_ms" integer,
  "width" integer,
  "height" integer,
  "orientation" text,
  "client_metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "uploaded_at" timestamp,
  "processed_at" timestamp,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "streetview_contributions_user_created_idx"
  ON "streetview_contributions" ("user_id", "created_at");
CREATE INDEX "streetview_contributions_status_idx"
  ON "streetview_contributions" ("status");
CREATE INDEX "streetview_contributions_location_idx"
  ON "streetview_contributions" ("latitude", "longitude");

CREATE TABLE "streetview_processing_jobs" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "contribution_id" text NOT NULL REFERENCES "streetview_contributions"("id") ON DELETE CASCADE,
  "type" text NOT NULL DEFAULT 'PREPARE_CONTRIBUTION',
  "status" text NOT NULL DEFAULT 'QUEUED',
  "progress" integer NOT NULL DEFAULT 0,
  "attempts" integer NOT NULL DEFAULT 0,
  "error_code" text,
  "error_message" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "started_at" timestamp,
  "completed_at" timestamp
);

CREATE INDEX "streetview_jobs_contribution_idx"
  ON "streetview_processing_jobs" ("contribution_id", "created_at");
CREATE INDEX "streetview_jobs_status_idx"
  ON "streetview_processing_jobs" ("status");