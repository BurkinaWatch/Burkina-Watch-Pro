---
name: Phase 5 media gateway
description: Local MediaMTX and FFmpeg interoperability constraints for the surveillance prototype.
---

The approved local topology is to let MediaMTX own the RTSP listener and
publish the synthetic FFmpeg source into it. FFmpeg's RTSP output listen mode
was not usable in this environment because it attempted an outbound
connection instead of providing a listener.

MediaMTX 1.12.x expects the singular `webrtcAllowOrigin` configuration field,
not `webrtcAllowOrigins`.

**Why:** A superficially valid gateway configuration can restart-loop or make
the source fail before WebRTC is even tested.

**How to apply:** Pin the MediaMTX image when validating this prototype,
confirm its generated configuration schema, keep the synthetic publisher on
the dedicated local path, and retest the source with FFprobe before debugging
WHEP or browser behavior.