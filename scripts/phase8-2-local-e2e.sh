#!/usr/bin/env bash
set -euo pipefail

# DEVELOPMENT / TEST ONLY. No production credentials or camera is accepted.
: "${VIDEO_GATEWAY_PUBLISHER_PASSWORD:?Set a temporary local publisher password}"

export VIDEO_GATEWAY_PUBLISHER_USERNAME="${VIDEO_GATEWAY_PUBLISHER_USERNAME:-phase8-agent}"
export VIDEO_GATEWAY_PATH_SECRET="${VIDEO_GATEWAY_PATH_SECRET:-phase8-local-path-secret}"
export SURVEILLANCE_TEST_PATH_NAME="phase8-2-agent-test"
export PORT=5001
export NODE_ENV=development
export VIDEO_GATEWAY_ENABLED=true
export VIDEO_GATEWAY_PROVIDER=mediamtx
export VIDEO_GATEWAY_TEST_MODE=true
export VIDEO_GATEWAY_API_URL=http://127.0.0.1:9997
export VIDEO_GATEWAY_PUBLIC_ORIGIN=http://127.0.0.1:8889

cleanup() {
  kill "${RELAY_PID:-}" "${SOURCE_PID:-}" "${APP_PID:-}" 2>/dev/null || true
  docker compose -f docker-compose.phase8-2.yml down >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker compose -f docker-compose.phase8-2.yml up -d
npx tsx server/index.ts > /tmp/burkinawatch-phase8-2-app.log 2>&1 &
APP_PID=$!

for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:5001/api/auth/csrf >/dev/null 2>&1; then break; fi
  sleep 1
done

PHASE5_SOURCE_PATH=phase8-2-source \
PHASE5_PUBLISH_USERNAME="$VIDEO_GATEWAY_PUBLISHER_USERNAME" \
PHASE5_PUBLISH_PASSWORD="$VIDEO_GATEWAY_PUBLISHER_PASSWORD" \
bash scripts/phase5-test-source.sh >/tmp/burkinawatch-phase8-2-source.log 2>&1 &
SOURCE_PID=$!

BURKINAWATCH_AGENT_ID="00000000-0000-4000-8000-000000000001" \
BURKINAWATCH_CAMERA_ID="00000000-0000-4000-8000-000000000002" \
BURKINAWATCH_STREAM_ID="local-test" \
BURKINAWATCH_LOCAL_RTSP_URL=rtsp://127.0.0.1:8554/phase8-2-source \
VIDEO_GATEWAY_PUBLISHER_USERNAME="$VIDEO_GATEWAY_PUBLISHER_USERNAME" \
VIDEO_GATEWAY_PUBLISHER_PASSWORD="$VIDEO_GATEWAY_PUBLISHER_PASSWORD" \
VIDEO_GATEWAY_PATH_SECRET="$VIDEO_GATEWAY_PATH_SECRET" \
npx tsx agent/runMediaRelay.ts >/tmp/burkinawatch-phase8-2-agent.log 2>&1 &
RELAY_PID=$!

for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:9997/v3/paths/get/phase8-2-agent-test | rg -q '"ready":true'; then
    echo "PASS: agent published a ready RTSP path through MediaMTX"
    echo "PASS: inspect http://127.0.0.1:5001/surveillance in a local browser for WHEP/WebRTC"
    exit 0
  fi
  sleep 1
done

echo "FAIL: MediaMTX did not report the agent path ready"
cat /tmp/burkinawatch-phase8-2-agent.log
exit 1