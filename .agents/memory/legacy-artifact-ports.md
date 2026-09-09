---
name: Legacy full-stack artifact ports
description: Non-obvious constraints when moving a legacy full-stack app into the pnpm workspace artifacts layout.
---

Legacy route modules may register full `/api/...` paths themselves rather than router-relative paths. Preserve that contract by mounting the legacy registration on the app directly, while keeping workspace health routes separate.

**Why:** Mounting such a module below `/api` duplicates the prefix and breaks every client request; moving it into a `routes/` directory also changes the base for dynamic relative imports.

**How to apply:** During future ports, inspect the route registration signature and update every dynamic import that was relative to the old server directory. Do not run database migrations as part of this compatibility work.