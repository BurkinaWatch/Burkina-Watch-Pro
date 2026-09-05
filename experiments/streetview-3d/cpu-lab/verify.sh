#!/usr/bin/env bash
set -euo pipefail

INPUT_DIR="${INPUT_DIR:-/lab/input}"
OUTPUT_DIR="${OUTPUT_DIR:-/lab/output}"
THREADS="${COLMAP_THREADS:-4}"
RUN_SFM="${RUN_SFM:-false}"

mkdir -p "$OUTPUT_DIR/logs" "$OUTPUT_DIR/database" "$OUTPUT_DIR/sparse"

log() {
  printf '[phase16] %s\n' "$*"
}

require_command() {
  local command_name="$1"
  command -v "$command_name" >/dev/null 2>&1 || {
    printf '[phase16] missing command: %s\n' "$command_name" >&2
    exit 1
  }
}

log "CPU laboratory preflight"
uname -a | tee "$OUTPUT_DIR/logs/uname.txt"
uname -m | tee "$OUTPUT_DIR/logs/architecture.txt"
lscpu | tee "$OUTPUT_DIR/logs/lscpu.txt"
free -h | tee "$OUTPUT_DIR/logs/memory.txt"
df -h | tee "$OUTPUT_DIR/logs/disk.txt"

for command_name in colmap ffmpeg ffprobe identify python3 sqlite3 time; do
  require_command "$command_name"
done

docker --version 2>&1 | tee "$OUTPUT_DIR/logs/docker.txt" || true
python3 --version 2>&1 | tee "$OUTPUT_DIR/logs/python.txt"
ffmpeg -version 2>&1 | head -1 | tee "$OUTPUT_DIR/logs/ffmpeg.txt"
ffprobe -version 2>&1 | head -1 | tee "$OUTPUT_DIR/logs/ffprobe.txt"
colmap -h 2>&1 | tee "$OUTPUT_DIR/logs/colmap-help.txt" >/dev/null
colmap help 2>&1 | head -20 | tee "$OUTPUT_DIR/logs/colmap-help-command.txt" || true

if [ ! -d "$INPUT_DIR" ]; then
  printf '[phase16] input directory does not exist: %s\n' "$INPUT_DIR" >&2
  exit 1
fi

mapfile -t image_files < <(find "$INPUT_DIR" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' \) | sort)
if [ "${#image_files[@]}" -ne 12 ]; then
  printf '[phase16] expected exactly 12 JPEG images, found %s\n' "${#image_files[@]}" >&2
  exit 1
fi

identify -format '%f %m %wx%h\n' "${image_files[@]}" | tee "$OUTPUT_DIR/logs/input-images.txt"
if identify -format '%m %wx%h\n' "${image_files[@]}" | grep -Ev '^JPEG 640x360$' >/dev/null; then
  printf '[phase16] input contains an invalid format or dimension\n' >&2
  exit 1
fi

log "Preflight PASS: COLMAP is executable and the input contains 12 JPEG images."

if [ "$RUN_SFM" != "true" ]; then
  log "SfM not requested. Set RUN_SFM=true only after reviewing this preflight."
  exit 0
fi

DATABASE="$OUTPUT_DIR/database/database.db"
SPARSE="$OUTPUT_DIR/sparse"
rm -f "$DATABASE"
rm -rf "$SPARSE"
mkdir -p "$SPARSE"

log "Running COLMAP feature extraction with ${THREADS} CPU threads."
/usr/bin/time -v -o "$OUTPUT_DIR/logs/feature-extraction.time.txt" \
  colmap feature_extractor \
    --database_path "$DATABASE" \
    --image_path "$INPUT_DIR" \
    --ImageReader.single_camera 1 \
    --SiftExtraction.use_gpu 0 \
    --SiftExtraction.num_threads "$THREADS" \
    >"$OUTPUT_DIR/logs/feature-extraction.stdout.txt" \
    2>"$OUTPUT_DIR/logs/feature-extraction.stderr.txt"

log "Running exhaustive CPU matching."
/usr/bin/time -v -o "$OUTPUT_DIR/logs/matching.time.txt" \
  colmap exhaustive_matcher \
    --database_path "$DATABASE" \
    --SiftMatching.use_gpu 0 \
    --SiftMatching.num_threads "$THREADS" \
    >"$OUTPUT_DIR/logs/matching.stdout.txt" \
    2>"$OUTPUT_DIR/logs/matching.stderr.txt"

log "Running sparse mapper."
/usr/bin/time -v -o "$OUTPUT_DIR/logs/mapper.time.txt" \
  colmap mapper \
    --database_path "$DATABASE" \
    --image_path "$INPUT_DIR" \
    --output_path "$SPARSE" \
    --Mapper.num_threads "$THREADS" \
    >"$OUTPUT_DIR/logs/mapper.stdout.txt" \
    2>"$OUTPUT_DIR/logs/mapper.stderr.txt"

mapfile -t sparse_models < <(find "$SPARSE" -mindepth 1 -maxdepth 1 -type d | sort)
if [ "${#sparse_models[@]}" -eq 0 ]; then
  printf '[phase16] SFM_FAILED: COLMAP produced no sparse model directory\n' >&2
  exit 1
fi

MODEL_DIR="${sparse_models[0]}"
for model_file in cameras.bin images.bin points3D.bin; do
  if [ ! -s "$MODEL_DIR/$model_file" ]; then
    printf '[phase16] SFM_FAILED: missing or empty %s\n' "$MODEL_DIR/$model_file" >&2
    exit 1
  fi
done

colmap model_analyzer --path "$MODEL_DIR" \
  >"$OUTPUT_DIR/logs/model-analyzer.txt" \
  2>"$OUTPUT_DIR/logs/model-analyzer.stderr.txt" || true

cat >"$OUTPUT_DIR/metrics.json" <<JSON
{
  "status": "SPARSE_MODEL_CREATED_REQUIRES_REPORT_REVIEW",
  "inputImages": ${#image_files[@]},
  "threads": ${THREADS},
  "featureExtraction": "SEE_LOGS",
  "matching": "SEE_LOGS",
  "mapper": "SEE_LOGS",
  "sparseModel": "${MODEL_DIR}",
  "registeredImages": "SEE_model-analyzer.txt",
  "cameras": "SEE_model-analyzer.txt",
  "points3D": "SEE_model-analyzer.txt",
  "observations": "SEE_model-analyzer.txt",
  "reprojectionError": "SEE_model-analyzer.txt"
}
JSON

log "Sparse model files validated. Inspect model-analyzer.txt before reporting metrics."