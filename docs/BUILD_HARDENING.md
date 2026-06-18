# Build and Dependency Hardening

Priority 9 makes the project less dependent on whatever `latest` feels like doing today. Floating dependency ranges are basically letting npm drive while blindfolded. Bold strategy, terrible commute.

## Completed

- Removed `latest` from `package.json` dependencies.
- Added explicit dependency versions.
- Added Node engine metadata.
- Added `packageManager` metadata.
- Added `.nvmrc` and `.node-version` for Node 22.
- Added `.npmrc` with exact-save defaults.
- Added ESLint flat config for Next.js.
- Added `npm run check`.
- Added `npm run audit:prod`.
- Added GitHub Actions CI.

## Commands

Local quality check:

```bash
npm run check
```

Production dependency audit:

```bash
npm run audit:prod
```

## CI

GitHub Actions workflow:

```txt
.github/workflows/ci.yml
```

It runs:

1. install dependencies
2. lint
3. typecheck
4. build
5. production dependency audit

## Lockfile Status

There is currently no committed `package-lock.json` in the repository. The GitHub connector can edit files, but it cannot run `npm install` against the npm registry from your machine and safely produce the real resolved lockfile. Faking a lockfile would be worse than having none, because then the project would be confidently wrong. Humanity already has enough of that.

Generate the lockfile locally with:

```bash
npm install --package-lock-only
```

Then commit the generated `package-lock.json`.

After that, update CI install from:

```bash
npm install --no-fund
```

to:

```bash
npm ci --no-fund
```

## Cloudflare Pages

Use Node 22 if Cloudflare lets you configure it. The repo now includes both:

```txt
.nvmrc
.node-version
```

Recommended build command remains:

```bash
npm run build
```

## QA Checklist

1. Pull latest `main`.
2. Run `npm install`.
3. Confirm `package-lock.json` is generated.
4. Run `npm run lint`.
5. Run `npm run typecheck`.
6. Run `npm run build`.
7. Run `npm run audit:prod`.
8. Push and confirm GitHub Actions passes.
9. Deploy to Cloudflare Pages.
10. Confirm production opens `/`, `/online`, and `/history`.
