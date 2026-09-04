import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { streetviewConfig } from "../streetviewConfig";
import {
  getStreetviewStorageInfo,
  streetviewStorageKey,
  streetviewThumbnailKey,
} from "../streetviewStorage";

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
    assert.doesNotMatch(service, /NeRF|Gaussian Splatting|photogrammetry/i);
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
});