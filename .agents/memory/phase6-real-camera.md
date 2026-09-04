---
name: Phase 6 real-camera guardrails
description: Durable safety constraints for controlled physical-camera validation.
---

Real-camera support must remain an explicit non-production capability. Private
camera addresses may be allowed only through a dedicated environment flag;
loopback, metadata, link-local, multicast, and reserved addresses remain
blocked. Camera credentials are decrypted only in server memory for RTSP
probing or MediaMTX path registration, and the public API must return only
abstract status or temporary viewer access.

**Why:** The application needs to prove a physical RTSP-to-WebRTC chain
without turning user-controlled camera endpoints into a general SSRF surface
or exposing credentials.

**How to apply:** Keep the default gateway disabled, require explicit real
camera and path-secret configuration outside production, use private/VPN
networking rather than public RTSP, and complete physical-camera ownership,
token, offline/reconnect, codec, and NAT tests before any production decision.
Treat in-memory paths and viewer grants as single-instance only; shared
observability and persistence are prerequisites for multi-instance operation.