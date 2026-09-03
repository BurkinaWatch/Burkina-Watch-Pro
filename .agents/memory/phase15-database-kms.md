---
name: Database and KMS readiness
description: Durable constraints found while stabilizing Burkina Watch before adding sensitive features.
---

Railway PostgreSQL is the sole production source of truth. Backend and Drizzle must resolve the same Railway-prioritized connection, while local development may use the standard connection only as a fallback. The runtime target currently has 29 tables matching the declared table and column names, but it lacks a trustworthy migration ledger and has physical drift in secondary indexes and one default.

**Why:** The development database was reachable but empty, while the runtime-selected database had an existing schema with no `__drizzle_migrations` table. Blind schema synchronization could target the wrong database or cause destructive drift.

**How to apply:** Before any schema change, inventory both targets read-only, keep Railway as the production reference, back up the schema outside the repository, and use a reviewed forward-only migration path. Never use `db:push` blindly against a production URL.

The repository declares Google Cloud KMS, but the local node_modules can omit the declared package because installation is environment/firewall constrained. The encryption service is not currently used by application data paths, so it must not be treated as protection for future sensitive credentials until dependency installation, KMS configuration, and integration tests all pass.

**Why:** A green build can coexist with a missing runtime encryption dependency because the bundler externalizes packages and production code does not currently import the service. This can conceal a failure until encryption is first used.

**How to apply:** Restore the declared Node-compatible KMS dependency in a writable clean install, verify KMS IAM/identifiers and stable secret configuration without logging values, then run the encryption tests before relying on the service.

Drizzle's available CLI commands do not by themselves provide evidence of a safe, non-destructive baseline for a populated Railway database with no migration ledger.

**Why:** Replaying the historical migrations could recreate or drop objects, while fabricating `__drizzle_migrations` metadata could make future migration state appear valid without proving provenance.

**How to apply:** Keep the historical migrations untouched, document the Railway snapshot, and require a reviewed baseline method plus a restore point before applying any versioned schema change.