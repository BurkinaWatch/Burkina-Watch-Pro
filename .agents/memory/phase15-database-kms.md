---
name: Database and KMS readiness
description: Durable constraints found while stabilizing Burkina Watch before adding sensitive features.
---

The application runtime and the Replit development database are not automatically the same target. Runtime code prefers the Railway connection variable, while Drizzle configuration uses the development connection variable. Treat schema observations as environment-specific until both targets are explicitly identified.

**Why:** The development database was reachable but empty, while the runtime-selected database had an existing schema with no trustworthy complete Drizzle migration history. Blind schema synchronization could target the wrong database or cause destructive drift.

**How to apply:** Before any schema change, inventory both targets read-only, choose one source of truth, back up the schema outside the repository, and use a reviewed forward-only migration path. Never use `db:push` blindly against a production URL.

The repository declares Google Cloud KMS, but the local node_modules can omit the declared package because installation is environment/firewall constrained. The encryption service is not currently used by application data paths, so it must not be treated as protection for future sensitive credentials until dependency installation, KMS configuration, and integration tests all pass.

**Why:** A green build can coexist with a missing runtime encryption dependency because the bundler externalizes packages and production code does not currently import the service. This can conceal a failure until encryption is first used.

**How to apply:** Restore the declared Node-compatible KMS dependency in a writable clean install, verify KMS IAM/identifiers and stable secret configuration without logging values, then run the encryption tests before relying on the service.