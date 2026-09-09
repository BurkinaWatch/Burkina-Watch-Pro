#!/usr/bin/env bash
set -euo pipefail

# Controlled local-only source for Phase 5. MediaMTX provides the RTSP
# listener; FFmpeg publishes an H.264/AAC test pattern to it.
TEST_SOURCE_PATH="${PHASE5_SOURCE_PATH:-phase5-test}"
SOURCE_AUTH_PREFIX=""
if [[ -n "${PHASE5_PUBLISH_USERNAME:-}" && -n "${PHASE5_PUBLISH_PASSWORD:-}" ]]; then
  SOURCE_AUTH_PREFIX="${PHASE5_PUBLISH_USERNAME}:${PHASE5_PUBLISH_PASSWORD}@"
fi
exec ffmpeg \
  -hide_banner \
  -loglevel warning \
  -re \
  -f lavfi -i "testsrc2=size=1280x720:rate=25" \
  -f lavfi -i "sine=frequency=440:sample_rate=48000" \
  -c:v libx264 \
  -preset ultrafast \
  -tune zerolatency \
  -pix_fmt yuv420p \
  -b:v 1800k \
  -g 50 \
  -c:a aac \
  -b:a 96k \
  -ar 48000 \
  -f rtsp \
  -rtsp_transport tcp \
  "rtsp://${SOURCE_AUTH_PREFIX}127.0.0.1:8554/${TEST_SOURCE_PATH}"