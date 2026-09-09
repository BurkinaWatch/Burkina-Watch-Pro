
CREATE TABLE IF NOT EXISTS "online_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"last_activity" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "online_sessions" ADD CONSTRAINT "online_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "online_sessions_user_id_idx" ON "online_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "online_sessions_last_activity_idx" ON "online_sessions" ("last_activity");
