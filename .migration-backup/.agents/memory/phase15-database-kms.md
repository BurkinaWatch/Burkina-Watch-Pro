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

Drizzle's available CLI commands do not by themselves provide evidence of a safe, non-destructive baseline for a populated Railway database with no migration ledger. The approved strategy for this project is a reviewed, transaction-locked, forward-only runner that verifies the complete schema before commit; it must not fabricate `__drizzle_migrations`.

**Why:** Replaying the historical migrations could recreate or drop objects, while fabricating `__drizzle_migrations` metadata could make future migration state appear valid without proving provenance.

**How to apply:** Keep historical migrations untouched, document a compatible logical backup and any Railway-managed restore point, require an explicit migration guard, and run read-only preflight checks immediately after the transaction.

Logical PostgreSQL backups require a `pg_dump` client from the same major version
as the server; an older client must be rejected rather than used. A successful
`pg_restore` into an ephemeral same-major cluster validates the archive's
restorability, but does not prove that a provider-managed snapshot exists.

**Why:** Railway exposed PostgreSQL 17 while the first available client was
PostgreSQL 16, and the server correctly refused the incompatible dump.

**How to apply:** Check server/client major versions before backup, keep the
logical dump outside the repository, and separately validate the Railway-managed
restore point.

Preflight row counts are point-in-time observations and must be recaptured
immediately before any production migration.

**Why:** A second read during the same review observed an externally added
`online_sessions` row while all checks remained read-only.

**How to apply:** Treat differing repeated counts as concurrent activity, update
the reference baseline, and stop for human review instead of assuming the data
is unchanged.

Post-merge dependency setup must use the committed lockfile and never run schema
migrations implicitly; the package firewall can reject stale transitive versions
even when the application code itself is unchanged.

**Why:** A clean post-merge install was blocked by vulnerable protobuf, XML parser,
and PDF package versions until the dependency resolutions were refreshed.

**How to apply:** Keep post-merge setup non-interactive and forward-only for code
dependencies, refresh blocked transitive resolutions to compatible safe versions,
and leave Railway schema changes to a separately reviewed workflow.