# Frontend Runtime Scripts Runbook

## Scope

This runbook documents the shared browser scripts that remain necessary while
legacy `public/*.html` content is progressively migrated to Next.js App Router.
New React pages should prefer typed components and `next-intl` instead of adding
new global scripts.

## Active shared scripts

- `public/site-analytics.js`: analytics and telemetry loaders by mode.
- `public/site-widgets.js`: theme/translate bootstrap, scroll helpers, print,
  back-to-top, coffee FAB, consent and optional Intercom behavior.
- `public/site-google-translate.js`: compatibility bootstrap for legacy pages.
- `public/theme-toggle.js`: early theme preference application.
- `public/analytics-stubs.js`: deprecated compatibility shim.
- `public/nabla-service-status.js`: best-effort favicon reachability hints for
  legacy Nabla tool/open-source links only.

The following former homelab runtimes are retired and must not be reintroduced:

- `public/homelab-services-render.js`
- `components/HomelabServicesScripts.tsx`
- `app/api/homelab-tunnel-check/route.ts`
- homelab globals/callbacks previously exposed by `nabla-service-status.js`

## Analytics modes

Use `data-analytics-mode` on `site-analytics.js`:

- `vercel` (default): Vercel Analytics + Speed Insights.
- `full`: GTM + GA4 + VWO + PostHog + Heap + Datadog RUM + Vercel.
- `showcase`: `full` without Datadog RUM.
- `home`: Mixpanel + everything in `full`.

The Next.js application shell uses `vercel` by default. Set
`NEXT_PUBLIC_ANALYTICS_MODE` explicitly only when the extra vendor cost and
privacy/performance impact are intentional.

## Shared UI attributes

`site-widgets.js` supports the legacy attributes below:

- `data-print-pdf`
- `data-no-print-pdf`
- `data-coffee-fab`
- `data-no-coffee-fab`
- `data-axeptio`
- `data-no-google-translate`
- `data-no-scroll-reveal`
- `data-minimal-chrome`
- `data-no-back-to-top`
- `data-intercom-app-id`

`site-widgets.js` and `site-google-translate.js` guard against duplicate Google
Translate initialization through `window.__NABLA_GOOGLE_TRANSLATE_STARTED`.

## Homelab runtime

Homelab cards are no longer rendered by imperative scripts. Both Nabla and
TrueNAS compose the same React implementation:

```text
app/components/homelab/HomelabServicesSection.tsx
  -> HomelabServicesBlock.tsx
      -> GET /api/homelab-services
      -> GET /api/homelab-health
      -> HomelabServiceGrid.tsx
          -> EndpointAction.tsx
```

Behavior:

- the catalogue is fetched from the same-origin Next API, which is FastAPI-first
  with a repository JSON fallback;
- public endpoint health is authoritative from the FastAPI health snapshot;
- a missing/failed health snapshot degrades health to unknown without hiding a
  valid catalogue;
- private/internal HTTP(S) endpoints may use browser-side reachability probes so
  LAN and `.int` DNS can be evaluated from the user's network;
- there is no generic Vercel tunnel-check API anymore.

`public/homelab-services.json` remains a catalogue fallback during the FastAPI
migration. It is data, not a frontend renderer.

### Catalogue fields

Relevant fields include:

- `name`
- `iconSrc` / `icons`
- `description`
- `internalHost`, `internalPort`, `internalSecure`, `internalPath`
- historical `tunnelUrl` / `tunnelSecure`
- `endpointEnabled`
- `external`: sole exposure flag (`true` public, `false` private/internal)
- `internalTitle` / `tunnelTitle`
- `portHtml`

Exposure and health are independent concepts. A service can be public but down,
or private but healthy from the user's LAN.

## `nabla-service-status.js`

This script has been reduced to its remaining legacy responsibility. It probes
only generic Nabla tool/open-source HTTP(S) links with favicon image requests.
It does **not** manage homelab cards, TLS locks, Cloudflare tunnel state or
FastAPI health.

Probe behavior:

- tries `/favicon.ico`, `/favicon.png`, then `/apple-touch-icon.png`;
- five origins are processed concurrently;
- timeout is 6500 ms per image probe;
- results are best-effort and may produce false negatives when a host has no
  favicon or blocks hotlinking.

Do not extend this script for new React features. Its target state is deletion
after the remaining legacy Nabla HTML consumers are migrated.

## Next.js HTML content migration

Some dedicated App Router routes still load trusted fragments from `public/`
through `lib/htmlFromPublic.ts` (notably `ai`, `security`, `workstation` and some
CV content). `app/components/PublicHtmlFragment.tsx` centralizes that temporary
HTML boundary.

For each migrated page:

1. keep/create `app/[locale]/<slug>/page.tsx`;
2. use a public HTML fragment only as a temporary bridge;
3. replace the fragment with typed React components and localized messages;
4. keep internal URLs, canonical metadata, hreflang and sitemap policy aligned;
5. remove the obsolete public HTML/script dependency when no consumer remains.

SEO-indexable canonical URLs are extensionless. Historical `.html` URLs may
remain only as permanent migration redirects, not as canonical internal links.

## Troubleshooting

### Theme/translate/widgets missing

- confirm the relevant legacy script is loaded only once;
- check `data-minimal-chrome` and the corresponding `data-no-*` attributes;
- on a new App Router page, prefer the shared React/layout implementation over
  adding another script tag.

### Homelab cards missing

- inspect `GET /api/homelab-services`;
- verify the catalogue contains a `services` array;
- a health API failure alone should no longer remove the catalogue from the UI.

### Homelab health unexpected

- inspect `GET /api/homelab-health` and the FastAPI snapshot;
- verify `external` and `endpointEnabled` separately;
- for private endpoints, verify the browser can resolve/reach the LAN hostname.

Do not look for `/api/homelab-tunnel-check`: that endpoint has been retired.

## Migration rule

Every edit to a legacy browser runtime should reduce its scope. New behavior
belongs in App Router components, route handlers or shared typed libraries.
