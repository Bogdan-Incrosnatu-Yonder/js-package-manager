# Troubleshooting

Ordered roughly by how often people hit them.

## Karma can't find Chrome

```
Cannot start Chrome
  No binary for Chrome browser on your platform.
```

Karma launches a real browser. Point it at one:

```bash
# macOS
export CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# Linux
export CHROME_BIN=$(which google-chrome || which chromium || which chromium-browser)
# Windows PowerShell
$env:CHROME_BIN="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

In a container or CI runner, use the sandbox-free launcher that `karma.conf.js`
already defines:

```bash
npm run test:ci        # uses ChromeHeadlessNoSandbox
```

## Node version rejected

```
The Angular CLI requires a minimum Node.js version of v22.12 or v24
```

Angular 21 needs **Node 22.12+ or 24+**. `node --version` to check;
[nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm) or
[volta](https://volta.sh) to switch. `engine-strict=true` in the npm and pnpm
projects surfaces this at install time rather than an hour later.

## `yarn: command not found`

`projects/02-yarn` pins Yarn via `yarnPath` in `.yarnrc.yml`, which only applies
from that directory down — but you still need *some* `yarn` on `PATH` to
bootstrap it. Either:

```bash
corepack enable                      # ships with Node 22+
# or
npm install -g yarn                  # installs Yarn 1, which then respects yarnPath
# or run the pinned release directly
node .yarn/releases/yarn-4.18.0.cjs install
```

That last form always works and needs nothing installed.

## Corepack fails to download

```
Error when performing the request to https://registry.npmjs.org/...
```

Corporate proxies and offline environments break Corepack. For Yarn, use the
committed release as shown above. For pnpm, install it from npm
(`npm install -g pnpm`) instead of via Corepack.

## pnpm: "Ignored build scripts"

```
╰─▶ Ignored build scripts: @parcel/watcher, esbuild, lmdb, msgpackr-extract
```

Expected if you removed `pnpm-workspace.yaml`. pnpm 10 blocks dependency
lifecycle scripts by default as a supply-chain defence. Restore the file, or:

```bash
pnpm approve-builds        # interactive; writes the list for you
```

## pnpm: "Cannot find module ..."

pnpm's strict linker only exposes packages you actually declared. Something is
importing an undeclared dependency. In order of preference:

1. Add the missing package to *your* `package.json` if your code imports it.
2. If a *dependency* is at fault, patch its manifest rather than weakening the
   whole project:

   ```yaml
   # pnpm-workspace.yaml
   packageExtensions:
     'offending-package@*':
       dependencies:
         'the-thing-it-forgot': '*'
   ```

3. Last resort, `shamefully-hoist=true` in `.npmrc`. This flattens everything
   and gives up the guarantee. Fine as a migration stopgap, not as a destination.

## Bun: "Blocked N postinstall"

Expected. Bun blocks lifecycle scripts unless the package is in
`trustedDependencies`:

```bash
bun pm untrusted           # see what was blocked and why
bun pm trust --all         # or name specific packages
```

The `trustedDependencies` array in this project's `package.json` already covers
the four that need it.

## Bun: `bun start` does nothing useful

Use `bun run start`. Bare `bun <name>` prefers executing a *file* of that name.

## Deno: Angular CLI fails to start

Most likely causes, in order:

1. **Deno older than 2.5** — `deno --version`. Node compatibility improved a lot
   across 2.x.
2. **`node_modules` not materialized** — confirm `"nodeModulesDir": "auto"` in
   `deno.json`, then `rm -rf node_modules deno.lock && deno install`.
3. **Permissions** — the tasks use `-A`. If you narrowed them, the build needs
   read/write on the project, network for the dev server, and env access.
4. **Fall back to a hybrid**: set `"nodeModulesDir": "manual"`, run `npm install`
   once to populate `node_modules`, then use `deno task` for everything else.

`projects/05-deno/README.md` has more. This project is the experimental one and
a failure there is a legitimate workshop finding, not a mistake on your part.

## `ERESOLVE` peer dependency conflict (npm)

npm 7+ installs peer dependencies and errors on conflicts. Read the tree it
prints — it names the two packages that disagree. `--legacy-peer-deps` restores
npm 6 behaviour and `--force` installs anyway; both hide a real problem, so
understand the conflict before reaching for either.

The usual culprit in this project would be a mismatch between `@angular/cdk`
and PrimeNG's peer range. Both are pinned to Angular 21 here, so it should not
arise unless you upgrade one of them.

## Port 4200 already in use

Another `ng serve` is running — likely a different project from this lab.

```bash
npm start -- --port 4300
yarn start --port 4300
pnpm start --port 4300
bun run start --port 4300
deno task start --port 4300
```

Running several at once is a good way to compare them side by side; just give
each its own port.

## Out of disk

All five installed at once is roughly 2.5 GB. `./scripts/clean.sh` removes every
`node_modules`, `dist`, `coverage` and `.angular` directory in the bundle.

## Tests pass locally but fail in CI

Almost always Chrome. Use the headless no-sandbox launcher:

```bash
npm run test:ci
```

The `ci` configuration in `angular.json` sets `watch: false`,
`browsers: ChromeHeadlessNoSandbox` and enables coverage — which is what a CI
runner needs.
