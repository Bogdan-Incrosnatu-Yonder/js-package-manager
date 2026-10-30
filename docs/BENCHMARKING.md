# Benchmarking, honestly

Install-time benchmarks are easy to run and easy to get wrong. This page is
about getting numbers you'd be willing to defend.

## The automated route

```bash
./scripts/benchmark.sh              # warm: keeps lockfiles and global caches
./scripts/benchmark.sh --cold       # deletes lockfiles and clears every global cache
./scripts/benchmark.sh --only npm,pnpm
./scripts/benchmark.sh --runs 3     # repeat and report the median
```

Windows: `powershell -ExecutionPolicy Bypass -File scripts\benchmark.ps1`

The script reports install time, `node_modules` size, build time and test time
per project, and writes a `benchmark-results.csv` you can compare with the rest
of the room.

## The three scenarios that matter

They measure different things and the ranking can differ between them. Run all
three or you are only telling part of the story.

### 1. Cold — no cache, no lockfile

```bash
rm -rf node_modules package-lock.json    # or yarn.lock / pnpm-lock.yaml / bun.lock
npm cache clean --force                  # per-tool, see the table below
time npm install
```

Measures full dependency resolution plus download plus write. This is the number
in most blog posts and the one that flatters Bun most. It is also the scenario
you encounter **least often** in real life.

### 2. Warm — cache present, lockfile present, no `node_modules`

```bash
rm -rf node_modules
time npm ci
```

This is your CI with a cache hit, and your laptop after switching branches. It
is the number that actually predicts your day. Gaps narrow substantially here
because resolution is skipped and the files come from a local cache.

### 3. Repeat — everything present

```bash
time npm install    # nothing to do
```

Measures how fast the tool can work out there is nothing to do. Sounds trivial;
it is what runs on every `npm install` a developer types out of habit, and on
every CI step that doesn't skip it.

## Clearing each cache

| Tool | Command | Where it lives |
|---|---|---|
| npm | `npm cache clean --force` | `~/.npm/_cacache` |
| Yarn 4 | `yarn cache clean --all` | `~/.yarn/berry/cache` |
| pnpm | `pnpm store prune` (or delete the store) | `pnpm store path` |
| Bun | `bun pm cache rm` | `~/.bun/install/cache` |
| Deno | `deno clean` | `~/.cache/deno` |

Deleting the store outright is more thorough than pruning:

```bash
rm -rf "$(pnpm store path)"
```

## Rules for numbers you can defend

**Run each measurement at least three times and take the median.** First runs
are polluted by filesystem cache warm-up. One run is an anecdote.

**Keep the machine otherwise idle.** No builds, no Docker, no video call. A
background `ng serve` will distort everything.

**Report your environment.** Package manager version, Node version, OS,
filesystem, whether the disk is a network volume or a VM share. Install
performance is I/O bound, and a Docker bind mount on macOS can be several times
slower than the same install on the host. Numbers without an environment are
not comparable.

**Don't mix cold and warm.** The single most common mistake is a "cold" run
where the global cache was still populated. Prove your cache is empty before
you start.

**Measure disk honestly.** `du -sh node_modules` **overcounts** for pnpm,
because hard links point at shared inodes. To compare two pnpm projects:

```bash
du -sh --total project-a/node_modules project-b/node_modules
```

`du` counts each inode once per invocation, so this shows the true combined
cost. On macOS use `du -sh -c`. The whole pnpm argument lives in the gap
between these two numbers.

**Measure more than install.** A tool that installs in 1 s but breaks your
build has cost you the afternoon. The script times install, build *and* test
for exactly this reason.

## What to expect

Published 2026 figures, for orientation only — your machine will differ:

| | Cold, 50 deps | Cold, 800 deps | Disk, 200 deps | CI clean cache |
|---|---|---|---|---|
| npm | 14.3 s | 134.2 s | 487 MB | 48 s |
| Yarn | 6.8 s | 52.3 s | 502 MB | 21 s |
| pnpm | 4.2 s | 28.6 s | 124 MB | 14 s |
| Bun | 0.8 s | 4.8 s | 461 MB | 3 s |
| Deno | not measured on the same rig | — | — | — |

Two things to take from the table. First, the gap **widens with scale** —
npm's penalty grows from 18× to 28× between 50 and 800 dependencies, so a small
project genuinely hides the difference. Second, pnpm's disk number is the
outlier that no amount of install speed compensates for if you keep a dozen
checkouts on one laptop.

## The question worth asking at the end

Convert your own numbers into time actually saved:

```
(seconds saved per CI run) × (runs per week) = engineer-hours per week
(seconds saved per local install) × (installs per developer per day) × (developers)
```

For most teams the CI figure dominates by an order of magnitude, and it carries
far less risk than asking everyone to change their local setup. That asymmetry
— not the raw benchmark — is usually the actionable finding.
