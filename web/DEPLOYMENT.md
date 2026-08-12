# Deployment Notes

## Production Platform

Blink & Find deploys to Cloudflare Workers through the OpenNext Cloudflare adapter.

Production URL:

```txt
https://blink-and-find.hinischalsubba.workers.dev/
```

Vercel remains connected as a deployment preview and compatibility check, but Cloudflare Workers is the production target.

## Reproducible Setup

Use the committed npm lockfile:

```bash
npm ci
```

The repository pins compatible versions of Next.js, `@opennextjs/cloudflare`, and Wrangler. It also pins patched `postcss` and `sharp` transitive versions through npm overrides so the production audit stays reproducible. Do not use `--force` or `--legacy-peer-deps` to hide dependency conflicts.

## Cloudflare Configuration

The required deployment files are committed:

- `wrangler.jsonc` points to `.open-next/worker.js` and `.open-next/assets`.
- `open-next.config.ts` enables the Cloudflare adapter.
- `next.config.ts` initializes Cloudflare bindings for local development.
- `public/_headers` gives immutable caching to Next.js static assets.

Cloudflare Git integration should use Node.js 22 and the repository's npm scripts. The production deploy command is:

```bash
npm run deploy:cloudflare
```

To validate the Worker bundle without deploying:

```bash
npm run build:cloudflare
```

## Environment Variables

Configure these values in Cloudflare Workers settings for preview and production environments:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Use `.dev.vars.example` as the local template. Never commit real credentials.

## Required Checks

Run the same gates used by GitHub Actions:

```bash
npm ci
npm run check
npm run build
npm run build:cloudflare
npx playwright install chromium
npm run test:e2e
```

`npm run check` runs ESLint with zero warnings allowed, TypeScript, and the production dependency audit.

## Supabase Advisor Check

GitHub Actions can query Supabase security and performance advisors when these repository secrets are configured:

```txt
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_REF
```

The advisor gate fails only for `ERROR` findings. Informational findings are printed for review without blocking a release.

## Release Verification

Before merging a deployment change, confirm:

- GitHub Actions quality and advisor jobs are green.
- The Cloudflare Worker preview/deployment succeeds.
- Both connected Vercel preview projects build successfully.
- `/`, `/online`, `/sitemap.xml`, and the social preview image routes return successful responses.
- A two-browser online match can create, join, start, submit results, and finish.
