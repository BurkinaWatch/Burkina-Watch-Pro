-- Prompt 9: short-lived, binding-scoped media publication sessions.
-- Forward-only. Do not apply to Railway without the documented preflight,
-- backup and baseline review.

CREATE TABLE "agent_media_sessions" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "camera_id" text NOT NULL,
  "stream_id" text NOT NULL,
  "path_name" text NOT NULL,
  "credential_hash" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "last_published_at" timestamp,
  "revoked_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "agent_media_sessions_owner_id_users_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "agent_media_sessions_agent_id_camera_agents_id_fk"
    FOREIGN KEY ("agent_id") REFERENCES "camera_agents"("id") ON DELETE CASCADE,
  CONSTRAINT "agent_media_sessions_camera_id_surveillance_cameras_id_fk"
    FOREIGN KEY ("camera_id") REFERENCES "surveillance_cameras"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "agent_media_sessions_path_idx"
  ON "agent_media_sessions" ("path_name");
--> statement-breakpoint
CREATE INDEX "agent_media_sessions_agent_camera_idx"
  ON "agent_media_sessions" ("agent_id", "camera_id");
--> statement-breakpoint
CREATE INDEX "agent_media_sessions_expires_idx"
  ON "agent_media_sessions" ("expires_at");