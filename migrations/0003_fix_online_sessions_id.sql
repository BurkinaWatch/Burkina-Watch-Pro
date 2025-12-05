
-- Supprimer la table existante si elle existe et la recréer avec le bon schema
DROP TABLE IF EXISTS "online_sessions";

CREATE TABLE "online_sessions" (
  "id" text PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "connected_at" timestamp NOT NULL DEFAULT now(),
  "disconnected_at" timestamp
);

CREATE INDEX IF NOT EXISTS "online_sessions_user_id_idx" ON "online_sessions"("user_id");
