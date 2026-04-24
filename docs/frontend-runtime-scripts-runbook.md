# Frontend Runtime Scripts Runbook

## Scope

This runbook documents the shared frontend runtime scripts that were consolidated for this repository. It focuses on how pages should wire analytics, UI widgets, and translation without reintroducing duplicated inline snippets.

## Codepaths Covered

- `public/site-analytics.js`
- `public/site-widgets.js`
- `public/site-google-translate.js`
- `public/analytics-stubs.js` (legacy compatibility shim)
- `public/theme-toggle.js`
- `public/homelab-services-render.js`
- `public/homelab-services.json`
- `public/nabla-service-status.js`
- `app/api/homelab-tunnel-check/route.ts` (server-side tunnel HTTP/TLS probe for homelab cards)
- `public/site-content-page.css` (homelab card + ping indicator styles)
- `lib/marketingPages.ts`
- `app/[locale]/page.tsx`
- `app/[locale]/[slug]/page.tsx`
- `lib/htmlFromPublic.ts`
- `scripts/normalize-public-html-hrefs.mjs`
- `public/*.html` pages that load these scripts (for integration examples)

## Runtime Architecture

The current frontend runtime is split into focused scripts:

- `site-analytics.js`: analytics and telemetry loaders by mode.
- `site-widgets.js`: shared UI behavior (theme, translate bootstrap, scroll helpers, print button, back-to-top, coffee FAB, consent, optional Intercom).
- `theme-toggle.js`: early theme preference application and segmented theme control injection.
- `site-google-translate.js`: standalone translate bootstrap kept for compatibility with older pages.

`site-widgets.js` and `site-google-translate.js` both protect against double initialization through `window.__NABLA_GOOGLE_TRANSLATE_STARTED`.

## Analytics Modes (`site-analytics.js`)

Use `data-analytics-mode` on the script tag:

- `vercel` (default): Vercel analytics + Vercel speed insights.
- `full`: GTM + GA4 + VWO + PostHog + Heap + Datadog RUM + Vercel.
- `marketing`: same as `full` without Datadog RUM.
- `home`: Mixpanel + everything in `full`.

Optional analytics attributes:

- `data-ahrefs-key`: adds Ahrefs Web Analytics.
- `data-gtm-id`: override GTM container.
- `data-ga-measurement-id`: override GA4 measurement id.

Programmatic fallback is also supported through `window.NABLA_ANALYTICS_PRESET`.

### Verified page examples

- `home`: `public/index.html`
- `full`: `public/link.html`, `public/nabla.html`, `public/cv/index.html`
- `marketing`: `public/truenas.html`, `public/freenas.html`
- `vercel`: `public/ai.html`, `public/contact.html`, `public/security.html`, `public/pricing.html`

## Shared UI Attributes (`site-widgets.js`)

Frequently used attributes:

- `data-print-pdf`: inject print button.
- `data-no-print-pdf`: disable print button.
- `data-coffee-fab`: inject support floating action button.
- `data-no-coffee-fab`: disable support button.
- `data-axeptio`: load Axeptio consent SDK.
- `data-no-google-translate`: skip translate bootstrap.
- `data-no-scroll-reveal`: disable reveal animations.
- `data-minimal-chrome`: minimal UI mode (no theme toggle button, no translate, no print, no back-to-top, no Axeptio).

Default behavior to remember:

- Back-to-top is injected unless disabled (`data-no-back-to-top`).
- Intercom is only loaded when `data-intercom-app-id` is set.
- Theme preference is stored under `site-theme-preference` and reflected via `data-theme` on `<html>`.

### Verified page examples

- Standard page with print/coffee/consent: `public/index.html`, `public/contact.html`
- Checkout pages suppressing print/coffee: `public/checkout.html`, `public/cancel.html`
- Minimal chrome mode: `public/404.html`

## Homelab Service Cards Runtime

`public/truenas.html` and `public/nabla.html` now render service cards from JSON at runtime instead of hardcoding each card in HTML.

### Runtime flow

