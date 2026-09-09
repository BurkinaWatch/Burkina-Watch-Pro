#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT_ROOT = resolve(
  process.argv[2] ?? join(SCRIPT_DIR, "runs", "phase7c-synthetic"),
);
const SVG_DIR = join(OUTPUT_ROOT, "frames-svg");
const PNG_DIR = join(OUTPUT_ROOT, "frames-png");
const WIDTH = 640;
const HEIGHT = 360;
const FPS = 24;
const DURATION_SECONDS = 6;
const FRAME_COUNT = FPS * DURATION_SECONDS;
const FX = 520;
const FY = 520;

function ensureFreshOutput() {
  if (existsSync(OUTPUT_ROOT) && readdirSync(OUTPUT_ROOT).length > 0) {
    throw new Error(`Output directory is not empty: ${OUTPUT_ROOT}`);
  }
  mkdirSync(SVG_DIR, { recursive: true });
  mkdirSync(PNG_DIR, { recursive: true });
}

function project(point, camera) {
  const dx = point.x - camera.x;
  const dy = point.y - camera.y;
  const dz = point.z - camera.z;
  const sinYaw = Math.sin(camera.yaw);
  const cosYaw = Math.cos(camera.yaw);
  const depth = dx * sinYaw + dy * cosYaw;
  const horizontal = dx * cosYaw - dy * sinYaw;

  if (depth <= 0.25) return null;
  return {
    x: WIDTH / 2 + (FX * horizontal) / depth,
    y: HEIGHT / 2 - (FY * dz) / depth,
    depth,
  };
}

function polygon(points, fill, stroke = "#18283b", opacity = 1) {
  const projected = points.map((point) => project(point, CURRENT_CAMERA));
  if (projected.some((point) => point === null)) return null;
  return {
    depth: projected.reduce((sum, point) => sum + point.depth, 0) / projected.length,
    svg: `<polygon points="${projected.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="1" opacity="${opacity}"/>`,
  };
}

function line(a, b, stroke = "#38536d", width = 1, opacity = 0.55) {
  const start = project(a, CURRENT_CAMERA);
  const end = project(b, CURRENT_CAMERA);
  if (!start || !end) return null;
  return {
    depth: (start.depth + end.depth) / 2,
    svg: `<line x1="${start.x.toFixed(2)}" y1="${start.y.toFixed(2)}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}"/>`,
  };
}

function box(x, y, z, width, depth, height, colors) {
  const a = { x, y, z };
  const b = { x: x + width, y, z };
  const c = { x: x + width, y: y + depth, z };
  const d = { x, y: y + depth, z };
  const at = { x, y, z: z + height };
  const bt = { x: x + width, y, z: z + height };
  const ct = { x: x + width, y: y + depth, z: z + height };
  const dt = { x, y: y + depth, z: z + height };

  return [
    polygon([a, b, bt, at], colors.front),
    polygon([b, c, ct, bt], colors.side),
    polygon([c, d, dt, ct], colors.back),
    polygon([d, a, at, dt], colors.other),
    polygon([at, bt, ct, dt], colors.roof),
  ].filter(Boolean);
}

function windows(x, y, z, width, height, columns, rows, color) {
  const result = [];
  const gapX = width / (columns + 1);
  const gapZ = height / (rows + 1);
  for (let column = 1; column <= columns; column += 1) {
    for (let row = 1; row <= rows; row += 1) {
      const centerX = x + gapX * column;
      const centerZ = z + gapZ * row;
      const windowWidth = Math.min(0.42, gapX * 0.52);
      const windowHeight = Math.min(0.48, gapZ * 0.52);
      const points = [
        { x: centerX - windowWidth / 2, y: y - 0.012, z: centerZ - windowHeight / 2 },
        { x: centerX + windowWidth / 2, y: y - 0.012, z: centerZ - windowHeight / 2 },
        { x: centerX + windowWidth / 2, y: y - 0.012, z: centerZ + windowHeight / 2 },
        { x: centerX - windowWidth / 2, y: y - 0.012, z: centerZ + windowHeight / 2 },
      ];
      const shape = polygon(points, color, "#132236", 0.95);
      if (shape) result.push(shape);
    }
  }
  return result;
}

