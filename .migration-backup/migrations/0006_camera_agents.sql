-- Prompt 8.1: secure Camera Agent control-plane primitives.
-- Forward-only and intentionally not applied automatically to Railway.

CREATE TABLE "camera_agents" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL,
  "name" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "version" text,
  "enrollment_hash" text NOT NULL,
  "enrollment_expires_at" timestamp NOT NULL,
  "enrollment_used_at" timestamp,
  "credential_hash" text,
  "enrolled_at" timestamp,
  "last_seen_at" timestamp,
  "revoked_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "camera_agents_owner_id_users_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "camera_agents_status_check"
    CHECK ("status" IN ('pending', 'enrolled', 'online', 'stale', 'offline', 'revoked', 'error'))
);
--> statement-breakpoint
CREATE INDEX "camera_agents_owner_status_idx"
  ON "camera_agents" ("owner_id", "status");
--> statement-breakpoint
CREATE INDEX "camera_agents_owner_last_seen_idx"
  ON "camera_agents" ("owner_id", "last_seen_at");
--> statement-breakpoint
CREATE TABLE "agent_camera_bindings" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "camera_id" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "agent_camera_bindings_owner_id_users_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "agent_camera_bindings_agent_id_camera_agents_id_fk"
    FOREIGN KEY ("agent_id") REFERENCES "camera_agents"("id") ON DELETE CASCADE,
  CONSTRAINT "agent_camera_bindings_camera_id_surveillance_cameras_id_fk"
    FOREIGN KEY ("camera_id") REFERENCES "surveillance_cameras"("id") ON DELETE CASCADE,
  CONSTRAINT "agent_camera_bindings_status_check"
    CHECK ("status" IN ('active', 'disabled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "agent_camera_bindings_agent_camera_idx"
  ON "agent_camera_bindings" ("agent_id", "camera_id");
--> statement-breakpoint
CREATE INDEX "agent_camera_bindings_owner_idx"
  ON "agent_camera_bindings" ("owner_id");
--> statement-breakpoint
CREATE INDEX "agent_camera_bindings_camera_idx"
  ON "agent_camera_bindings" ("camera_id");