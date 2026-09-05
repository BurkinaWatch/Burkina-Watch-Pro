#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_ROOT = join(SCRIPT_DIR, "runs");

function printUsage() {
  console.log(`
Usage:
  node experiments/streetview-3d/runner.mjs --input <video> [options]

Options:
  --input <path>       Source video. Required.
  --output <path>      Run directory. Defaults to experiments/streetview-3d/runs/<timestamp>.
  --sample-fps <n>     Extraction rate. Defaults to 2.
  --max-width <n>      Optional maximum output width. Defaults to 1600.
  --run-sfm            Only preflight COLMAP; does not run reconstruction yet.
  --force              Allow an existing empty output directory.
  --help               Show this help.

The runner is intentionally isolated from the application. It never writes to
the API, PostgreSQL, Object Storage, or the production StreetView workflow.
`);
}

function parseArgs(argv) {
  const options = {
    input: null,
    output: null,
    sampleFps: 2,
    maxWidth: 1600,
    runSfm: false,
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      printUsage();
      process.exit(0);
    }
    if (argument === "--run-sfm") {
      options.runSfm = true;
      continue;
    }
    if (argument === "--force") {
      options.force = true;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for ${argument}.`);
    }

    if (argument === "--input") options.input = next;
    else if (argument === "--output") options.output = next;
    else if (argument === "--sample-fps") options.sampleFps = Number(next);
    else if (argument === "--max-width") options.maxWidth = Number(next);
    else throw new Error(`Unknown option: ${argument}`);
    index += 1;
  }

  if (!options.input) throw new Error("--input is required.");
  if (!Number.isFinite(options.sampleFps) || options.sampleFps <= 0) {
    throw new Error("--sample-fps must be a positive number.");
  }
  if (!Number.isInteger(options.maxWidth) || options.maxWidth <= 0) {
    throw new Error("--max-width must be a positive integer.");
  }
  return options;
}

function commandAvailable(command) {
  const result = spawnSync("sh", ["-c", `command -v ${command}`], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return result.status === 0 && result.stdout.trim().length > 0;
}

function commandVersion(command, args) {
  if (!commandAvailable(command)) return null;
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return `${result.stdout || ""}${result.stderr || ""}`.trim().split("\n")[0] || null;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const details = options.capture ? `${result.stdout || ""}\n${result.stderr || ""}` : "";
    throw new Error(`${command} exited with status ${result.status}.${details ? `\n${details.trim()}` : ""}`);
  }
  return result;
}

function probeVideo(inputPath) {
  const result = run(
    "ffprobe",
    [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      inputPath,
    ],
    { capture: true },
  );

  let probe;
  try {
    probe = JSON.parse(result.stdout);
  } catch {
    throw new Error("ffprobe returned invalid JSON.");
  }

  const videoStream = probe.streams?.find((stream) => stream.codec_type === "video");
  if (!videoStream) throw new Error("The input does not contain a video stream.");

  return {
    format: probe.format ?? {},
    video: videoStream,
    source: {
      path: inputPath,
      filename: basename(inputPath),
      extension: extname(inputPath).toLowerCase(),
      sizeBytes: statSync(inputPath).size,
    },
  };
}

function parseFps(rate) {
  if (!rate || rate === "0/0") return null;
  const [numerator, denominator] = String(rate).split("/").map(Number);
  if (!denominator || !Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  return numerator / denominator;
}

function environmentReport() {
  const nvidiaVersion = commandVersion("nvidia-smi", ["--query-gpu=name,memory.total", "--format=csv,noheader"]);
  return {
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    ffmpeg: commandVersion("ffmpeg", ["-version"]),
    ffprobe: commandVersion("ffprobe", ["-version"]),
    colmapAvailable: commandAvailable("colmap"),
    colmap: commandVersion("colmap", ["-h"]),
    gpu: nvidiaVersion,
    workingDirectory: process.cwd(),
  };
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureOutputDirectory(outputPath, force) {
  if (existsSync(outputPath)) {
    const entries = readdirSync(outputPath);
    if (entries.length > 0 && !force) {
      throw new Error(`Output directory is not empty: ${outputPath}. Use another path or --force.`);
    }
  } else {
    mkdirSync(outputPath, { recursive: true });
  }
}

function extractFrames(inputPath, outputPath, sampleFps, maxWidth) {
  const framesDirectory = join(outputPath, "frames");
  mkdirSync(framesDirectory, { recursive: true });

  const filter = `fps=${sampleFps},scale=min\\\\(${maxWidth}\\\\,iw\\\\):-2:force_original_aspect_ratio=decrease`;
  run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    inputPath,
    "-vf",
    filter,
    "-q:v",
    "2",
    join(framesDirectory, "frame_%06d.jpg"),
  ]);

  return {
    directory: framesDirectory,
    files: readdirSync(framesDirectory)
      .filter((file) => file.endsWith(".jpg"))
      .sort(),
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const inputPath = resolve(options.input);

  if (!existsSync(inputPath) || !statSync(inputPath).isFile()) {
    throw new Error(`Input video does not exist or is not a file: ${inputPath}`);
  }
  if (!commandAvailable("ffprobe") || !commandAvailable("ffmpeg")) {
    throw new Error("The experimental runner requires both ffprobe and ffmpeg.");
  }

  const runName = `run-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const outputPath = resolve(options.output ?? join(DEFAULT_OUTPUT_ROOT, runName));
  ensureOutputDirectory(outputPath, options.force);

  const environment = environmentReport();
  const probe = probeVideo(inputPath);
  const extraction = extractFrames(inputPath, outputPath, options.sampleFps, options.maxWidth);

  const report = {
    experiment: "burkinawatch-streetview-3d-phase7",
    status: "FRAMES_EXTRACTED_SFM_NOT_RUN",
    generatedAt: new Date().toISOString(),
    isolation: {
      directory: relative(process.cwd(), outputPath) || ".",
      applicationTouched: false,
      databaseTouched: false,
      objectStorageTouched: false,
      productionWorkflowTouched: false,
    },
    input: {
      ...probe.source,
      durationSeconds: Number(probe.format.duration ?? probe.video.duration ?? 0) || null,
      formatName: probe.format.format_name ?? null,
      codec: probe.video.codec_name ?? null,
      pixelFormat: probe.video.pix_fmt ?? null,
      width: probe.video.width ?? null,
      height: probe.video.height ?? null,
      fps: parseFps(probe.video.r_frame_rate ?? probe.video.avg_frame_rate),
      hasAudio: Boolean(probe.streams?.some((stream) => stream.codec_type === "audio")),
    },
    extraction: {
      sampleFps: options.sampleFps,
      maxWidth: options.maxWidth,
      frameCount: extraction.files.length,
      firstFrame: extraction.files[0] ?? null,
      lastFrame: extraction.files.at(-1) ?? null,
      directory: relative(outputPath, extraction.directory),
    },
    environment,
    nextStage: options.runSfm
      ? {
          requested: true,
          status: environment.colmapAvailable ? "COLMAP_AVAILABLE_BUT_NOT_EXECUTED_BY_THIS_RUNNER" : "BLOCKED_COLMAP_NOT_INSTALLED",
        }
      : {
          requested: false,
          status: "NOT_REQUESTED",
        },
  };

  writeJson(join(outputPath, "experiment.json"), report);
  writeJson(join(outputPath, "ffprobe.json"), probe);

  console.log(`Experiment output: ${outputPath}`);
  console.log(`Extracted frames: ${extraction.files.length}`);
  console.log("Status: FRAMES_EXTRACTED_SFM_NOT_RUN");
  if (!environment.colmapAvailable) {
    console.log("COLMAP: unavailable; no SfM or 3D reconstruction was attempted.");
  }
}

try {
  main();
} catch (error) {
  console.error(`Phase 7 runner error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}