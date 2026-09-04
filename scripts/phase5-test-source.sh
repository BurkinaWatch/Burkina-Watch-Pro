#!/usr/bin/env bash
set -euo pipefail

# Controlled local-only source for Phase 5. It listens on localhost and emits
# a synthetic H.264/AAC test pattern; it never uses a camera credential.
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
  -rtsp_flags listen \
  rtsp://127.0.0.1:8555/phase5-test