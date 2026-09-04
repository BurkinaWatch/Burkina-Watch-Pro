---
name: Media authorization boundary
description: Rules separating MediaMTX administration from camera-agent publishing.
---

The MediaMTX auth callback must authorize camera publication only through a
short-lived, agent-camera-stream session (plus explicitly isolated local test
credentials). A gateway administration bearer may not bypass the publish check;
viewer reads must continue through a short-lived viewer grant.

**Why:** Treating an infrastructure/API bearer as a media credential would let
an administrative token publish arbitrary paths and bypass agent ownership,
binding, expiry, and revocation controls.

**How to apply:** Keep publish and read branches separate in the callback,
validate opaque paths and scoped sessions for real agents, and add regression
tests for revoked agents, expired sessions, wrong paths/credentials, and
administrative bearer misuse.