# 03 — pnpm

The disk-efficiency argument. pnpm keeps one copy of every package version in a
global content-addressable store and hard-links it into each project, so ten
projects sharing a dependency store it once.

## Run it

```bash
pnpm install         # install dependencies
pnpm start           # dev server on http://localhost:4200
pnpm test            # Karma + Jasmine, watch mode
pnpm test:ci         # single headless run with coverage
pnpm build           # production build into dist/
```

For a reproducible install that refuses to update the lockfile:

```bash
pnpm install --frozen-lockfile
```

That is the CI command. It is on by default when `CI=true` is set.

## Files specific to this project

### `.npmrc`

```ini
shamefully-hoist=false
engine-strict=true
```

`shamefully-hoist` is the single most important setting in this whole lab, and
the name is a deliberate joke by pnpm's author. Setting it to `true` flattens
`node_modules` the way npm does, which fixes packages that import things they
never declared. Leaving it `false` — as here — keeps pnpm strict.

The exercise: comment out the line, run `pnpm install`, and see whether anything
breaks. In this project it shouldn't, which is itself the finding: Angular 21
and PrimeNG 21 both declare their dependencies honestly. Older libraries often
don't.

### `pnpm-workspace.yaml`

```yaml
onlyBuiltDependencies:
  - '@parcel/watcher'
  - esbuild
  - lmdb
  - msgpackr-extract
```

**pnpm 10 blocks dependency lifecycle scripts by default.** This is a security
decision — a compromised package can't run arbitrary code on `install` — and it
is the right default, but it means you have to opt packages in explicitly.
Without this file you get:

```
╰─▶ Ignored build scripts: @parcel/watcher, esbuild, lmdb, msgpackr-extract
    help: Run "pnpm approve-builds" to pick which dependencies should be allowed
```

Delete the file and reinstall to see it. Then run `pnpm approve-builds` for the
interactive version, which writes this list for you.

### `pnpm-lock.yaml`

YAML, ~192 KB — the smallest of the four lockfiles here for the same dependency
set. It records resolutions and the dependency graph, not a flattened tree.

## What to notice

**The store.** This is the whole point:

```bash
pnpm store path
du -sh $(pnpm store path)
du -sh node_modules
ls -la node_modules/.pnpm | head
```

`node_modules/.pnpm` is the real layout — a flat directory of
`package@version` folders, each hard-linked to the store. The top-level
`node_modules` contains only symlinks to the packages you actually declared.
That symlink structure is what enforces strictness.

**Prove the disk saving.** Copy this project and install again:

```bash
cp -r . ../03-pnpm-copy && cd ../03-pnpm-copy
pnpm install
du -sh node_modules
du -sh $(pnpm store path)
```

The second `node_modules` reports a similar size to the first — but the store
barely grew, because the files are hard links to the same inodes. `du -sh` on
both directories at once tells the true story:

```bash
du -sh --total ../03-pnpm/node_modules ../03-pnpm-copy/node_modules
```

Try the same experiment in `01-npm` and the disk usage genuinely doubles. This
is the mechanism behind the "87% saved across ten overlapping projects" figure.

**Strictness.** Under npm this works; here it should not:

```bash
node -e "require('chart.js')"        # declared — fine
node --input-type=module -e "import('some-transitive-dep')"   # undeclared — fails
```

That failure is a feature. It is also the number one reason a pnpm migration
stalls on an older codebase, because some dependency somewhere is cheating.

**Workspaces.** `pnpm-workspace.yaml` also defines monorepo members. pnpm's
workspace tooling — the `workspace:` protocol, `--filter` for selective
installs and task runs, `pnpm -r` for recursive commands — is the most mature of
the five. If you run a monorepo, this and the disk saving are the argument.

**Speed.** Around 4.2 s cold on a 50-dependency project, 28.6 s on an
800-dependency monorepo — roughly 3-5× faster than npm, and second only to Bun.
Unlike Bun it has full audit tooling:

```bash
pnpm audit
pnpm audit --fix
pnpm licenses list
```

## Known quirks

- **`node_modules/.bin` resolution** occasionally trips up tools that walk
  parent directories by hand rather than using Node's resolver. `pnpm exec` and
  `pnpm dlx` handle it correctly.
- **Docker layer caching** needs care: the store lives outside the project, so
  mount it (`--mount=type=cache,id=pnpm,target=/pnpm/store`) or you lose the
  benefit entirely.
- **`shamefully-hoist=true` is a last resort,** not a migration strategy. Prefer
  adding the missing dependency to the offending package's own `package.json`
  via `pnpm.packageExtensions`.
