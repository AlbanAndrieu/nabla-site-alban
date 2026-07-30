# Feuille de route qualité

Dernière vérification : 30 juillet 2026.

Ce document est la source de vérité pour suivre les lots de modernisation. Un
lot n'est considéré comme terminé que lorsque ses contrôles locaux et CI sont
verts sur la branche de travail.

## Priorité 2 — Achever la migration Next.js (presque terminée)

- [x] Migrer le routage principal vers l'App Router et `next-intl`.
- [x] Conserver les URL historiques `*.html` avec redirections et rewrites.
- [x] Utiliser `global-not-found.tsx` comme unique 404 globale et préserver le
  rendu de `public/404.html`.
- [x] Migrer les pages prioritaires et leurs métadonnées vers React.
- [x] Mettre à niveau vers Next.js 16.3 preview et React 19.2.
- [ ] Remplacer la preview par Next.js 16.3 stable dès sa disponibilité.
- [ ] Valider une build de production et un déploiement Vercel complets.
- [ ] Réduire les derniers fragments HTML historiques lorsque leur migration
  apporte une amélioration mesurable.

## Priorité 3 — Performance et qualité front-end (en cours)

- [x] Centraliser le chargement de `site-widgets.js` dans
  `components/SiteWidgetsScript.tsx`.
- [x] Préserver les configurations par page et leur exécution lors des
  navigations Next.js.
- [x] Remplacer les images locales React pertinentes par `next/image`.
- [x] Supprimer les attentes Playwright fixes, les tests dupliqués et les
  annotations `flaky` non prises en charge.
- [x] Découper et typer les principaux composants expertise et homelab.
- [ ] Mesurer Lighthouse et les Web Vitals sur accueil, expertise, contact, CV
  et homelab, sur mobile et desktop.
- [ ] Réduire les feuilles CSS globales et les dépendances CDN chargées par le
  layout localisé.
- [ ] Auditer le poids des scripts et ressources statiques historiques.
- [ ] Supprimer le chemin obsolète `loadCvHtmlFragment` après vérification de
  ses derniers consommateurs.

## Priorité 4 — SEO et accessibilité (bien avancée)

- [x] Centraliser catégories, indexabilité et priorité dans
  `lib/sitePageCatalog.ts`.
- [x] Générer le sitemap et les variantes linguistiques depuis ce catalogue.
- [x] Indexer volontairement les pages CV, JM et Nabla.
- [x] Exclure les parcours techniques du sitemap et appliquer `noindex`.
- [x] Localiser les métadonnées des pages prioritaires.
- [x] Vérifier les liens d'évitement, titres principaux et libellés des widgets
  principaux.
- [ ] Exécuter un audit axe complet des pages prioritaires en anglais et en
  français.
- [ ] Vérifier contraste, focus visible et navigation clavier.
- [ ] Ajouter les données structurées JSON-LD utiles (`Person`,
  `ProfessionalService` et contenus éditoriaux).
- [ ] Contrôler en production les canonical, `hreflang`, robots, sitemap et
  aperçus Open Graph.
- [ ] Décider explicitement si CTID, FreeNAS et Workstation doivent rejoindre
  les pages indexables.

## Priorité 5 — Tests, CI, documentation et maintenance (en cours)

- [x] Réparer le serveur Playwright CI et le script `start:test`.
- [x] Éviter les collisions de noms d'artefacts GitHub Actions.
- [x] Exécuter lint, typecheck, tests unitaires et Playwright dans des étapes
  explicites.
- [x] Documenter Next.js 16.3, les scripts frontend, l'i18n et l'exploitation.
- [x] Ajouter des règles projet empêchant la régression de la 404.
- [ ] Valider la suite Playwright complète sur Chromium, Firefox, WebKit et les
  profils mobiles.
- [ ] Confirmer tous les workflows GitHub Actions sur le dernier push.
- [ ] Exécuter l'audit des dépendances, des licences et des paquets inutilisés.
- [ ] Découper le travail en commits cohérents avant fusion.

## Contrôles de sortie

```bash
npm run lint
npm run lint:css
npm run typecheck
npm run test:unit
npm test
npm run build
```

Pour une modification Next.js visible, compléter ces commandes avec une
vérification dans un navigateur réel et le diagnostic `/_next/mcp` du serveur
de développement.
