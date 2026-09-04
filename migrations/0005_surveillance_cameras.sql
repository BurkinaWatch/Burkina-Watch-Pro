-- Surveillance Phase 3: camera control-plane data only.
-- Reviewed forward-only migration. Do not apply automatically to Railway.

CREATE TABLE "surveillance_cameras" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "connection_type" text NOT NULL DEFAULT 'rtsp',
  "host" text NOT NULL,
  "port" integer NOT NULL,
  "username" text,
  "encrypted_password" text NOT NULL,
  "stream_path" text,
  "status" text NOT NULL DEFAULT 'unknown',
  "last_seen_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "surveillance_cameras_owner_id_users_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "surveillance_cameras_connection_type_check"
    CHECK ("connection_type" IN ('rtsp', 'onvif', 'gateway')),
  CONSTRAINT "surveillance_cameras_port_check"
    CHECK ("port" BETWEEN 1 AND 65535),
  CONSTRAINT "surveillance_cameras_status_check"
    CHECK ("status" IN ('unknown', 'online', 'offline', 'disabled', 'error'))
);
--> statement-breakpoint
CREATE INDEX "surveillance_cameras_owner_created_idx"
  ON "surveillance_cameras" ("owner_id", "created_at");
--> statement-breakpoint
CREATE INDEX "surveillance_cameras_owner_status_idx"
  ON "surveillance_cameras" ("owner_id", "status");