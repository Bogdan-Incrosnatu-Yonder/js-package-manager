# 02 — Yarn 4 (Berry)

Yarn 4, the plugin-based rewrite. Not Yarn Classic (1.x) — the two share a name
and almost nothing else.

## Run it

```bash
yarn install         # install dependencies
yarn start           # dev server on http://localhost:4200
yarn test            # Karma + Jasmine, watch mode
yarn test:ci         # single headless run with coverage
yarn build           # production build into dist/
```

Note there is no `run`: `yarn start` and `yarn build` call the scripts directly.
`yarn run start` also works if you prefer the explicit form.

For a reproducible install that fails rather than updating the lockfile:

```bash
yarn install --immutable
```

That is the CI command. It is the equivalent of `npm ci`.

## You do not need to install Yarn

This project pins Yarn 4.18.0 and **commits the release binary** to
`.yarn/releases/yarn-4.18.0.cjs`. Combined with `yarnPath` in `.yarnrc.yml`,
that means:

- `yarn` inside this folder runs 4.18.0 regardless of what is on your `PATH`
- it works with Corepack disabled or blocked by a corporate proxy
- everyone in the room is on the identical Yarn version

This is Yarn's recommended distribution model and it is genuinely one of its
better ideas. The cost is 3.7 MB in your repository.

If you'd rather use Corepack: `corepack enable && corepack prepare yarn@4.18.0 --activate`.

## Files specific to this project

### `.yarnrc.yml`

```yaml
yarnPath: .yarn/releases/yarn-4.18.0.cjs
nodeLinker: node-modules
enableScripts: true
```

`nodeLinker: node-modules` is the important one. Yarn 4's *default* is Plug'n'Play,
which does away with `node_modules` entirely and resolves imports through a
single `.pnp.cjs` map. PnP is faster and smaller — but Angular's CLI, Karma and
several PrimeNG transitive dependencies expect a real directory tree. This
project uses `node-modules` so it works out of the box.

`enableScripts: true` re-enables dependency build scripts, which Yarn disables
by default. Without it you get `YN0004` warnings for `esbuild`, `lmdb`,
`@parcel/watcher` and `msgpackr-extract`.

### `yarn.lock`

Yarn's own YAML-ish format, not JSON. Compared to `package-lock.json` it records
resolutions but not the physical tree layout, which is why it is ~222 KB against
npm's ~322 KB for the same dependencies.

## Try Plug'n'Play

This is the most interesting exercise in the whole lab, and the most likely to
fail. Set `nodeLinker: pnp` in `.yarnrc.yml`, then:

```bash
rm -rf node_modules
yarn install
yarn dlx @yarnpkg/sdks vscode   # editor integration — without this your IDE shows red everywhere
yarn build
```

Watch what happens. PnP enforces strict dependency boundaries, so anything that
imports a package it didn't declare fails loudly, and anything that does its own
filesystem walk of `node_modules` breaks. When it fails, the fix is usually
`packageExtensions` in `.yarnrc.yml`:

```yaml
packageExtensions:
  'some-package@*':
    dependencies:
      'the-thing-it-forgot-to-declare': '*'
```

Whether that is rigorous or exhausting is the discussion worth having.

**Zero-installs.** With PnP you can commit `.yarn/cache` and skip `yarn install`
entirely — a fresh clone is immediately runnable. It trades repository size for
install time. For a monorepo with a hundred contributors that can be the right
trade; measure before assuming.

## What to notice

**Plugins.** Yarn 4 is a platform, not just an installer:

```bash
yarn plugin list
yarn plugin import interactive-tools
yarn upgrade-interactive             # now available
```

**Constraints.** Yarn can enforce rules across a workspace — "every package must
use the same TypeScript version", "no dependency may be declared in both
`dependencies` and `devDependencies`". No other tool here has an equivalent.

**Audit is namespaced.** It is `yarn npm audit`, not `yarn audit` — the `npm`
namespace groups commands that talk to the npm registry.

**Speed.** Roughly 6.8 s cold on a 50-dependency project in published
benchmarks — faster than npm, slower than pnpm and Bun. Its disk footprint with
`node-modules` is the *largest* of the five (~502 MB), because it hoists like
npm without pnpm's linking. PnP changes that picture completely.

## Known quirks

- **`yarn` outside this folder** may run a different Yarn, or none. `yarnPath` is
  read from `.yarnrc.yml`, which only applies from this directory down.
- **Yarn 1 muscle memory misleads.** `yarn global add` is gone (use `yarn dlx` or
  `yarn global` via a plugin), and `yarn install --frozen-lockfile` is now
  `--immutable`.
- **`.yarn/install-state.gz`** appears after install. It is a cache, safe to
  delete, and already in `.gitignore`.
