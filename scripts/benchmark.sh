#!/usr/bin/env bash
#
# Times install / build / test for each project in the lab.
#
#   ./scripts/benchmark.sh                  warm run (keeps lockfiles and caches)
#   ./scripts/benchmark.sh --cold           clears global caches and deletes lockfiles
#   ./scripts/benchmark.sh --only npm,pnpm  subset
#   ./scripts/benchmark.sh --runs 3         repeat installs, report the median
#   ./scripts/benchmark.sh --skip-build     install timings only
#
# Results are printed as a table and written to benchmark-results.csv.
#
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECTS_DIR="$ROOT/projects"
CSV="$ROOT/benchmark-results.csv"

COLD=0
RUNS=1
SKIP_BUILD=0
SKIP_TEST=0
ONLY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cold)       COLD=1; shift ;;
    --runs)       RUNS="$2"; shift 2 ;;
    --only)       ONLY="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --skip-test)  SKIP_TEST=1; shift ;;
    -h|--help)    sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)            echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

# name | folder | binary | install cmd | build cmd | test cmd | lockfile | cache-clear cmd
PROJECTS=(
  "npm|01-npm|npm|npm install|npm run build:dev|npm run test:ci|package-lock.json|npm cache clean --force"
  "yarn|02-yarn|yarn|yarn install|yarn build:dev|yarn test:ci|yarn.lock|yarn cache clean --all"
  "pnpm|03-pnpm|pnpm|pnpm install|pnpm build:dev|pnpm test:ci|pnpm-lock.yaml|pnpm store prune"
  "bun|04-bun|bun|bun install|bun run build:dev|bun run test:ci|bun.lock|bun pm cache rm"
  "deno|05-deno|deno|deno install|deno task build:dev|deno task test:ci|deno.lock|deno clean"
)

have () { command -v "$1" >/dev/null 2>&1; }

# Wall-clock seconds with 2 decimals, portable across macOS and Linux.
now () { python3 -c 'import time; print(f"{time.time():.4f}")' 2>/dev/null || date +%s; }

elapsed () { python3 -c "print(f'{$2 - $1:.2f}')" 2>/dev/null || echo "$(( ${2%.*} - ${1%.*} ))"; }

median () {
  python3 -c "
import sys, statistics
vals = [float(v) for v in sys.argv[1:] if v not in ('', 'skip', 'fail')]
print(f'{statistics.median(vals):.2f}' if vals else 'fail')
" "$@"
}

dir_size () {
  if [[ -d "$1" ]]; then du -sm "$1" 2>/dev/null | awk '{print $1}'; else echo 0; fi
}

# time_cmd <workdir> <command...>  -> prints seconds, or "fail"
time_cmd () {
  local wd="$1"; shift
  local start end
  start=$(now)
  if ( cd "$wd" && eval "$@" ) >/dev/null 2>&1; then
    end=$(now)
    elapsed "$start" "$end"
  else
    echo "fail"
  fi
}

printf '\n'
printf '  Angular Package Manager Lab — benchmark\n'
printf '  mode: %s   runs: %s\n' "$([[ $COLD -eq 1 ]] && echo cold || echo warm)" "$RUNS"
printf '  node: %s   os: %s\n' "$(node --version 2>/dev/null || echo 'not found')" "$(uname -srm)"
printf '\n'

echo "tool,version,install_s,node_modules_mb,build_s,test_s,mode,runs" > "$CSV"

ROWS=()

for entry in "${PROJECTS[@]}"; do
  IFS='|' read -r NAME FOLDER BIN INSTALL BUILD TEST LOCK CACHE_CLEAR <<< "$entry"

  if [[ -n "$ONLY" && ",$ONLY," != *",$NAME,"* ]]; then
    continue
  fi

  DIR="$PROJECTS_DIR/$FOLDER"
  [[ -d "$DIR" ]] || continue

  if ! have "$BIN"; then
    printf '  %-6s not installed — skipping\n' "$NAME"
    ROWS+=("$NAME|not installed|-|-|-|-")
    echo "$NAME,not installed,,,,,$([[ $COLD -eq 1 ]] && echo cold || echo warm),$RUNS" >> "$CSV"
    continue
  fi

  VERSION=$( ( cd "$DIR" && $BIN --version 2>/dev/null | head -1 ) || echo "?" )
  printf '  %-6s %s\n' "$NAME" "$VERSION"

  TIMES=()
  for ((i = 1; i <= RUNS; i++)); do
    rm -rf "$DIR/node_modules" "$DIR/dist" "$DIR/.angular" "$DIR/coverage"
    if [[ $COLD -eq 1 ]]; then
      rm -f "$DIR/$LOCK"
      ( cd "$DIR" && eval "$CACHE_CLEAR" ) >/dev/null 2>&1 || true
    fi
    printf '         install run %d/%d … ' "$i" "$RUNS"
    T=$(time_cmd "$DIR" "$INSTALL")
    printf '%s s\n' "$T"
    TIMES+=("$T")
  done

  INSTALL_S=$(median "${TIMES[@]}")
  SIZE_MB=$(dir_size "$DIR/node_modules")

  BUILD_S="skip"
  if [[ $SKIP_BUILD -eq 0 ]]; then
    printf '         build … '
    BUILD_S=$(time_cmd "$DIR" "$BUILD")
    printf '%s s\n' "$BUILD_S"
  fi

  TEST_S="skip"
  if [[ $SKIP_TEST -eq 0 ]]; then
    printf '         test  … '
    TEST_S=$(time_cmd "$DIR" "$TEST")
    printf '%s s\n' "$TEST_S"
  fi

  ROWS+=("$NAME|$VERSION|$INSTALL_S|$SIZE_MB|$BUILD_S|$TEST_S")
  echo "$NAME,$VERSION,$INSTALL_S,$SIZE_MB,$BUILD_S,$TEST_S,$([[ $COLD -eq 1 ]] && echo cold || echo warm),$RUNS" >> "$CSV"
done

printf '\n'
printf '  %-8s %-12s %12s %10s %10s %10s\n' "TOOL" "VERSION" "INSTALL (s)" "SIZE (MB)" "BUILD (s)" "TEST (s)"
printf '  %s\n' "------------------------------------------------------------------------"
for row in "${ROWS[@]}"; do
  IFS='|' read -r a b c d e f <<< "$row"
  printf '  %-8s %-12s %12s %10s %10s %10s\n' "$a" "$b" "$c" "$d" "$e" "$f"
done
printf '\n'
printf '  CSV written to %s\n' "$CSV"
printf '  Reminder: du-based sizes overcount pnpm hard links. See docs/BENCHMARKING.md.\n\n'
