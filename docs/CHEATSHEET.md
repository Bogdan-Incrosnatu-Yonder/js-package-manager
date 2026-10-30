# Command cheatsheet

Every row does the same job in all five tools. Where a cell is empty, the tool
has no equivalent.

## Installing

| Task | npm | Yarn 4 | pnpm | Bun | Deno |
|---|---|---|---|---|---|
| Install everything | `npm install` | `yarn install` | `pnpm install` | `bun install` | `deno install` |
| Reproducible / CI install | `npm ci` | `yarn install --immutable` | `pnpm install --frozen-lockfile` | `bun install --frozen-lockfile` | `deno install --frozen` |
| Production only | `npm ci --omit=dev` | `yarn workspaces focus --production` | `pnpm install --prod` | `bun install --production` | — |
| Offline | `npm ci --offline` | `yarn install --mode=skip-build` | `pnpm install --offline` | `bun install --no-cache=false` | `deno install --cached-only` |

## Managing dependencies

| Task | npm | Yarn 4 | pnpm | Bun | Deno |
|---|---|---|---|---|---|
| Add | `npm install x` | `yarn add x` | `pnpm add x` | `bun add x` | `deno add npm:x` |
| Add dev | `npm install -D x` | `yarn add -D x` | `pnpm add -D x` | `bun add -d x` | `deno add -D npm:x` |
| Add exact version | `npm install -E x` | `yarn add -E x` | `pnpm add -E x` | `bun add -E x` | `deno add npm:x@1.2.3` |
| Add global | `npm install -g x` | — (use `yarn dlx`) | `pnpm add -g x` | `bun add -g x` | `deno install -g x` |
| Remove | `npm uninstall x` | `yarn remove x` | `pnpm remove x` | `bun remove x` | `deno remove npm:x` |
| Update all | `npm update` | `yarn up` | `pnpm update` | `bun update` | `deno outdated --update` |
| Update interactively | — | `yarn upgrade-interactive` | `pnpm update -i` | — | — |
| List outdated | `npm outdated` | `yarn outdated` | `pnpm outdated` | `bun outdated` | `deno outdated` |
| Why is this installed? | `npm ls x` | `yarn why x` | `pnpm why x` | `bun pm why x` | — |
| Dedupe | `npm dedupe` | `yarn dedupe` | `pnpm dedupe` | — | — |

## Running things

| Task | npm | Yarn 4 | pnpm | Bun | Deno |
|---|---|---|---|---|---|
| Run a script | `npm run build` | `yarn build` | `pnpm build` | `bun run build` | `deno task build` |
| Run a local binary | `npx ng ...` | `yarn ng ...` | `pnpm ng ...` | `bunx ng ...` | `deno run -A npm:@angular/cli ...` |
| Run without installing | `npx create-x` | `yarn dlx create-x` | `pnpm dlx create-x` | `bunx create-x` | `deno run -A npm:create-x` |
| Pass args to a script | `npm run build -- --verbose` | `yarn build --verbose` | `pnpm build --verbose` | `bun run build --verbose` | `deno task build --verbose` |
| List scripts | `npm run` | `yarn run` | `pnpm run` | `bun run` | `deno task` |

## Security and inspection

| Task | npm | Yarn 4 | pnpm | Bun | Deno |
|---|---|---|---|---|---|
| Audit | `npm audit` | `yarn npm audit` | `pnpm audit` | — | — |
| Auto-fix | `npm audit fix` | — | `pnpm audit --fix` | — | — |
| Generate SBOM | `npm sbom` | via plugin | `pnpm licenses list` | — | — |
| Licenses | `npm ls --long` | `yarn licenses list` | `pnpm licenses list` | — | — |
| Runtime sandbox | — | — | — | — | `--allow-*` flags |

Bun and Deno have no audit command. Plan for a third-party scanner if you use
either in production.

## Caches and stores

| Task | npm | Yarn 4 | pnpm | Bun | Deno |
|---|---|---|---|---|---|
| Where is the cache? | `npm config get cache` | `yarn config get cacheFolder` | `pnpm store path` | `bun pm cache` | `deno info` |
| Clear it | `npm cache clean --force` | `yarn cache clean` | `pnpm store prune` | `bun pm cache rm` | `deno clean` |
| Verify integrity | `npm cache verify` | — | `pnpm store status` | — | — |

## Workspaces / monorepos

| Task | npm | Yarn 4 | pnpm | Bun | Deno |
|---|---|---|---|---|---|
| Declared in | `package.json` `workspaces` | `package.json` `workspaces` | `pnpm-workspace.yaml` | `package.json` `workspaces` | `deno.json` `workspace` |
| Run in one member | `npm run b -w pkg-a` | `yarn workspace pkg-a b` | `pnpm --filter pkg-a b` | `bun run --filter pkg-a b` | `deno task --filter pkg-a b` |
| Run in all members | `npm run b -ws` | `yarn workspaces foreach run b` | `pnpm -r b` | `bun run --filter '*' b` | `deno task --filter '*' b` |
| Link a local package | `"pkg-a": "*"` | `"pkg-a": "workspace:*"` | `"pkg-a": "workspace:*"` | `"pkg-a": "workspace:*"` | `"pkg-a": "workspace:*"` |

## Lockfiles

| Tool | File | Format | Size here |
|---|---|---|---|
| npm | `package-lock.json` | JSON, includes tree layout | ~322 KB |
| Yarn 4 | `yarn.lock` | YAML-ish, resolutions only | ~222 KB |
| pnpm | `pnpm-lock.yaml` | YAML, graph | ~192 KB |
| Bun | `bun.lock` | JSONC text (was binary `.lockb` before 1.2) | ~150 KB |
| Deno | `deno.lock` | JSON | generated on first install |

## Pinning the tool itself

| Tool | How |
|---|---|
| npm | `"packageManager": "npm@10.9.7"` + Corepack |
| Yarn 4 | `yarnPath` in `.yarnrc.yml` pointing at a committed release (used here) |
| pnpm | `"packageManager": "pnpm@10.28.0"` + Corepack |
| Bun | `.bun-version` file, or pin in CI |
| Deno | `.dvmrc`, or pin the version in CI |

Setting `packageManager` in `package.json` and enabling Corepack is the closest
thing to a cross-tool standard. It also makes the *wrong* package manager fail
loudly, which is the real win — mixed lockfiles in one repository cause far more
pain than picking the "wrong" tool ever will.
