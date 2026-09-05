-- StreetView Phase 14: CPU-first metadata and real reconstruction artifacts.
-- Forward-only. Apply only after the Railway backup/preflight procedure.
-- This migration is intentionally not executed by the development workflow.

ALTER TABLE "streetview_contributions"
  ADD COLUMN IF NOT EXISTS "captured_at" timestamp,
  ADD COLUMN IF NOT EXISTS "location_accuracy_m" numeric(10, 2),
  ADD COLUMN IF NOT EXISTS "altitude_m" numeric(10, 2),
  ADD COLUMN IF NOT EXISTS "location_source" text,
  ADD COLUMN IF NOT EXISTS "location_captured_at" timestamp,
  ADD COLUMN IF NOT EXISTS "temporal_version" text,
  ADD COLUMN IF NOT EXISTS "quality_metrics" jsonb;

CREATE TABLE IF NOT EXISTS "streetview_scenes" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "contribution_id" text NOT NULL REFERENCES "streetview_contributions"("id") ON DELETE CASCADE,
  "reconstruction_engine" text NOT NULL,
  "engine_version" text NOT NULL,
  "source_capture_id" text NOT NULL,
  "bounding_box" jsonb,
  "coordinate_reference" text,
  "quality_metrics" jsonb,
  "temporal_version" text,
  "publication_status" text NOT NULL DEFAULT 'DRAFT',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "published_at" timestamp
);

CREATE INDEX IF NOT EXISTS "streetview_scenes_contribution_idx"
  ON "streetview_scenes" ("contribution_id", "created_at");
CREATE INDEX IF NOT EXISTS "streetview_scenes_publication_idx"
  ON "streetview_scenes" ("publication_status", "created_at");

CREATE TABLE IF NOT EXISTS "streetview_scene_artifacts" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scene_id" text NOT NULL REFERENCES "streetview_scenes"("id") ON DELETE CASCADE,
  "kind" text NOT NULL,
  "storage_key" text NOT NULL,
  "content_type" text,
  "byte_size" integer,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "streetview_scene_artifacts_scene_idx"
  ON "streetview_scene_artifacts" ("scene_id", "kind");