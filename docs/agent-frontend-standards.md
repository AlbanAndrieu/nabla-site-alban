# Frontend agent standards

Ce document complète `/AGENTS.md` uniquement pour les tâches frontend. Les règles
de branche, sécurité, quality gate, publication et CI de `/AGENTS.md` restent
prioritaires. Charger ce fichier seulement pour HTML/CSS, accessibilité,
responsive, thème, i18n, print/PDF, SEO ou performance frontend.

## Accessibilité et interaction

Conserver WCAG 2.1 AA :

- préférer les éléments HTML natifs ; ARIA seulement quand la sémantique native
  ne suffit pas ;
- images informatives avec `alt` utile, images décoratives avec `alt=""` ;
- contrôles nommés, accessibles au clavier, focus visible et ordre de tabulation
  logique ;
- contraste minimum 4.5:1 pour le texte normal et 3:1 pour le grand texte ;
- labels explicites pour les formulaires et messages d'erreur reliés au contrôle ;
- conserver skip-navigation, `lang` correct et changements de langue explicites.

## Responsive, thème et mouvement

- Concevoir mobile-first et tester les surfaces modifiées sur la matrice projet
  320/375/768/1024/1440.
- Utiliser Grid/Flexbox et des dimensions fluides plutôt que des largeurs rigides.
- Les cibles tactiles doivent rester au moins 44×44 CSS px quand le composant
  existant ne fournit pas déjà une zone équivalente.
- Préserver le contrat de thème existant (`data-theme`, préférence système,
  toggle et persistance) ; utiliser les custom properties plutôt qu'un second
  système de couleurs.
- Respecter `prefers-reduced-motion` et ne pas dégrader l'impression.

## Internationalisation

- Les textes natifs restent dans les catalogues `next-intl`; ne pas dupliquer un
  mécanisme de traduction ni hardcoder une chaîne traduisible dans un composant.
- Conserver les métadonnées de langue, les propriétés CSS logiques et les APIs
  `Intl.*` pour dates/nombres.
- Prévoir l'expansion du texte et préserver l'architecture actuelle des routes
  anglaises sans préfixe et françaises sous `/fr`.

## SEO, crawlers et social

- `lib/sitePageCatalog.ts` est la source de vérité des pages SEO ;
  `app/sitemap.ts` génère le sitemap. Ne pas ajouter de sitemap statique
  concurrent sous `public/`.
- Préserver canonical, `hreflang`, robots/indexabilité et l'origine canonique
  `https://www.albanandrieu.com`.
- Garder `unit-tests/sitePageCatalog.test.ts` et
  `tests/seo-indexing.spec.ts` alignés avec tout changement de politique.
- Une page indexable garde un titre/description utiles, une hiérarchie de titres
  correcte et du contenu crawlable sans dépendance JS inutile.
- Conserver les métadonnées Open Graph/Twitter utiles et des images sociales
  adaptées ; valider un changement social seulement lorsque ce périmètre est touché.
- Les anciennes URL SEO `.html` suivent le contrat durable de
  `docs/seo-url-migration.md`.

## Print / PDF

`public/print.css` reste autoritaire pour les documents legacy qui l'utilisent.
Préserver lisibilité, marges/page-size existantes, sauts de page et URLs imprimées.
Une action d'impression doit rester accessible et utiliser le flux existant.

## Code, styles et assets

- Réutiliser composants, primitives, styles et assets existants avant d'en créer
  de parallèles.
- Garder les styles proches de leur composant ou dans l'emplacement historique
  déjà autoritaire ; éviter `!important` sauf intégration legacy justifiée.
- Ne pas réintroduire Tailwind/PostCSS comme raccourci : leur retrait est un
  invariant du projet. Bootstrap reste une dette séparée à réduire progressivement.
- TypeScript/ESLint configurés dans le dépôt sont l'autorité ; commentaires/JSDoc
  servent les comportements non évidents, pas le code trivial.
- Les assets publics restent dans la hiérarchie existante `public/assets/` ou
  l'emplacement feature déjà établi ; ne pas dupliquer un asset pour contourner
  un problème d'import.

## Performance

- Optimiser à partir de mesures : budgets Playwright, Lighthouse reproductible ou
  métriques runtime, pas d'une intuition isolée.
- Préserver lazy loading et dimensions intrinsèques des images ; prioriser
  explicitement seulement les ressources réellement critiques.
- Éviter bibliothèques et scripts tiers redondants. Les intégrations non critiques
  doivent rester différables/optionnelles quand l'architecture le permet.
- Ne pas contourner les optimisations Next.js par des sources hand-minifiées ou
  un pipeline parallèle.

## Validation

- Exécuter d'abord le test/lint le plus proche, puis la gate canonique décrite
  dans `/AGENTS.md`.
- Pour un changement visible : conserver accessibilité, thème clair/sombre,
  responsive et reduced-motion.
- Pour routing/SEO : vérifier routes, redirects, canonical, `hreflang`, sitemap
  et robots selon `tests/seo-indexing.spec.ts`.
- Pour une régression navigateur, Playwright et ses traces/screenshots sont les
  preuves de diagnostic privilégiées.
- Ne jamais déclarer un navigateur, device, audit externe ou déploiement validé
  s'il n'a pas réellement été exécuté.
