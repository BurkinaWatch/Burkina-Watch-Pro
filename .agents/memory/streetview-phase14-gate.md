---
name: StreetView Phase 14 gate
description: The durable boundary between CPU preparation, schema activation, and real reconstruction publication.
---

CPU metadata inspection and private keyframe extraction may be validated independently, but the dedicated Street View worker must not start until the forward-only schema migration has been applied and verified explicitly.

**Why:** The worker writes Phase 14 metadata fields that do not exist in the pre-migration schema, and publishing a scene without a validated reconstruction adapter would create misleading user-facing data.

**How to apply:** Keep worker activation separate from the web app, require an explicit post-migration enablement flag, and leave contributions in an explicit waiting state until a real SfM/reconstruction adapter has been validated on the target dataset.