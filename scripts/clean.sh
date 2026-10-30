#!/usr/bin/env bash
#
# Removes every build artefact and dependency tree in the lab.
#
#   ./scripts/clean.sh              node_modules, dist, coverage, .angular, .yarn/cache
#   ./scripts/clean.sh --locks      also delete lockfiles (for a true cold benchmark)
#   ./scripts/clean.sh --caches     also clear each tool's GLOBAL cache (affects other projects)
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCKS=0
CACHES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --locks)  LOCKS=1; shift ;;
    --caches) CACHES=1; shift ;;
    -h|--help) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

FREED_BEFORE=$(du -sm "$ROOT" 2>/dev/null | awk '{print $1}')

for d in node_modules dist coverage .angular out-tsc; do
  find "$ROOT/projects" -maxdepth 2 -name "$d" -type d -prune -print -exec rm -rf {} + 2>/dev/null || true
done

# Yarn's local cache and install state
rm -rf "$ROOT/projects/02-yarn/.yarn/cache" "$ROOT/projects/02-yarn/.yarn/install-state.gz" 2>/dev/null || true

if [[ $LOCKS -eq 1 ]]; then
  echo "removing lockfiles"
  rm -f "$ROOT/projects/01-npm/package-lock.json" \
        "$ROOT/projects/02-yarn/yarn.lock" \
        "$ROOT/projects/03-pnpm/pnpm-lock.yaml" \
        "$ROOT/projects/04-bun/bun.lock" \
        "$ROOT/projects/05-deno/deno.lock"
  echo "note: restore them with 'git checkout' if this is a git repo, or just reinstall"
fi

if [[ $CACHES -eq 1 ]]; then
  echo "clearing global caches (this affects every project on this machine)"
  command -v npm  >/dev/null && npm cache clean --force  >/dev/null 2>&1 || true
  command -v yarn >/dev/null && yarn cache clean --all   >/dev/null 2>&1 || true
  command -v pnpm >/dev/null && pnpm store prune         >/dev/null 2>&1 || true
  command -v bun  >/dev/null && bun pm cache rm          >/dev/null 2>&1 || true
  command -v deno >/dev/null && deno clean               >/dev/null 2>&1 || true
fi

FREED_AFTER=$(du -sm "$ROOT" 2>/dev/null | awk '{print $1}')
echo "clean: ${FREED_BEFORE} MB → ${FREED_AFTER} MB"
