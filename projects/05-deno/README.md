# 05 — Deno

The different bet. Deno is a runtime with a package manager, a TypeScript
compiler, a test runner, a linter and a formatter in one binary — and a
permission sandbox wrapped around all of it.

> **Read this first.** Unlike the other four projects, this one was **not**
> end-to-end verified when the bundle was assembled (Deno wasn't available in
> the build environment). Angular's CLI, its esbuild-based pipeline and Karma
> are all Node programs running through Deno's Node-compatibility layer. Expect
> this to be the project that misbehaves. That is precisely why it's worth
> running — and if it works cleanly on your machine, that is a real data point
> about how far Deno's Node compatibility has come.

## Run it

```bash
deno install         # install dependencies, generate deno.lock + node_modules
deno task start      # dev server on http://localhost:4200
deno task test       # Karma + Jasmine, watch mode
deno task test:ci    # single headless run with coverage
deno task build      # production build into dist/
```

`deno task` is the equivalent of `npm run`; the tasks are defined in `deno.json`
rather than in `package.json`'s `scripts`.

For a reproducible install:

```bash
deno install --frozen
```

## Files specific to this project

### `deno.json`

Deno reads the neighbouring `package.json` for the dependency list, so this file
only carries the Deno-specific parts:

```jsonc
{
  "nodeModulesDir": "auto",
  "tasks": {
    "start": "deno run -A npm:@angular/cli@21 serve",
    ...
  }
}
```

`nodeModulesDir: "auto"` tells Deno to materialize a real `node_modules`
directory from its global cache — which Angular's build pipeline requires. The
alternative, `"none"`, keeps everything in the global cache only and is faster
and leaner, but will not work here.

Each task runs the Angular CLI with `-A` (`--allow-all`). That is a deliberate
simplification: the sandbox is Deno's headline feature, and granting everything
undermines it. See the exercise below.

### No committed `deno.lock`

Your first `deno install` generates it. The other four projects ship verified
lockfiles; this one can't, for the reason at the top of this file.

## What to notice

**Two registries, one syntax.** Deno resolves both:

```bash
deno add npm:lodash          # the npm registry — 2M+ packages
deno add jsr:@std/assert     # JSR, which serves TypeScript natively
```

JSR publishes TypeScript source with auto-generated documentation and no build
step. It is a genuinely different model from npm's "publish compiled JS plus
hand-written .d.ts".

**The permission sandbox.** This is the real differentiator, and the tasks in
this project bypass it with `-A`. To feel it, try running something without:

```bash
deno run npm:some-package                    # denied everything
deno run --allow-read=. --allow-net=localhost:4200 npm:@angular/cli@21 serve
```

Deno will prompt or refuse for each capability. Critically, **the sandbox
applies to npm packages too** — a postinstall script or a compromised
transitive dependency cannot read `~/.ssh` unless you granted file access. No
other tool in this lab offers anything comparable.

The exercise: narrow `-A` down to the minimum set of flags that still lets
`deno task build` succeed. It is harder than it sounds, and the difficulty is
the lesson.

**No eslint/prettier/vitest tax.** Deno has them built in:

```bash
deno fmt             # formatter
deno lint            # linter
deno test            # test runner (for Deno-native tests, not Karma)
deno compile         # single-file executable
```

This project still uses Karma and Jasmine so it stays identical to the other
four — but for greenfield work, that dependency reduction is real.

**Workspaces.** `deno.json` supports a `workspace` array, `deno task --filter`
for running across members, and hybrid monorepos where some members have a
`package.json` and others a `deno.json`.

**No audit command.** Like Bun, Deno has no `npm audit` equivalent. Its answer
is the sandbox — contain what a malicious package can do, rather than enumerate
which packages are known-bad. Those are different security models and it is
worth arguing about which one you'd rather rely on. Ideally you want both.

**Compatibility.** Around 97% of the top 1,000 npm packages, with native addons
(`.node` files) now supported through an FFI bridge. That still leaves a tail,
and Angular's toolchain sits close to the demanding end of it.

## If it doesn't work

Reasonable fallbacks, in order:

1. Make sure you're on **Deno 2.5+** (`deno --version`). Node compatibility
   improved substantially across the 2.x line.
2. Delete `node_modules` and `deno.lock`, then `deno install` again.
3. Try `"nodeModulesDir": "manual"` in `deno.json` and run `npm install` once to
   populate `node_modules`, then use `deno task` for everything else.
4. Failing all that: note exactly where it broke and bring it to the group.
   "Deno couldn't run Angular's CLI at step X" is a more useful workshop outcome
   than a green checkmark.

## The honest summary

Adopting Deno is a **runtime** decision, not an installer swap. Moving from npm
to pnpm changes how packages land on disk; moving to Deno changes what executes
your code, how it's permitted to behave, and which registry you publish to.
That is a much larger conversation — and it should not be had by comparing
install times.
