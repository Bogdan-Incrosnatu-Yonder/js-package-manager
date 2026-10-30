# 01 — npm

The baseline. Ships with Node, so there is nothing to install, and every other
tool in this lab is measured against it.

## Run it

```bash
npm install          # install dependencies
npm start            # dev server on http://localhost:4200
npm test             # Karma + Jasmine, watch mode, opens Chrome
npm run test:ci      # single headless run with coverage
npm run build        # production build into dist/
```

For a reproducible install that refuses to touch `package-lock.json`:

```bash
npm ci
```

`npm ci` deletes `node_modules` first and fails outright if the lockfile and
`package.json` disagree. It is what your CI should run — never `npm install`.

## Files specific to this project

### `.npmrc`

```ini
engine-strict=true
fund=false
audit=true
save-exact=false
```

`engine-strict=true` makes npm **refuse** to install if your Node version
doesn't satisfy the `engines` field, instead of printing a warning you'll
scroll past. Angular 21 requires Node 22.12+ — this turns a confusing build
failure an hour later into a clear error now.

### `package-lock.json`

npm's lockfile: 322 KB of exact resolved versions, integrity hashes and the
full dependency tree. It is v3 format (npm 7+). Note that it records the
*flattened* tree layout, not just the resolutions — which is why it is so much
larger than `pnpm-lock.yaml` for the same dependencies.

## What to notice

**Install strategy — flat `node_modules`.** npm hoists every package it can to
the top level. Fast to resolve at runtime, but it means your code can `import`
a package you never declared, purely because something else depends on it.
That works until you switch to pnpm and it doesn't. Try this:

```bash
node -e "require('chart.js'); console.log('imported an undeclared dep just fine')"
```

That works here. It works in `04-bun` too. It is *supposed* to fail under
pnpm's strict linker.

**Duplication.** Look for a package that appears more than once:

```bash
npm ls esbuild
find node_modules -name esbuild -maxdepth 4 -type d
```

When two dependencies need incompatible versions, npm nests the loser inside
the dependent's own `node_modules`. Every nested copy is a full copy on disk —
this is the mechanism behind npm's ~487 MB footprint where pnpm uses ~124 MB.

**Auditing.** npm has the most complete built-in security tooling of the five:

```bash
npm audit                 # report
npm audit fix             # apply non-breaking fixes
npm audit signatures      # verify registry signatures
npm sbom --sbom-format cyclonedx > sbom.json
```

Bun and Deno have no equivalent. If your organisation requires an SBOM, this
is the argument that ends the discussion.

**Speed.** npm is the slowest of the five on a cold install — roughly 14 s for
a 50-dependency project against Bun's 0.8 s in published benchmarks. Measure it
yourself:

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
time npm install
```

Then restore the lockfile (`git checkout package-lock.json`) and run it warm to
see how much of that gap was resolution rather than I/O.

## Known quirks

- **Peer dependency handling changed in npm 7** and auto-installs peers. If you
  add a package with conflicting peers, npm errors with `ERESOLVE`. The escape
  hatches are `--legacy-peer-deps` (ignore peers entirely, npm 6 behaviour) and
  `--force` (install anyway). Reach for neither without understanding why.
- **`npm install` mutates the lockfile** even when nothing changed, if the
  registry metadata shifted. Use `npm ci` anywhere that matters.
