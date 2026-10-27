#!/usr/bin/env bash
# Builds src/solver/dds/dds-wasm.mjs: the DDS double-dummy solver (Bo Haglund, Soren Hein and
# contributors, Apache-2.0) compiled to WebAssembly with Emscripten, plus native/dds/bridge.cpp.
#
#   pnpm build:dds      needs git and Docker; the output is committed, so only run it to rebuild
#
# The DDS source is fetched at a pinned commit into .cache/dds. The output is one ES module with
# the wasm embedded (SINGLE_FILE), single-threaded, so it loads the same way in Node, Vite and a
# Web Worker and needs no SharedArrayBuffer / cross-origin isolation.
set -euo pipefail

DDS_REPO=https://github.com/dds-bridge/dds.git
DDS_COMMIT=cd953c24a68cb8117bff4fcfd1807ad18a197f6c # tag v3.1.1
EMSDK_IMAGE=emscripten/emsdk:6.0.12

root="$(cd "$(dirname "$0")/.." && pwd)"
src="$root/.cache/dds"
out="$root/src/solver/dds"

if [ "$(git -C "$src" rev-parse HEAD 2>/dev/null || true)" != "$DDS_COMMIT" ]; then
  rm -rf "$src"
  mkdir -p "$src"
  git -C "$src" init --quiet
  git -C "$src" fetch --quiet --depth 1 "$DDS_REPO" "$DDS_COMMIT"
  git -C "$src" -c advice.detachedHead=false checkout --quiet FETCH_HEAD
fi

# Docker Desktop on Windows (Git Bash) needs a Windows path for the mount and no MSYS path rewriting.
host_root="$root"
if command -v cygpath >/dev/null 2>&1; then host_root="$(cygpath -m "$root")"; fi
export MSYS_NO_PATHCONV=1

docker run --rm -v "$host_root:/work" -w /work "$EMSDK_IMAGE" bash -euo pipefail -c '
  # DDS sources include their own headers both as <x> and as <dds/x>.
  mkdir -p /tmp/inc && ln -s /work/.cache/dds/library/src /tmp/inc/dds
  em++ -O3 -std=c++20 -fwasm-exceptions -sWASM_LEGACY_EXCEPTIONS=1 \
    -I.cache/dds/library/src -I/tmp/inc \
    $(find .cache/dds/library/src -name "*.cpp" | sort) native/dds/bridge.cpp \
    -sMODULARIZE=1 -sEXPORT_ES6=1 -sEXPORT_NAME=createDdsModule \
    -sSINGLE_FILE=1 -sENVIRONMENT=web,worker,node \
    -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=64MB -sSTACK_SIZE=8MB \
    -sEXPORTED_FUNCTIONS=_bt_solve,_bt_calc_table,_malloc,_free \
    -sEXPORTED_RUNTIME_METHODS=HEAP32 \
    -o src/solver/dds/dds-wasm.mjs
'

cp "$src/LICENSE" "$out/LICENSE-DDS"
echo "built $out/dds-wasm.mjs ($(wc -c <"$out/dds-wasm.mjs") bytes) from DDS $DDS_COMMIT"
