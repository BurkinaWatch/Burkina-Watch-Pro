import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { streetviewConfig } from "../streetviewConfig";
import {
  getStreetviewStorageInfo,
  streetviewStorageKey,
  streetviewThumbnailKey,
} from "../streetviewStorage";
import {
  classifyStreetviewError,
  isRetryableStreetviewError,
  retryDelayMs,
} from "../streetviewProcessing";

describe("StreetView Phase 3", () => {
  test("centralizes safe video limits and supported formats", () => {
    assert.equal(streetviewConfig.maxVideoBytes, 100 * 1024 * 1024);
    assert.deepEqual(streetviewConfig.allowedMimeTypes, [
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ]);
    assert.ok(streetviewConfig.minDurationSeconds < streetviewConfig.maxDurationSeconds);
  });

  test("keeps video and thumbnails outside PostgreSQL binary columns", () => {
    assert.equal(
      streetviewStorageKey("contribution-1", "video/mp4"),
      "contributions/contribution-1/source/original.mp4",
    );
    assert.equal(
      streetviewThumbnailKey("contribution-1"),
      "contributions/contribution-1/thumbnail.jpg",
    );
    assert.equal(getStreetviewStorageInfo().provider, "filesystem");
  });

  test("preparation phase stops before any 3D reconstruction engine", () => {
    const service = readFileSync("server/streetviewPreparationService.ts", "utf8");
    assert.match(service, /Phase 3 deliberately stops here/);
    assert.match(service, /status: "WAITING_FOR_3D"/);
    assert.doesNotMatch(service, /(?:from|import|exec|spawn)[^;\n]*(?:NeRF|Gaussian Splatting|photogrammetry)/i);
  });

  test("migration defines contribution and processing job tables", () => {
    const migration = readFileSync(
      "migrations/0008_streetview_contributions.sql",
      "utf8",
    );
    assert.match(migration, /CREATE TABLE "streetview_contributions"/);
    assert.match(migration, /CREATE TABLE "streetview_processing_jobs"/);
    assert.match(migration, /"storage_key" text/);
    assert.match(migration, /"client_metadata" jsonb/);
  });

  test("Phase 5 queue migration adds durable leases and retry fields", () => {
    const migration = readFileSync(
      "migrations/0009_streetview_processing_queue.sql",
      "utf8",
    );
    for (const column of [
      "max_attempts",
      "available_at",
      "locked_at",
      "lease_until",
      "locked_by",
      "updated_at",
    ]) {
      assert.match(migration, new RegExp(`"${column}"`));
    }
    assert.match(migration, /DROP INDEX IF EXISTS "streetview_jobs_status_idx"/);
    assert.match(migration, /"status", "available_at"/);
  });

  test("classifies permanent and temporary worker failures", () => {
    assert.equal(classifyStreetviewError(new Error("INVALID_VIDEO_CONTAINER")).retryable, false);
    assert.equal(classifyStreetviewError(new Error("NoSuchKey")).code, "FILE_NOT_FOUND");
    assert.equal(classifyStreetviewError(new Error("ECONNRESET")).code, "NETWORK_TEMPORARY");
    assert.equal(isRetryableStreetviewError("STORAGE_UNAVAILABLE"), true);
    assert.equal(isRetryableStreetviewError("INVALID_METADATA"), false);
  });

  test("uses bounded exponential retry delays", () => {
    assert.equal(retryDelayMs(1), 5_000);
    assert.equal(retryDelayMs(2), 10_000);
    assert.equal(retryDelayMs(99), 300_000);
  });

  test("keeps the worker before 3D reconstruction", () => {
    const worker = readFileSync("server/streetviewWorker.ts", "utf8");
    assert.match(worker, /WAITING_FOR_3D/);
    assert.match(worker, /inspectStreetviewStoredObject/);
    assert.doesNotMatch(worker, /(?:NeRF|Gaussian Splatting|photogrammetry|reconstruction GPU)/i);
  });
});