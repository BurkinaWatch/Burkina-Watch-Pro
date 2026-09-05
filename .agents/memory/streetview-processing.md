---
name: StreetView processing queue
description: Durable PostgreSQL queue and separate worker boundary for StreetView preprocessing.
---

StreetView preprocessing uses PostgreSQL jobs with row-lock claiming and expiring worker leases; the API only enqueues after upload, while a separate worker validates storage objects and stops at WAITING_FOR_3D.

**Why:** A process-local callback cannot survive a restart, coordinate multiple workers, or safely retry temporary storage failures.

**How to apply:** Keep retries and abandoned-job recovery in the queue layer, keep technical errors out of user messages, and do not add a 3D engine until the preprocessing boundary is reviewed.