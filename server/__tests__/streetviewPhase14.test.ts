import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import {
  runStreetviewCpuPreparation,
  type StreetviewCpuPreparationDependencies,
} from "../streetviewCpuPreparation";
import { CpuReconstructionEngine } from "../streetviewReconstruction";
import {
  isStreetviewContributionCpuPrepared,
  resolveStreetviewPreparationWaitingState,
} from "../streetviewWorker";
import { getCpuPreparationArtifactKeys } from "../streetviewArtifacts";

const probeOutput = JSON.stringify({
  streams: [{
    codec_name: "h264",
    width: 640,
    height: 360,
    duration: "6",
    avg_frame_rate: "24/1",
  }],
  format: { duration: "6", format_name: "mov,mp4,m4a,3gp,3g2,mj2" },
});

async function withEnvironment<T>(
  name: string,
  value: string | undefined,
  callback: () => Promise<T>,
): Promise<T> {
  const previous = process.env[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
  try {
    return await callback();
  } finally {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  }
}

function fakePreparationDependencies(
  command: (command: string, args: string[]) => Promise<string>,
  createdRoots: string[],
): StreetviewCpuPreparationDependencies {
  return {
    readObject: async () => Buffer.from("video"),
    writeBuffer: async () => undefined,
    runCommand: command,
    createTempRoot: async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "streetview-phase14-test-"));
      createdRoots.push(root);
      return root;
    },
  };
}

describe("StreetView Phase 14", () => {
  test("extracts real metadata and stores produced keyframes without creating a scene", async () => {
    const createdRoots: string[] = [];
    const stored: string[] = [];
    const result = await withEnvironment("STREETVIEW_CPU_KEYFRAMES_ENABLED", "true", () =>
      runStreetviewCpuPreparation(
        "contribution-1",
        "contributions/contribution-1/source/original.mp4",
        {
          ...fakePreparationDependencies(async (command, args) => {
            if (command === "ffprobe") return probeOutput;
            assert.equal(command, "ffmpeg");
            const outputPath = args.at(-1);
            assert.ok(outputPath);
            await writeFile(outputPath.replace("frame-%06d.jpg", "frame-000001.jpg"), Buffer.from("jpeg"));
            await writeFile(outputPath.replace("frame-%06d.jpg", "frame-000002.jpg"), Buffer.from("jpeg"));
            return "";
          }, createdRoots),
          writeBuffer: async (key) => {
            stored.push(key);
          },
        },
      ),
    );

    assert.equal(result.capability, "READY");
    assert.equal(result.qualityMetrics.codec, "h264");
    assert.equal(result.qualityMetrics.durationSeconds, 6);
    assert.equal(result.qualityMetrics.keyframesExtracted, 2);
    assert.deepEqual(stored, [
      "contributions/contribution-1/keyframes/frame-000001.jpg",
      "contributions/contribution-1/keyframes/frame-000002.jpg",
    ]);
    assert.deepEqual(result.artifactKeys, stored);
    await assert.rejects(() => readFile(path.join(createdRoots[0], "source-video")));
  });

  test("returns an explicit unavailable state when ffprobe is missing", async () => {
    const result = await runStreetviewCpuPreparation(
      "contribution-2",
      "contributions/contribution-2/source/original.mp4",
      fakePreparationDependencies(async () => {
        const error = new Error("ffprobe missing") as NodeJS.ErrnoException;
        error.code = "ENOENT";
        throw error;
      }, []),
    );

    assert.equal(result.capability, "UNAVAILABLE");
    assert.equal(result.qualityMetrics.tool, "ffprobe");
    assert.deepEqual(result.artifactKeys, []);
  });

  test("keeps metadata usable when ffmpeg is missing", async () => {
    const result = await runStreetviewCpuPreparation(
      "contribution-3",
      "contributions/contribution-3/source/original.mp4",
      fakePreparationDependencies(async (command) => {
        if (command === "ffprobe") return probeOutput;
        const error = new Error("ffmpeg missing") as NodeJS.ErrnoException;
        error.code = "ENOENT";
        throw error;
      }, []),
    );

    assert.equal(result.capability, "PARTIAL");
    assert.equal(result.qualityMetrics.codec, "h264");
    assert.equal(result.qualityMetrics.keyframesExtracted, 0);
    assert.deepEqual(result.artifactKeys, []);
  });

  test("does not re-run preparation for an already waiting contribution", () => {
    const processedAt = new Date();
    assert.equal(isStreetviewContributionCpuPrepared("WAITING_FOR_GPU", processedAt), true);
    assert.equal(isStreetviewContributionCpuPrepared("WAITING_FOR_RECONSTRUCTION", processedAt), true);
    assert.equal(isStreetviewContributionCpuPrepared("PROCESSING", processedAt), false);
    assert.equal(isStreetviewContributionCpuPrepared("WAITING_FOR_GPU", null), false);
  });

  test("maps engine availability to explicit waiting states", () => {
    assert.equal(resolveStreetviewPreparationWaitingState({ status: "WAITING_FOR_GPU" }), "WAITING_FOR_GPU");
    assert.equal(resolveStreetviewPreparationWaitingState({ status: "UNAVAILABLE" }), "WAITING_FOR_RECONSTRUCTION");
    assert.equal(resolveStreetviewPreparationWaitingState({ status: "AVAILABLE" }), "WAITING_FOR_RECONSTRUCTION");
  });

  test("never reports reconstruction as available without a validated adapter", async () => {
    const engine = new CpuReconstructionEngine(async () => true);
    await withEnvironment("STREETVIEW_CPU_SFM_ENABLED", "true", async () => {
      const availability = await engine.getAvailability();
      assert.equal(availability.status, "UNAVAILABLE");
      const result = await engine.reconstruct({
        contributionId: "contribution-4",
        artifactKeys: [],
        qualityMetrics: {},
      });
      assert.equal(result.status, "UNAVAILABLE");
    });
  });

  test("returns only generated keyframes for deletion", () => {
    assert.deepEqual(
      getCpuPreparationArtifactKeys({
        cpuPreparation: {
          artifactKeys: [
            "contributions/c1/keyframes/frame-000001.jpg",
            42,
            "",
          ],
        },
      }),
      ["contributions/c1/keyframes/frame-000001.jpg"],
    );
    assert.deepEqual(getCpuPreparationArtifactKeys(null), []);
  });

  test("Phase 14 migration remains forward-only and is not wired to db:push", async () => {
    const migration = await readFile("migrations/0010_streetview_cpu_first.sql", "utf8");
    assert.match(migration, /ADD COLUMN IF NOT EXISTS/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS "streetview_scenes"/);
    const executableSql = migration
      .replace(/--.*$/gm, "")
      .replace(/\s+/g, " ");
    assert.doesNotMatch(executableSql, /(?:^|;)\s*(?:DROP|TRUNCATE|DELETE)\b/i);
  });
});