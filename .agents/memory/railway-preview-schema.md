---
name: Railway preview schema validation
description: Prevents confusing schema checks when the app and Replit database tools target different PostgreSQL instances.
---

The application can run against a Railway PostgreSQL URL while Replit's built-in database callbacks target a separate development database. A successful query in the built-in database does not prove that the application's runtime schema is ready.

**Why:** A schema change can make runtime ORM queries fail before its forward-only migration reaches the database used by the preview or deployment.

**How to apply:** Keep schema changes additive and provide a compatible read path when a migration is pending; validate the actual app endpoint and logs, and do not apply production DDL from the agent without the project's migration procedure.

Railway access alone does not prove that the intended application is deployed: verify the project, service, source repository, branch, commit, and a representative API route before changing production configuration.

**Why:** A reachable production domain can belong to a different service or repository than the local workspace; a successful container start then gives a false sense that the target backend has been validated.

**How to apply:** Treat source identity and route smoke tests as mandatory parts of deployment validation, and stop before silently repointing a public service when the identities diverge.