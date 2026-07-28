# Architecture et exploitation

## Runtime principal

Le site est une application Next.js 16 App Router avec React 19, TypeScript et
`next-intl`. Vercel est la cible du runtime complet ; Wrangler ne sert que les
assets statiques historiques de `public/`.

Le root layout est `app/[locale]/layout.tsx`. Il produit l’attribut `lang`, les
métadonnées localisées, le header, le footer et les scripts partagés.

## Routage et langues

- `en` est la langue par défaut, sans préfixe public.
- `fr` utilise `/fr`.
- `proxy.ts` applique la négociation `next-intl` aux routes hors API/assets.
- `next.config.mjs` conserve les redirections et réécritures des anciennes URLs
  `.html`.
- Chaque URL publique possède désormais une route App Router dédiée. Les routes
  `ai`, `security`, `workstation` et certains CV chargent encore temporairement
  des fragments HTML de `public/`.
- `app/global-not-found.tsx` gère les URL inconnues hors du root layout
  dynamique `[locale]`. Cette page complète reste exclue de l’indexation et
  réutilise le rendu statique de `public/404.html`. Les scripts du fragment sont
  retirés puis montés par Next pour conserver l'observabilité sans doublon.

## Données et APIs

- `app/api/create-checkout-session/route.ts` : Checkout Stripe hébergé.
- `app/actions/stripe.ts` : session Stripe Embedded Checkout.
- `app/api/github-stars/route.ts` : compteur GitHub, cache d’une heure.
- `app/api/homelab-tunnel-check/route.ts` : sondes réseau allowlistées.

## Observabilité

- `instrumentation.ts` initialise OpenTelemetry via `@vercel/otel`.
- `public/site-analytics.js` charge les intégrations navigateur selon
  `data-analytics-mode`.
- Le script analytics est monté par le root layout localisé.

## Contrôles

```bash
npm run lint
npm run lint:css
npm run typecheck
npm run test:unit
npm test
npm run build
```

`npm run check` regroupe les contrôles statiques, unitaires et le build.

## Dette de migration connue

- Certaines pages injectent encore des fragments HTML via
  `lib/htmlFromPublic.ts`.
- Les endpoints historiques de `api/` et `server.cjs` coexistent encore avec
  les Route Handlers Next.js.
- Plusieurs grandes feuilles CSS sont encore chargées globalement.
- Les tests navigateur exigent les navigateurs Playwright installés.
