import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readStreetviewObject, writeStreetviewBuffer } from "./streetviewStorage";

const execFileAsync = promisify(execFile);

type VideoStream = {
  codec_name?: string;
  width?: number;
  height?: number;
  duration?: string;
  avg_frame_rate?: string;
};

type ProbeResult = {
  streams?: VideoStream[];
  format?: { duration?: string; format_name?: string };
};

export type StreetviewCpuPreparationResult = {
  capability: "READY" | "PARTIAL" | "UNAVAILABLE";
  qualityMetrics: Record<string, unknown>;
  artifactKeys: string[];
  message: string;
};

function parsePositiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseFrameRate(value: unknown): number | null {
  if (typeof value !== "string" || !value) return null;
  const [numerator, denominator] = value.split("/").map(Number);
  if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0) {
    return numerator / denominator;
  }
  return parsePositiveNumber(value);
}

async function runCommand(command: string, args: string[]): Promise<string> {
  const result = await execFileAsync(command, args, {
    maxBuffer: 4 * 1024 * 1024,
  });
  return result.stdout;
}

type RunCommand = (command: string, args: string[]) => Promise<string>;

export type StreetviewCpuPreparationDependencies = {
  readObject?: (key: string) => Promise<Buffer>;
  writeBuffer?: (key: string, content: Buffer) => Promise<void>;
  runCommand?: RunCommand;
  createTempRoot?: () => Promise<string>;
};

async function probeVideo(inputPath: string): Promise<{
  probe: ProbeResult;
  stream: VideoStream | undefined;
}> {
  const output = await runCommand("ffprobe", [
    "-v",
    "error",
    "-show_streams",
    "-show_format",
    "-of",
    "json",
    inputPath,
  ]);
  const probe = JSON.parse(output) as ProbeResult;
  return {
    probe,
    stream: probe.streams?.find((candidate) => candidate.width && candidate.height),
  };
}

function keyframeStorageKey(contributionId: string, fileName: string): string {
  return `contributions/${contributionId}/keyframes/${fileName}`;
}

export async function runStreetviewCpuPreparation(
  contributionId: string,
  storageKey: string,
  dependencies: StreetviewCpuPreparationDependencies = {},
): Promise<StreetviewCpuPreparationResult> {
  const readObject = dependencies.readObject ?? readStreetviewObject;
  const writeBuffer = dependencies.writeBuffer ?? writeStreetviewBuffer;
  const executeCommand = dependencies.runCommand ?? runCommand;
  const createTempRoot = dependencies.createTempRoot ??
    (() => mkdtemp(path.join(os.tmpdir(), "streetview-cpu-")));
  const tempRoot = await createTempRoot();
  const inputPath = path.join(tempRoot, "source-video");
  const framesPath = path.join(tempRoot, "frames");
  const artifactKeys: string[] = [];

  try {
    const source = await readObject(storageKey);
    await writeFile(inputPath, source, { flag: "wx" });

    let probe: ProbeResult;
    let stream: VideoStream | undefined;
    try {
      ({ probe, stream } = await probeVideo(inputPath, executeCommand));
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        return {
          capability: "UNAVAILABLE",
          qualityMetrics: { tool: "ffprobe", available: false },
          artifactKeys,
          message: "Validation terminée, mais ffprobe n'est pas disponible sur ce worker.",
        };
      }
      throw error;
    }

    const durationSeconds = parsePositiveNumber(stream?.duration) ??
      parsePositiveNumber(probe.format?.duration);
    const width = Number.isInteger(stream?.width) ? stream?.width : null;
    const height = Number.isInteger(stream?.height) ? stream?.height : null;
    const frameRate = parseFrameRate(stream?.avg_frame_rate);
    const qualityMetrics: Record<string, unknown> = {
      tool: "ffprobe",
      format: probe.format?.format_name || null,
      codec: stream?.codec_name || null,
      durationSeconds,
      width,
      height,
      frameRate,
      keyframesRequested: false,
      keyframesExtracted: 0,
    };

    if (process.env.STREETVIEW_CPU_KEYFRAMES_ENABLED === "false") {
      return {
        capability: "PARTIAL",
        qualityMetrics,
        artifactKeys,
        message: "Métadonnées CPU extraites. L'extraction des keyframes est désactivée.",
      };
    }

    await rm(framesPath, { recursive: true, force: true });
    const fpsValue = Math.min(
      2,
      Math.max(0.25, Number(process.env.STREETVIEW_CPU_KEYFRAME_FPS) || 1),
    );
    const maxFrames = Math.min(
      300,
      Math.max(1, Math.floor(Number(process.env.STREETVIEW_CPU_MAX_KEYFRAMES) || 120)),
    );
    await mkdir(framesPath, { recursive: true });

    try {
      await executeCommand("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        inputPath,
        "-vf",
        `fps=${fpsValue},scale=1280:-2`,
        "-frames:v",
        String(maxFrames),
        "-q:v",
        "4",
        path.join(framesPath, "frame-%06d.jpg"),
      ]);
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        return {
          capability: "PARTIAL",
          qualityMetrics,
          artifactKeys,
          message: "Métadonnées CPU extraites, mais ffmpeg n'est pas disponible pour les keyframes.",
        };
      }
      throw error;
    }

    const frameFiles = (await readdir(framesPath))
      .filter((fileName) => /^frame-\d{6}\.jpg$/.test(fileName))
      .sort();
    for (const frameFile of frameFiles) {
      const frame = await readFile(path.join(framesPath, frameFile));
      const key = keyframeStorageKey(contributionId, frameFile);
      await writeBuffer(key, frame);
      artifactKeys.push(key);
    }

    qualityMetrics.keyframesRequested = true;
    qualityMetrics.keyframesExtracted = artifactKeys.length;
    qualityMetrics.keyframeFps = fpsValue;
    qualityMetrics.keyframeLimit = maxFrames;

    return {
      capability: artifactKeys.length > 0 ? "READY" : "PARTIAL",
      qualityMetrics,
      artifactKeys,
      message: artifactKeys.length > 0
        ? `${artifactKeys.length} keyframes extraites sur CPU. Reconstruction 3D non exécutée.`
        : "Métadonnées CPU extraites, mais aucune keyframe exploitable n'a été produite.",
    };
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}