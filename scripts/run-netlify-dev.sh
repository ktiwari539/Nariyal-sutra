#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export npm_config_cache="${npm_config_cache:-/tmp/nariyal-npm-cache}"

node scripts/prepare-netlify-dev.mjs

exec npx --yes netlify-cli@latest dev \
  --context dev \
  --no-open
