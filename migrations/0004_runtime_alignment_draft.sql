-- DRAFT ONLY — not tracked in Drizzle journal and not applied.
-- Apply only after a validated Railway baseline and pre-production review.

CREATE INDEX IF NOT EXISTS "commentaires_signalement_id_idx"
  ON "commentaires" ("signalement_id");

CREATE INDEX IF NOT EXISTS "commentaires_user_id_idx"
  ON "commentaires" ("user_id");

CREATE INDEX IF NOT EXISTS "notifications_user_id_read_idx"
  ON "notifications" ("user_id", "read");

CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_idx"
  ON "notifications" ("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "online_sessions_user_id_idx"
  ON "online_sessions" ("user_id");

CREATE INDEX IF NOT EXISTS "signalements_user_id_idx"
  ON "signalements" ("user_id");

CREATE INDEX IF NOT EXISTS "signalements_created_at_idx"
  ON "signalements" ("created_at");

CREATE INDEX IF NOT EXISTS "signalements_statut_idx"
  ON "signalements" ("statut");

CREATE INDEX IF NOT EXISTS "tracking_sessions_user_id_active_idx"
  ON "tracking_sessions" ("user_id", "is_active");

ALTER TABLE "online_sessions"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();