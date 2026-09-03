# Architecture et exploitation

## Runtime principal

Le site est une application Next.js 16 App Router avec React 19, TypeScript et
`next-intl`. Vercel est l'unique cible de déploiement du runtime web principal.
Les anciens runtimes Wrangler, Express et Vercel Functions sous `api/` ont été
retirés : les endpoints applicatifs vivent sous `app/api/**`.

Le root layout est `app/[locale]/layout.tsx`. Il produit l'attribut `lang`, les
métadonnées localisées, le header, le footer et les scripts partagés.

## Routage et langues

- `en` est la langue par défaut, sans préfixe public.
- `fr` utilise `/fr`.
- `proxy.ts` applique la négociation `next-intl` aux routes hors API/assets.
- Les URLs SEO canoniques sont sans extension ; `next.config.mjs` conserve des
  redirections permanentes depuis les anciennes URLs `.html` pendant la
  migration SEO.
- Chaque URL publique possède une route App Router dédiée. Les routes `ai`, `workstation` et certains CV chargent encore temporairement
  des fragments HTML de `public/`. `/security` est désormais entièrement natif.
- Ces fragments passent par `app/components/PublicHtmlFragment.tsx`, frontière
  commune qui centralise l'usage transitoire de `dangerouslySetInnerHTML`.
- `app/global-not-found.tsx` gère les URL inconnues hors du root layout
  dynamique `[locale]` et reste exclu de l'indexation.

## Données et APIs

- `app/api/create-checkout-session/route.ts` : Checkout Stripe hébergé.
- `app/actions/stripe.ts` : session Stripe Embedded Checkout.
- `app/api/github-stars/route.ts` : compteur GitHub, cache d'une heure.
- `app/api/homelab-services/route.ts` : catalogue homelab FastAPI-first avec
  fallback local.
- `app/api/homelab-health/route.ts` : snapshot de santé homelab fourni par
  FastAPI.

Le navigateur ne possède plus de route générique permettant de sonder une URL
publique arbitraire. Les endpoints externes homelab utilisent le snapshot
FastAPI ; les endpoints privés peuvent être sondés localement dans le navigateur
par les composants React dédiés.

## Homelab

`app/components/homelab/` est la seule implémentation active des cartes de
services partagées entre Nabla et TrueNAS :

```text
HomelabServicesSection
  -> HomelabServicesBlock (client)
      -> /api/homelab-services
      -> /api/homelab-health
      -> HomelabServiceGrid
          -> EndpointAction
```

Les pages `/nabla`, `/fr/nabla`, `/truenas` et `/fr/truenas` restent SSG/CDN ;
seul le bloc homelab charge les données dynamiques après hydratation. Une panne
du snapshot santé ne masque pas un catalogue valide.

Les anciens renderers/probes globaux (`homelab-services-render.js`,
`nabla-service-status.js` et `/api/homelab-tunnel-check`) sont retirés. La santé
publique vient du snapshot FastAPI et les sondes privées restent encapsulées
dans les composants React.

## Observabilité

- `instrumentation.ts` initialise OpenTelemetry via `@vercel/otel`.
- `public/site-analytics.js` charge les intégrations navigateur selon
  `data-analytics-mode`.
- Le script analytics est monté par le root layout localisé.

## Vercel et dépendances

- `.vercelignore` exclut les artefacts locaux et le contenu de dépôt inutile au
  build (`docs`, tests, workflows), sans masquer `app/api/**`.
- `scripts/vercel-ignore-build.sh` évite les previews pour les changements de
  documentation/maintenance sans impact runtime ; une modification du workflow
  Playwright reste deploy-relevant afin de disposer d'un preview à tester.
- `vercel` et `next-devtools-mcp` sont des dépendances de développement.
- Wrangler et Express ne font plus partie du graphe npm du projet.

## Contrôles

```bash
npm run lint
npm run lint:css
npm run typecheck
npm run test:unit
npm test
npm run build
```

`npm run check` regroupe les contrôles statiques, unitaires et le build. La
suite Playwright de PR s'exécute contre l'URL exacte du Vercel Preview associé
au commit déployé.

## Dette de migration connue

- Certaines pages injectent encore des fragments HTML via
  `lib/htmlFromPublic.ts`; leur structure est contrôlée en navigateur.
- Plusieurs grandes feuilles CSS et assets historiques sont encore sous
  `public/` et doivent être audités avant suppression.
