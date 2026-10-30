# 04 — Bun

The speed argument. Bun's installer is written in Zig, does its own dependency
resolution, and is typically an order of magnitude faster than npm on a cold
install.

Note that Bun is also a JavaScript *runtime* — but here it is used purely as a
package manager. The Angular CLI still runs on Node.

## Run it

```bash
bun install          # install dependencies
bun run start        # dev server on http://localhost:4200
bun run test         # Karma + Jasmine, watch mode
bun run test:ci      # single headless run with coverage
bun run build        # production build into dist/
```

`bun run` is required for scripts — bare `bun start` tries to execute a file
called `start`. (`bun start` does work for a script literally named `start` in
recent versions, but `bun run` is unambiguous and worth the four characters.)

For a reproducible install:

```bash
bun install --frozen-lockfile
```

## Files specific to this project

### `bunfig.toml`

Bun's config file. The defaults are good; this one mostly documents where the
knobs are.

### `trustedDependencies` in `package.json`

```json
"trustedDependencies": ["@parcel/watcher", "esbuild", "lmdb", "msgpackr-extract"]
```

Like pnpm 10, **Bun blocks dependency lifecycle scripts by default**. Packages
must be listed here to run their `postinstall`. To see what is currently
blocked:

```bash
bun pm untrusted
bun pm trust --all      # or name specific packages
```

Remove the `trustedDependencies` array and reinstall to watch the block happen.

### `bun.lock`

Bun's lockfile. Since Bun 1.2 this is a **text** format (JSONC) that diffs and
reviews cleanly — the old binary `bun.lockb` was fast but unreadable in a pull
request. If you see `bun.lockb` in an older project, `bun install --save-text-lockfile`
converts it.

## What to notice

**Speed.** Run it cold and watch:

```bash
rm -rf node_modules bun.lock
bun pm cache rm
time bun install
```

Published benchmarks put Bun at ~0.8 s for a 50-dependency project against
npm's 14.3 s, and 4.8 s vs 134 s on an 800-dependency monorepo. The gap widens
with scale. The mechanism is a combination of a global cache with hardlinking,
aggressive parallelism, and a resolver that doesn't run in JavaScript.

**Where it matters most: CI and Docker.** In a clean-cache GitHub Actions run
the published figures are 3 s for Bun against 48 s for npm; a no-cache Docker
build is 6 s vs 52 s. That is the clearest return in this entire comparison,
and — unlike changing what developers run locally — it is a low-risk change:
your CI either goes green or it doesn't.

**Disk.** Bun keeps a global cache and hardlinks from it, but the project's
`node_modules` is still a flat tree, so the footprint (~461 MB for 200
dependencies) lands close to npm's rather than pnpm's. The cache dedupes
*across* projects; the tree does not dedupe *within* one.

```bash
bun pm cache          # where the cache lives
du -sh $(bun pm cache)
du -sh node_modules
```

**`bunx`.** The `npx` equivalent, and substantially faster:

```bash
bunx ng generate component features/report
```

**The gap you must not skip: there is no `bun audit`.** Bun ships no built-in
security auditing, no auto-fix, no SBOM generation. For a production
application that means bringing your own scanner — Snyk, Socket, `osv-scanner`,
or simply running `npm audit` against the same `package.json` in a side
project. Decide this *before* you standardise on Bun, not after a CVE lands.

## Known quirks

- **Angular's CLI still runs on Node here.** Bun installs the packages; `ng`
  executes under Node. Running the Angular build *on* the Bun runtime
  (`bun --bun run build`) is a separate, much less certain experiment — try it
  if you want, but don't be surprised when something in the build pipeline
  objects.
- **`@parcel/watcher` needs its build script** for file watching in `ng serve`.
  It has prebuilt binaries for common platforms, so the dev server usually works
  regardless — but on an unusual platform, trust it.
- **Compatibility is ~98%**, up from 95% in 2025. That remaining 2% is mostly
  packages doing unusual things with native addons or with `node_modules`
  layout. This project is inside the 98%.