1. Page defines one or more roots using `data-homelab-services-root`.
2. `public/homelab-services-render.js` fetches JSON (`homelab-services.json` by default, or `data-homelab-json` override).
3. Script renders a responsive card grid with Internal and Tunnel actions for each service (optional `fa-lock` spans when `internalSecure` / `tunnelSecure` are true and the URL is `https:`).
4. After render, the script calls `window.initHomelabServiceCardPings()`, `window.initHomelabTlsLockIndicators()`, and `window.initHomelabTunnelTabIndicators()` when available.
5. `public/nabla-service-status.js` runs favicon probes: reachability dots on each button origin, and padlock color (green/red) for each HTTPS lock span (`data-homelab-tls-origin`), with the same false-negative caveats as favicon probing.
6. Tunnel buttons (`data-homelab-reachable-outside`) call `GET /api/homelab-tunnel-check?url=…` (same-origin). The API performs a server-side `HEAD` (fallback `GET` with `Range`) against allowlisted tunnel hosts and returns HTTP status; the client tints the Tunnel button green / yellow / red from status + `reacheableFromOutside`. Static-only hosts without Next return “unknown” (gray) when the API is missing.

### Root attributes (public interface)

- `data-homelab-services-root`: required mount point.
- `data-homelab-variant`: optional, `truenas` or `nabla` (`truenas` default). Controls default internal link tooltip text.
- `data-homelab-json`: optional JSON path, default `homelab-services.json`.

Example:

```html
<div
	data-homelab-services-root
	data-homelab-variant="truenas"
	data-homelab-json="homelab-services.json"
></div>
```

### `homelab-services.json` contract

Top-level payload:

```json
{
	"version": 1,
	"services": []
}
```

Per-service fields used by renderer:

