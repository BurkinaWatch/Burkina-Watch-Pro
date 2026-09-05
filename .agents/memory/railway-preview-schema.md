---
name: Railway preview schema validation
description: Prevents confusing schema checks when the app and Replit database tools target different PostgreSQL instances.
---

The application can run against a Railway PostgreSQL URL while Replit's built-in database callbacks target a separate development database. A successful query in the built-in database does not prove that the application's runtime schema is ready.

**Why:** A schema change can make runtime ORM queries fail before its forward-only migration reaches the database used by the preview or deployment.

**How to apply:** Keep schema changes additive and provide a compatible read path when a migration is pending; validate the actual app endpoint and logs, and do not apply production DDL from the agent without the project's migration procedure.