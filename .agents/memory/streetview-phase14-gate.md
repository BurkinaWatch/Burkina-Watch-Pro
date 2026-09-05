---
name: StreetView Phase 14 gate
description: The durable boundary between CPU preparation, schema activation, and real reconstruction publication.
---

CPU metadata inspection and private keyframe extraction may be validated independently, but the dedicated Street View worker must not start until the forward-only schema migration has been applied and verified explicitly.

**Why:** The worker writes Phase 14 metadata fields that do not exist in the pre-migration schema, and publishing a scene without a validated reconstruction adapter would create misleading user-facing data.

**How to apply:** Keep worker activation separate from the web app, require an explicit post-migration enablement flag, and leave contributions in an explicit waiting state until a real SfM/reconstruction adapter has been validated on the target dataset.

Railway may already contain the Phase 3 contribution tables while still missing
the Phase 5 lease columns. Treat that as a valid preflight state requiring the
queue migration first, not as permission to run the CPU-first migration.

**Why:** A schema can look Street View-ready by table name alone while the
worker's claim/retry queries still require the later lease columns.

**How to apply:** Report Phase 5 as absent versus partial versus complete in
the read-only preflight, apply it under the same backup/lock procedure, then
re-run the preflight before applying Phase 14.