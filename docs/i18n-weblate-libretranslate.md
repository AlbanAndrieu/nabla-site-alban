# Internationalisation

## Architecture runtime

La configuration `next-intl` se trouve dans :

- `i18n/routing.ts` : locales `en` et `fr`, défaut `en`, préfixe `as-needed` ;
- `i18n/request.ts` : chargement de `messages/<locale>.json` ;
- `i18n/navigation.ts` : helpers de navigation localisés ;
- `proxy.ts` : négociation de langue pour les routes hors API et assets ;
- `app/[locale]/layout.tsx` : root layout, `lang`, provider et métadonnées.

Les catalogues `messages/en.json` et `messages/fr.json` doivent toujours avoir
la même structure de clés.

## Ajouter une chaîne

1. Ajouter la clé anglaise dans `messages/en.json`.
2. Ajouter la même clé traduite dans `messages/fr.json`.
3. Utiliser `getTranslations` dans un Server Component ou `useTranslations`
   dans un Client Component.
4. Tester les routes anglaise et française.

## Pont HTML historique

`lib/htmlFromPublic.ts` charge encore certaines pages depuis :

1. `public/locales/fr/<page>.html` pour le français ;
2. `public/<page>.html` comme source anglaise ou fallback.

`app/[locale]/[slug]/page.tsx` injecte ces fragments. Ce mécanisme est
transitoire : préférer un composant React et les catalogues JSON pour toute
nouvelle page.

## LibreTranslate

```bash
npm run i18n:libretranslate
```

Variables :

- `LIBRETRANSLATE_URL` ;
- `LIBRETRANSLATE_API_KEY`, facultative.

Attention : `scripts/translate-with-libretranslate.mjs` réécrit entièrement
`messages/fr.json`. Il ne fusionne pas les traductions existantes. Sauvegarder
et relire le diff avant validation.

## Weblate

- langue source : `en` ;
- langue cible : `fr` ;
- masque : `messages/*.json` ;
- source : `messages/en.json` ;
- sortie française : `messages/fr.json`.

## Validation

```bash
node -e 'const e=require("./messages/en.json"),f=require("./messages/fr.json"); console.log(Object.keys(e), Object.keys(f))'
npm run typecheck
npm run build
```
