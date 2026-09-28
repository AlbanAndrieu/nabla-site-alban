# SEO routing and redirect contract

Migration initiale : 23 août 2026.

Ce document conserve le **contrat durable** de routage SEO. La chronologie
complète de la migration reste dans Git.

## URL canoniques

- L'anglais est la locale par défaut, sans préfixe : `/nabla`, `/truenas`,
  `/expertise`.
- Le français utilise `/fr` : `/fr/nabla`, `/fr/truenas`,
  `/fr/expertise`.
- `/en/...` et les variantes `.html` ne sont jamais canoniques pour une page
  SEO maintenue.
- Canonical, `hreflang`, sitemap et liens internes maintenus utilisent
  directement les URLs sans extension.

Les slugs migrés incluent `expertise`, `contact`, `security`, `ai`,
`ciso`, `truenas`, `link`, `email` et `nabla`. Les CV et autres pages
legacy non indexables suivent leur propre contrat tant qu'ils ne sont pas migrés.

## Invariants

Pour chaque page localisée indexable :

1. canonical auto-référent et sans extension ;
2. `hreflang="en"` vers l'URL anglaise sans préfixe ;
3. `hreflang="fr"` vers la variante `/fr/...` ;
4. sitemap limité aux URLs canoniques et alternates localisées ;
5. navigation interne directe, sans passer par un redirect ;
6. ancienne URL `.html` → redirect permanent direct vers la canonical finale,
   sans chaîne ;
7. les pages legacy non indexables restent hors sitemap.

`lib/sitePageCatalog.ts`, `app/sitemap.ts`,
`unit-tests/sitePageCatalog.test.ts` et `tests/seo-indexing.spec.ts` portent
les contrats exécutables.

## Durée de vie des redirects

Les redirects `.html` transfèrent les signaux SEO. Les conserver au minimum
jusqu'au **23 août 2027**, puis vérifier Search Console et les logs d'accès avant
toute suppression. Ne jamais remettre ces URLs dans canonical ou sitemap pendant
cette période.

Aucun *Change of Address* Search Console n'est requis : il s'agit d'une migration
de chemins sur le même domaine.

## Validation

Avant merge/déploiement d'un changement de routing/SEO :

```bash
npm run build
npx playwright test tests/seo-indexing.spec.ts --project=chromium
```

Vérifier en plus que :

- `/sitemap.xml` n'expose aucune URL SEO `.html` ;
- canonical et `hreflang` EN/FR sont réciproques ;
- les anciennes URLs migrées retournent un redirect permanent direct ;
- les pages indexables restent indexables et les pages explicitement legacy/noindex
  restent hors sitemap.

Après une modification SEO significative en production, contrôler un échantillon
d'URLs sur l'origine canonique `www`, puis suivre indexation, redirects et
crawl errors dans Search Console.