- `name` (required): card title.
- `iconSrc` (optional): path to a **local** image under `assets/` (e.g. `assets/selfh-icons/grafana.png`). Validated: must start with `assets/`, ASCII letters/digits/`._-/`, no `..` or `//`. When set, the card title shows this image instead of Font Awesome. Prefer icons discovered on [selfh.st/icons](https://selfh.st/icons/) and vendored into `public/assets/selfh-icons/` (see `.cursor/rules/506_homelab-selfh-icons.mdc`).
- `icons` (optional): list of Font Awesome classes; validated against `^[\\w.\\- ]+$`. Invalid class falls back to `fas fa-circle`. Used when `iconSrc` is absent or invalid.
- `description` (optional): short summary text.
- `internalHost` + `internalPort` (required for usable internal button): compose internal URL.
- `internalSecure` (optional boolean): `https` when true, `http` when false. When exactly `true` and the built internal URL is `https:`, a padlock icon is rendered on the Internal button and later colored by a client-side probe.
- `tunnelSecure` (optional boolean): metadata paired with `tunnelUrl`; when exactly `true` and the tunnel URL is `https:`, a padlock is shown on the Tunnel button and probed the same way.
- `internalPath` (optional): appended path; if present and missing leading slash, renderer adds it.
- `tunnelUrl` (required for tunnel button): external URL, can be `https://...` or `postgres://...`.
- `reacheableFromOutside` (boolean): public-exposure intent for the tunnel URL. When `true`, a green Tunnel tab requires HTTP **2xx** or **304** from `/api/homelab-tunnel-check` and a successful TLS handshake on the server. When `false`, **yellow** means “blocked or unavailable as expected” (**401**, **403**, **404**, **429**, **502**, **503**, or network failure / status **0**); **red** means an unexpected success (**2xx**/**304**) or another HTTP code. Host allowlist defaults to `*.albandrieu.com`; override with `HOMELAB_TUNNEL_CHECK_HOSTS` (comma-separated hostnames, no scheme).
- Internal and tunnel links always open in a new tab (`target="_blank"` with `rel="noopener noreferrer"`).
- `internalTitle` and `tunnelTitle` (optional): override button tooltip text.
- `portHtml` (optional): custom HTML rendered in card footer (used for protocol-specific hints like Postgres).

### URL-building constraints

- Internal URL falls back to `#` when host/port is missing.
- If `tunnelUrl` starts with `postgres:`, internal URL is generated as `postgres://<host>:<port>/`.
- Internal scheme is selected from `internalSecure`.
- `safeHref()` blocks unsafe values containing `"` or `<` (returns `#`).

### Reachability probe behavior (`nabla-service-status.js`)

- Scope:
  - `.nabla-platforms-section a.nabla-tool-tag-link`
  - `#services a.opensource-link`
  - `.opensource-section a.opensource-link`
  - Homelab card action links in `.truenas-page-apps` and `.nabla-homelab-services`
- Probe method: tries `origin + /favicon.ico`, then `/favicon.png`, then `/apple-touch-icon.png`.
- Concurrency: 5 origins in parallel.
- Timeout: 6500 ms per image probe.
- States:
  - `pending`: gray pulse while probing.
  - `ok`: green dot when favicon load succeeds.
  - `fail`: red dot on timeout/error.
  - `unknown`: non-HTTP targets such as `postgres://`.

Important limitations:

- Probes are best-effort hints only.
- False negatives happen when a service is up but does not expose a favicon or blocks hotlinking.
- LAN-only addresses can fail for remote users even if service is healthy internally.

## Next.js Marketing Slug Bridge

`lib/marketingPages.ts` is the source-of-truth map for root marketing pages exposed as extensionless routes in Next.js.

Workflow:

1. Add or update entry in `MARKETING_PAGES` (slug, `public/*.html` file, extract mode, body class).
2. `app/[locale]/[slug]/page.tsx` generates static params from this map and loads the fragment via `loadPublicHtmlFragment()`.
3. `lib/htmlFromPublic.ts` rewrites internal `.html` links to extensionless paths for runtime navigation.
4. `scripts/normalize-public-html-hrefs.mjs` can bulk-normalize legacy links in `public/` (keep its `FILE_TO_PATH` map in sync with `MARKETING_PAGES` and key root pages).

### Practical constraints

- Keep slugs stable when possible to avoid breaking existing URLs.
- Add both mapping points when introducing a new root page:
  - `lib/marketingPages.ts` (`MARKETING_PAGES`)
  - `scripts/normalize-public-html-hrefs.mjs` (`FILE_TO_PATH`)
- Use relative script paths in `public/*.html`; rewrite tooling is for links, not script `src`.

## Recommended Integration Pattern

Paths below are for `public/*.html` at **site root**. For `public/cv/index.html` use `../theme-toggle.js`, `../site-widgets.js`, etc.; for `public/cv/jusmundi/*.html` use `../../…`. Same rule as shared CSS. Never use `/site-widgets.js`-style root paths for these files.

For content pages in `public/` (root-level HTML):

```html
<script src="theme-toggle.js"></script>
<script src="site-google-translate.js" defer></script>
<script src="site-analytics.js" data-analytics-mode="vercel"></script>
```

End of `<body>` (before `</body>`):

```html
<script
  src="site-widgets.js"
  defer
  data-print-pdf
  data-coffee-fab
  data-axeptio
></script>
```

For minimal utility pages:

```html
<script src="theme-toggle.js"></script>
<script src="site-google-translate.js" defer></script>
<script src="site-analytics.js" data-analytics-mode="vercel"></script>
<!-- … -->
<script src="site-widgets.js" defer data-no-print-pdf data-no-coffee-fab></script>
```

For root `public/404.html` (minimal chrome):

```html
<script src="site-widgets.js" defer data-minimal-chrome></script>
```

## Troubleshooting

Theme toggle not visible:

- Confirm `theme-toggle.js` is present.
- Confirm page is not using `data-minimal-chrome`.

Translate widget missing:

- Check for `data-no-google-translate` or `data-minimal-chrome`.
- If both `site-widgets.js` and `site-google-translate.js` are loaded, only one init runs by design.

Print button missing:

- Confirm `data-print-pdf` is present and `data-no-print-pdf` is not set.

Back-to-top missing:

- Confirm `data-no-back-to-top` is not set.
- Confirm the page does not use `data-minimal-chrome`.

Analytics mode mismatch:

- Verify the exact `data-analytics-mode` value on the page script tag.
- Use page examples above to keep mode selection consistent.

Homelab cards not showing:

- Confirm page contains `data-homelab-services-root`.
- Confirm `homelab-services.json` path resolves (or set `data-homelab-json` explicitly).
- Check browser console for `[homelab-services] Failed to load ...`.
- Validate JSON root includes `services` array.

Homelab service has broken Internal URL:

- Ensure `internalHost` and `internalPort` are present.
- Ensure `internalPath` is a valid path fragment.
- For Postgres services, keep `tunnelUrl` scheme as `postgres://` to get protocol-specific handling.

Status dots missing or stuck pending:

- Confirm `nabla-service-status.js` is loaded on the page.
- Confirm `homelab-services-render.js` runs after DOM is ready and calls ping init.
- If all dots are `fail`, verify browser network access to target origins and favicon availability.

## Migration and Compatibility Notes

- `public/analytics-stubs.js` is deprecated and only exists so legacy pages keep loading `site-analytics.js` in `vercel` mode.
- If you touch an old page, replace `analytics-stubs.js` with direct `site-analytics.js` usage.
- Prefer script attributes over inline third-party snippets to keep runtime behavior centralized.
- `public/truenas-health.js` has been removed; use `public/nabla-service-status.js` as the shared reachability indicator script.
