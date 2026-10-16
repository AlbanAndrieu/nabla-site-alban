# Agent developer guide

On-demand companion to `/AGENTS.md`: common commands and the cross-file architecture.

## Commands

```bash
npm run dev                  # Next dev server (http://localhost:3000)
npm run quality:agent:fix    # self-converging formatter/lint fix loop — run after every edit batch
npm run check                # rss:check + eslint + stylelint + tsc + unit tests + build
npm run typecheck            # tsc --noEmit
npm run test:unit            # Node test runner (unit-tests/**/*.test.ts via tsx, plus *.test.mjs)
npm test                     # Playwright E2E (chromium, firefox, webkit, mobile)
```

Single tests:

```bash
node --import tsx --test unit-tests/<name>.test.ts           # one unit test file
npx playwright test tests/<name>.spec.ts --project=chromium  # one E2E spec, one browser
npx playwright test -g "<test title>" --project=chromium     # filter by title
```

`just --list` exposes the same commands through mise-pinned tooling.

## Architecture

- **Locale routing**: all pages live under `app/[locale]/`. `i18n/routing.ts` defines `en`
  (default, no prefix) and `fr` (`/fr`). `proxy.ts` (Next 16 replacement for `middleware`) wraps
  the next-intl middleware and also returns semantic 404s for unknown top-level `*.html` paths.
- **Messages**: `messages/en.json` and `messages/fr.json`, plus per-feature catalogs
  (`messages/{ai,homelab,operations,security,truenas,workstation}/`). `i18n/messages.ts` merges
  them and throws on duplicate top-level namespaces. EN and FR catalogs must keep the same keys.
- **Legacy static HTML bridge**: some routes still render trusted HTML from `public/*.html`
  through `lib/htmlFromPublic.ts` (allow-listed `PUBLIC_HTML_FILES`). Legacy `.html` URLs are kept
  alive by redirects and rewrites in `next.config.mjs`, using the slug lists in
  `lib/htmlRoutes.config.mjs`. The 404 page is a protected exception (see `AGENTS.md`).
- **Server logic**: `lib/` holds data loading and domain logic (homelab health/observability,
  CISO/CTID feeds, DSOMM, CV). `app/api/*` contains the Route Handlers that expose it (homelab
  probes/status/topology, Stripe `create-checkout-session`, OG/social cards).
- **Tests as contracts**: many `unit-tests/*.test.ts` are source/CI/policy contract tests (agent
  gate, CI scope, i18n parity). When one fails after a change, treat it as an invariant to
  respect, not a test to relax.
- **Deployment**: Vercel Git Integration only (`vercel.json`). Env vars for Stripe and analytics
  are listed in `README.md`.
