# Architecture et exploitation

## Runtime principal

Le site est une application Next.js 16.4.2 App Router avec React 19, TypeScript et
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
- Chaque URL publique possède une route App Router dédiée. `/workstation`,
  `/ai` et `/security` sont désormais rendues par des composants React natifs et
  des catalogues `next-intl`; aucune de ces routes n'injecte de fragment HTML
  `public/`.
- La route localisée `app/[locale]/cv/[...path]/page.tsx` conserve
  `loadCvHtmlFragment` comme pont de compatibilité explicitement allowlisté vers
  les CV HTML historiques autonomes de `public/cv/`; ces documents restent la
  source de vérité et ne sont pas migrés vers React par ce wrapper.
- `app/global-not-found.tsx` gère les URL inconnues hors du root layout
  dynamique `[locale]`, reste exclu de l'indexation et conserve l'exception
  explicite `public/404.html` via le loader de fragment statique.
- Workstation reste volontairement non indexable et conserve pour l'instant ses
  URLs canoniques historiques `.html`; la décision SEO d'indexer ou non CTID,
  FreeNAS et Workstation reste un chantier séparé.

## Données et APIs

- `app/api/create-checkout-session/route.ts` : Checkout Stripe hébergé.
- `app/api/github-stars/route.ts` : compteur GitHub, cache d'une heure.
- `app/api/homelab-services/route.ts` : projection catalogue Backstage v2 via FastAPI, sans fallback runtime v1 ; réponse d'erreur expurgée pour SERVICE.
- `app/api/homelab-health/route.ts` : snapshot de santé homelab fourni par
  FastAPI.

Le navigateur ne possède plus de route générique permettant de sonder une URL
publique arbitraire. Les endpoints externes homelab utilisent le snapshot
FastAPI ; les endpoints privés peuvent être sondés localement dans le navigateur
par les composants React dédiés.

## Homelab

`app/components/homelab/` est la seule implémentation active des cartes de
services partagées entre Nabla et TrueNAS. Les vues opérateur sont réservées au
propriétaire (réseau domestique ou Cloudflare Access, voir
[`private-homelab-observability.md`](private-homelab-observability.md#accès-propriétaire-sur-www-amendement-du-20-octobre-2026)) :

```text
HomelabServicesSection (serveur, texte éditorial public)
  -> HomelabPrivateServices (client)
      -> /api/homelab-access          (no-store, booléen)
      -> next/dynamic si autorisé :
          HomelabServicesBlock -> /api/homelab-services, /api/homelab-health…
          HomelabOperationsDisclosure
HomeLabSection -> HomeLabPrivateNetwork -> CloudflareStatusWarning, HomeLabNetworkFlow
architecture/page -> ArchitecturePrivateViews -> explorateur, inspecteur, réseau
  -> C4ArchitectureView (React Flow L1/L2, relations déclarées, aucun verdict runtime)
```

Les pages `/nabla`, `/truenas` et `/architecture` sont rendues en SSG/CDN ;
les projections dynamiques du catalogue et les preuves de sondes se chargent
côté client, après le contrôle de frontière appliqué par les Route Handlers.
`gatedHomelabResponse` interdit par défaut les endpoints OWNER.
**Exception temporaire explicite :** `HOMELAB_PUBLIC_READONLY_ENABLED`
autorise, lorsqu'il est activé, uniquement GET/HEAD des projections SERVICE
`/api/homelab-services`, `/api/homelab-catalog-v2`,
`/api/homelab-health-v2`. Le serveur expurge les erreurs 503 publiques ;
aucune route de sonde OWNER ne devient publique. Voir
[contrat d'accès](homelab-diagnostics-and-access.md) et
[roadmap Site](homelab-roadmap.md) pour le retrait de cette dérogation.

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
- Les déploiements Vercel passent par Git Integration ; le CLI `vercel` local et
  son ancien wrapper `build.sh` sont retirés.
- Next DevTools MCP reste disponible à la demande via les configurations MCP qui
  exécutent `npx -y next-devtools-mcp@latest`, sans dépendance npm locale.
- OpenCommit reste disponible comme helper local/on-demand via `npm run oco` / `npm run opencommit`; aucun workflow OpenCommit n’est actif.
- L’ancienne surface Embedded Checkout non routée est retirée avec
  `@stripe/react-stripe-js` et `@stripe/stripe-js`; le Route Handler de
  Checkout conserve uniquement le SDK serveur `stripe`.
- Wrangler et Express ne font plus partie du graphe npm du projet et `wrangler.jsonc` est retiré.

## Runtime Node.js

Le développement local et GitHub Actions utilisent Node.js 24.22.1 via `.nvmrc`/mise, avec npm 12.2.0 épinglé dans `mise.toml` (source de vérité pour le local, la CI via `jdx/mise-action` et Dagger). `package.json` accepte `>=24.22.1 <25` : Node 24 demeure la seule famille LTS
validée pour ce runtime ; toute migration Node 26 exige une nouvelle preuve
locale/Vercel au même SHA.

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

- Le composant transitionnel `app/components/PublicHtmlFragment.tsx` n'a plus de
  consommateur App Router et est retiré. `lib/htmlFromPublic.ts` reste nécessaire
  pour l'exception statique 404 et d'autres helpers de compatibilité historiques;
  les CV localisés utilisent leur loader allowlisté dédié.
- Plusieurs grandes feuilles CSS et assets historiques sont encore sous
  `public/` et doivent être audités avant suppression.
