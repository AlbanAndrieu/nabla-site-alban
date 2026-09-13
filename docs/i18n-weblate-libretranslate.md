# Internationalisation

## Architecture runtime

La configuration `next-intl` se trouve dans :

- `i18n/routing.ts` : locales `en` et `fr`, défaut `en`, préfixe `as-needed` ;
- `i18n/request.ts` : délègue le chargement à `i18n/messages.ts` ;
- `i18n/messages.ts` : agrège le catalogue global et les catalogues de feature,
  en refusant les collisions de namespaces top-level ;
- `i18n/navigation.ts` : helpers de navigation localisés ;
- `proxy.ts` : négociation de langue pour les routes hors API et assets ;
- `app/[locale]/layout.tsx` : root layout, `lang`, provider et métadonnées.

Les catalogues globaux `messages/en.json` et `messages/fr.json`, ainsi que chaque
paire `messages/<feature>/{en,fr}.json`, doivent conserver la même structure de
clés. Les pages activement migrées peuvent posséder un catalogue de feature
dédié, par exemple `messages/workstation/{en,fr}.json`.

## Ajouter une chaîne

1. Identifier le namespace propriétaire de la chaîne.
2. Ajouter la clé anglaise et sa traduction française dans la même paire de
   catalogues.
3. Utiliser `getTranslations` dans un Server Component ou `useTranslations`
   dans un Client Component.
4. Garder les inventaires techniques stables (IDs, ports, URLs, noms produits)
   dans des modules TypeScript plutôt que de les dupliquer dans les traductions.
5. Tester les routes anglaise et française et la parité de structure.

## Pont HTML historique

`lib/htmlFromPublic.ts` reste un helper de compatibilité pour quelques surfaces
historiques. `/ai`, `/security` et `/workstation` n'injectent plus de fragments
HTML dans leurs routes App Router : elles sont natives et utilisent
`next-intl`.

Les CV HTML détaillés conservent leur loader allowlisté dédié. Le 404 conserve
également son exception statique explicite basée sur `public/404.html`; cette
exception ne doit pas être généralisée à de nouvelles pages.

## LibreTranslate

```bash
npm run i18n:libretranslate
```

Variables :

- `LIBRETRANSLATE_URL` ;
- `LIBRETRANSLATE_API_KEY`, facultative.

Attention : `scripts/translate-with-libretranslate.mjs` réécrit entièrement
`messages/fr.json`. Il ne fusionne pas les traductions existantes. Sauvegarder
et relire le diff avant validation. Les catalogues de feature doivent être
modifiés séparément et ne doivent pas être écrasés par ce script.

## Weblate

- langue source : `en` ;
- langue cible : `fr` ;
- catalogue global : `messages/*.json` ;
- catalogues de feature : `messages/<feature>/*.json` ;
- chaque paire EN/FR doit rester structurellement alignée.

## Validation

```bash
node -e 'const e=require("./messages/en.json"),f=require("./messages/fr.json"); console.log(Object.keys(e), Object.keys(f))'
npm run typecheck
npm run build
```

Les tests de contrat des features complètent cette validation en comparant leurs
clés feuilles EN/FR.
