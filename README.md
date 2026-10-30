# Angular Package Manager Lab

Five identical Angular 21 + PrimeNG applications, each wired up to a different
JavaScript package manager: **npm, Yarn, pnpm, Bun and Deno**.

The source code in all five folders is byte-for-byte the same. The only
differences are the lockfile, the tool-specific config, and the commands you
type. That is deliberate — it means every difference you observe comes from the
package manager, not from the app.

---

## What's in the box

```
angular-package-manager-lab/
├── README.md                ← you are here
├── docs/
│   ├── CHEATSHEET.md        command equivalences across all five tools
│   ├── BENCHMARKING.md      how to run the timing exercise properly
│   └── TROUBLESHOOTING.md   the errors people actually hit
├── scripts/
│   ├── benchmark.sh         times install / build / test for every project (macOS, Linux, WSL)
│   ├── benchmark.ps1        the same, for Windows PowerShell
│   └── clean.sh             removes node_modules, dist, caches
└── projects/
    ├── 01-npm/              package-lock.json  ·  .npmrc
    ├── 02-yarn/             yarn.lock          ·  .yarnrc.yml  ·  .yarn/releases/
    ├── 03-pnpm/             pnpm-lock.yaml     ·  .npmrc  ·  pnpm-workspace.yaml
    ├── 04-bun/              bun.lock           ·  bunfig.toml
    └── 05-deno/             deno.json
```

Each project folder has **its own README** with that tool's install commands,
config walkthrough and known quirks. Start there once you've picked one.

---

## The application

A small but real Angular app, not a hello-world:

| Piece | What it exercises |
|---|---|
| **Angular 21** standalone components, signals, lazy routes | The modern Angular build pipeline (esbuild-based) |
| **PrimeNG 21** — Table, Card, Tag, Chart, SelectButton, Toolbar, Button, InputText | A large third-party component library with deep peer-dependency requirements |
| **@primeuix/themes** (Aura preset) | Theming resolved through a separate package |
| **Chart.js 4** | A native (non-Angular) transitive dependency |
| **@angular/cdk** | PrimeNG's own peer dependency — a common resolution flashpoint |
| **Karma + Jasmine**, 30 specs | The Angular default test runner, driving a real Chrome |

Two routes: `/dashboard` (a PrimeNG table comparing the five tools) and
`/benchmark` (a Chart.js bar chart with a metric toggle). The toolbar shows a
badge naming the package manager that built that copy, so in a room full of
laptops you can see at a glance who is running what.

---

## Prerequisites

**Everyone needs:**

- **Node.js 22.12+ or 24+** — required by Angular 21. Check with `node --version`.
- **Google Chrome or Chromium** — Karma launches a real browser for the tests.
  If Karma can't find it, set `CHROME_BIN` to the executable path.
- Roughly **2.5 GB free disk** if you intend to install all five at once.

**Then install whichever tools you plan to compare:**

| Tool | Version used here | Install |
|---|---|---|
| npm | 10.9+ | ships with Node |
| Yarn | 4.18 | committed to `projects/02-yarn/.yarn/releases/` — nothing to install |
| pnpm | 10.28+ | `npm install -g pnpm` |
| Bun | 1.3+ | `curl -fsSL https://bun.sh/install \| bash` (macOS/Linux) or `powershell -c "irm bun.sh/install.ps1 \| iex"` |
| Deno | 2.5+ | `curl -fsSL https://deno.land/install.sh \| sh` or `irm https://deno.land/install.ps1 \| iex` |

You do **not** need all five. Pick the ones you care about; each project stands
on its own.

---

## Quick start

Pick a project, install, serve. The app comes up on <http://localhost:4200>.

```bash
# npm
cd projects/01-npm   && npm install   && npm start

# Yarn 4
cd projects/02-yarn  && yarn install  && yarn start

# pnpm
cd projects/03-pnpm  && pnpm install  && pnpm start

# Bun
cd projects/04-bun   && bun install   && bun run start

# Deno
cd projects/05-deno  && deno install  && deno task start
```

Run the tests the same way — `npm test`, `yarn test`, `pnpm test`,
`bun run test`, `deno task test`. Karma opens Chrome and watches for changes;
add `:ci` (`npm run test:ci`) for a single headless run with coverage.

> **Windows users:** everything works in PowerShell. Use `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\benchmark.ps1`

## Command cheatsheet

The full table is in [`docs/CHEATSHEET.md`](docs/CHEATSHEET.md). The short version:

| Task | npm | Yarn 4 | pnpm | Bun | Deno |
|---|---|---|---|---|---|
| Install all | `npm install` | `yarn install` | `pnpm install` | `bun install` | `deno install` |
| Add a package | `npm install x` | `yarn add x` | `pnpm add x` | `bun add x` | `deno add npm:x` |
| Add a dev package | `npm install -D x` | `yarn add -D x` | `pnpm add -D x` | `bun add -d x` | `deno add -D npm:x` |
| Remove | `npm uninstall x` | `yarn remove x` | `pnpm remove x` | `bun remove x` | `deno remove npm:x` |
| Run a script | `npm run build` | `yarn build` | `pnpm build` | `bun run build` | `deno task build` |
| Run a binary | `npx ng g c foo` | `yarn ng g c foo` | `pnpm ng g c foo` | `bunx ng g c foo` | `deno run -A npm:@angular/cli g c foo` |
| Reproducible CI install | `npm ci` | `yarn install --immutable` | `pnpm install --frozen-lockfile` | `bun install --frozen-lockfile` | `deno install --frozen` |

---

## About the shipped lockfiles

Every project ships with a lockfile that was generated and verified against this
exact dependency set — `npm install`, `yarn install`, `pnpm install` and
`bun install` were each run, and `ng build` confirmed working afterwards.

That means your **first** install is a warm, lockfile-driven install, not the
cold resolution the benchmark blogs measure. For the cold-install exercise,
delete the lockfile first (`scripts/benchmark.sh --cold` does this for you) and
restore it afterwards with `git checkout` — or just re-run the install, since
each tool regenerates its own.

**Deno is the exception:** `deno.lock` is not committed, because Deno's
resolution is the one thing that could not be verified in the environment this
bundle was built in. Your first `deno install` generates it.

---

## A note on the Deno project

Deno is included because it now competes for the same job, but be clear-eyed
about it: Angular's CLI, the build pipeline and Karma are all Node programs
running through Deno's Node-compatibility layer. It is the most likely of the
five to surprise you, and unlike the other four it was not end-to-end verified
when this bundle was assembled. Treat `projects/05-deno` as the experiment —
that is what makes it interesting to run in a room full of people.

---

## Troubleshooting

See [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md). The three you are most
likely to hit:

- **Karma can't find Chrome** → `export CHROME_BIN=/path/to/chrome`
- **Node too old** → Angular 21 needs 22.12+; `engine-strict` will tell you
- **`yarn` not found** → this project pins Yarn via `.yarn/releases`, so run it
  as `yarn` from inside `projects/02-yarn` where `.yarnrc.yml` applies

---

## Reference data

The figures shown in the app's dashboard and chart come from the 2026 package
manager benchmarks (dev.to / Pockit Tools) plus Deno's own published numbers.
They are static sample data — the real numbers are the ones you measure on your
own machine in step 1.