function sceneShapes(camera) {
  CURRENT_CAMERA = camera;
  const shapes = [];

  shapes.push(polygon(
    [{ x: -10, y: 2, z: 0 }, { x: 10, y: 2, z: 0 }, { x: 10, y: 28, z: 0 }, { x: -10, y: 28, z: 0 }],
    "#b99368",
    "#806447",
    1,
  ));

  for (let gridX = -10; gridX <= 10; gridX += 1) {
    shapes.push(line({ x: gridX, y: 2, z: 0.008 }, { x: gridX, y: 28, z: 0.008 }, "#6f604d", 0.7, 0.6));
  }
  for (let gridY = 3; gridY <= 28; gridY += 1) {
    shapes.push(line({ x: -10, y: gridY, z: 0.01 }, { x: 10, y: gridY, z: 0.01 }, "#6f604d", 0.7, 0.6));
  }

  const buildings = [
    [-5.8, 8.5, 0, 2.7, 2.3, 3.4, ["#c86d46", "#a94f39", "#d88d55"]],
    [-2.7, 12.5, 0, 2.2, 2.1, 2.8, ["#4f8290", "#396675", "#6aa2a7"]],
    [2.5, 9.5, 0, 2.8, 2.4, 3.8, ["#d1a44e", "#ae7738", "#e2c16a"]],
    [5.0, 15.0, 0, 2.5, 2.3, 3.0, ["#7d6aa5", "#5c4d87", "#a088c4"]],
    [-5.0, 18.0, 0, 3.8, 2.6, 4.3, ["#6c9b75", "#4c765b", "#9bbd83"]],
    [2.0, 20.0, 0, 4.0, 2.8, 4.8, ["#bf625b", "#934743", "#db8a6d"]],
  ];

  for (const [x, y, z, width, depth, height, palette] of buildings) {
    shapes.push(...box(x, y, z, width, depth, height, {
      front: palette[0],
      side: palette[1],
      back: palette[1],
      other: palette[2],
      roof: palette[2],
    }));
    shapes.push(...windows(x, y, z, width, height, 3, 3, "#e8cf82"));
  }

  shapes.push(...box(-1.0, 6.2, 0, 1.0, 1.0, 1.2, {
    front: "#406a58",
    side: "#2d5145",
    back: "#2d5145",
    other: "#5c8a66",
    roof: "#6e9b70",
  }));
  shapes.push(...box(0.45, 7.2, 0, 0.85, 0.85, 0.9, {
    front: "#d07b45",
    side: "#a95a37",
    back: "#a95a37",
    other: "#e39a59",
    roof: "#e8b36e",
  }));

  return shapes.filter(Boolean).sort((first, second) => second.depth - first.depth);
}

let CURRENT_CAMERA = null;

function renderFrame(frameIndex) {
  const progress = frameIndex / (FRAME_COUNT - 1);
  const camera = {
    x: -2.4 + progress * 4.8,
    y: 3.2 + progress * 3.4,
    z: 1.65,
    yaw: -0.035 + progress * 0.07,
  };
  const shapes = sceneShapes(camera);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#9ed4e5"/>
      <stop offset="100%" stop-color="#f0c889"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>
  <circle cx="535" cy="72" r="30" fill="#ffe4a1" opacity="0.9"/>
  ${shapes.map((shape) => shape.svg).join("\n  ")}
  <text x="18" y="30" fill="#173044" font-family="sans-serif" font-size="14" opacity="0.82">PHASE 7C CONTROLLED SYNTHETIC SCENE</text>
</svg>
`;
  const svgPath = join(SVG_DIR, `frame_${String(frameIndex + 1).padStart(6, "0")}.svg`);
  const pngPath = join(PNG_DIR, `frame_${String(frameIndex + 1).padStart(6, "0")}.png`);
  writeFileSync(svgPath, svg, "utf8");
  execFileSync("magick", [svgPath, pngPath], { stdio: "ignore" });
  return camera;
}

function main() {
  ensureFreshOutput();
  if (!process.env.PATH?.includes("/bin")) {
    throw new Error("PATH does not contain standard executable directories.");
  }

  const trajectory = [];
  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    trajectory.push({
      frame: frame + 1,
      timeSeconds: frame / FPS,
      camera: renderFrame(frame),
    });
  }

  const videoPath = join(OUTPUT_ROOT, "synthetic-streetview-phase7c.mp4");
  execFileSync("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-framerate",
    String(FPS),
    "-i",
    join(PNG_DIR, "frame_%06d.png"),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    videoPath,
  ], { stdio: "inherit" });

  const metadata = {
    type: "controlled_synthetic_3d_scene",
    warning: "Synthetic pipeline input only. Not evidence of real-world reconstruction quality.",
    generatedBy: "experiments/streetview-3d/generate-controlled-scene.mjs",
    scene: {
      geometry: "Static colored boxes, facades, windows, ground grid, and fixed props rendered with perspective projection.",
      movingObjects: false,
      lightingChanges: false,
      depth: "Known synthetic 3D coordinates.",
    },
    video: {
      path: "synthetic-streetview-phase7c.mp4",
      width: WIDTH,
      height: HEIGHT,
      fps: FPS,
      durationSeconds: DURATION_SECONDS,
      frameCount: FRAME_COUNT,
      codec: "libx264",
      pixelFormat: "yuv420p",
    },
    cameraTrajectory: {
      coordinateSystem: "Synthetic world coordinates: x lateral, y forward, z up; units are arbitrary.",
      known: true,
      frames: trajectory,
    },
    notValidatedYet: ["COLMAP/SfM", "MVS", "3D Gaussian Splatting", "real-world GPS georeferencing"],
  };
  writeFileSync(join(OUTPUT_ROOT, "synthetic-metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  writeFileSync(join(OUTPUT_ROOT, "README.md"), `# Phase 7C synthetic input

This dataset is a deterministic, controlled synthetic scene rendered frame by
frame from fixed 3D coordinates. It is intended only to validate the mechanics
of the isolated reconstruction runner.

- Video: synthetic-streetview-phase7c.mp4
- Resolution: ${WIDTH}x${HEIGHT}
- FPS: ${FPS}
- Duration: ${DURATION_SECONDS}s
- Frames: ${FRAME_COUNT}
- Camera trajectory: known and stored in synthetic-metadata.json
- Real-world validity: none; this is not a Burkina Faso street capture

COLMAP, MVS, and Gaussian Splatting were not run during generation.
`, "utf8");

  console.log(`Synthetic dataset written to ${OUTPUT_ROOT}`);
  console.log(`Video: ${videoPath}`);
  console.log(`Frames: ${FRAME_COUNT} at ${FPS} FPS`);
}

main();