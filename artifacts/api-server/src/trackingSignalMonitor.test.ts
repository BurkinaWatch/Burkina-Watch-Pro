import assert from "node:assert/strict";
import test from "node:test";
import type { LocationPoint, TrackingSession } from "@workspace/db";
import {
  TRACKING_SIGNAL_LOSS_TIMEOUT_MS,
  getTrackingSignalStatus,
  toTrackingSessionView,
} from "./trackingSignalMonitor";

function session(startTime: Date, isActive = true): TrackingSession {
  return {
    id: "session-1",
    userId: "user-1",
    startTime,
    endTime: null,
    isActive,
    isPanicMode: false,
    shareToken: null,
  };
}

function point(timestamp: Date): LocationPoint {
  return {
    id: "point-1",
    sessionId: "session-1",
    userId: "user-1",
    latitude: "12.3714000",
    longitude: "-1.5197000",
    accuracy: "10.00",
    timestamp,
  };
}

test("tracking signal is active while a recent location is available", () => {
  const now = new Date("2026-09-11T10:00:00.000Z");
  assert.equal(
    getTrackingSignalStatus(
      session(new Date("2026-09-11T09:00:00.000Z")),
      point(new Date(now.getTime() - TRACKING_SIGNAL_LOSS_TIMEOUT_MS + 1)),
      now,
    ),
    "active",
  );
});

test("tracking signal becomes lost after five minutes without stopping the session", () => {
  const now = new Date("2026-09-11T10:00:00.000Z");
  const activeSession = session(new Date("2026-09-11T09:00:00.000Z"));

  assert.equal(
    getTrackingSignalStatus(
      activeSession,
      point(new Date(now.getTime() - TRACKING_SIGNAL_LOSS_TIMEOUT_MS)),
      now,
    ),
    "signal_lost",
  );
  assert.equal(activeSession.isActive, true);
});

test("a new location restores the active state and the view keeps the last point", () => {
  const now = new Date("2026-09-11T10:00:00.000Z");
  const latestPoint = point(new Date(now.getTime() - 1_000));
  const view = toTrackingSessionView(
    session(new Date("2026-09-11T09:00:00.000Z")),
    latestPoint,
    now,
  );

  assert.equal(view.signalStatus, "active");
  assert.equal(view.lastLocationAt, latestPoint.timestamp);
  assert.equal(view.lastLocation?.latitude, latestPoint.latitude);
});

test("a manually stopped session remains stopped even when its last point is old", () => {
  const now = new Date("2026-09-11T10:00:00.000Z");
  assert.equal(
    getTrackingSignalStatus(
      session(new Date("2026-09-11T09:00:00.000Z"), false),
      point(new Date("2026-09-11T08:00:00.000Z")),
      now,
    ),
    "stopped",
  );
});