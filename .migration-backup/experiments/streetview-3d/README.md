# BurkinaWatch — Phase 7 experimental StreetView 3D runner

This directory is an isolated laboratory runner. It is not part of the
Express API, the React frontend, the StreetView contribution queue, the
production worker, or the database.

## Current scope

The runner currently performs only the first verifiable stages:

1. inspect a real video with `ffprobe`;
2. record the input and environment metadata;
3. extract a parametrized set of JPEG frames with `ffmpeg`;
4. write an experiment report.

It deliberately does **not**:

- write to PostgreSQL;
- access Object Storage;
- modify the application workflow;
- publish a scene;
- fabricate a point cloud, mesh, camera pose, or Gaussian Splat;
- run a reconstruction when COLMAP is unavailable.

The output status is explicit:

```text
FRAMES_EXTRACTED_SFM_NOT_RUN
```

## Prerequisites

The current development environment provides `ffmpeg` and `ffprobe`.
COLMAP is not currently installed, and no GPU is assumed.

The runner therefore prepares the reproducible input stage without claiming
that SfM, MVS, or Gaussian Splatting succeeded.

## Usage

From the repository root:

```bash
node experiments/streetview-3d/runner.mjs --input /path/to/test-video.mp4
```

Optional parameters:

```bash
node experiments/streetview-3d/runner.mjs \
  --input /path/to/test-video.mp4 \
  --sample-fps 2 \
  --max-width 1600 \
  --output experiments/streetview-3d/runs/my-first-capture
```

The default output is created under:

```text
experiments/streetview-3d/runs/<timestamp>/
```

Each run contains:

```text
experiment.json
ffprobe.json
frames/frame_*.jpg
```

The `runs/` directory is ignored by Git.

## Next isolated stage

After a real video is supplied and a computation environment is selected, a
separate SfM adapter can consume `frames/`. It must record the actual COLMAP
version, command, metrics, errors, and outputs. It must not be imported by the
main application.

MVS and 3D Gaussian Splatting remain subsequent stages. They must only run
after the sparse reconstruction and camera poses have been inspected.