# Feuille de route produit, qualité et refactoring

Dernière vérification : 24 août 2026.

Ce document est la source de vérité unique pour les améliorations du site. Un lot
n'est considéré comme terminé que lorsque les contrôles locaux pertinents, la CI
et le rendu Vercel sont validés.

## P0 — Cohérence produit et contenu

- [ ] Aligner les informations professionnelles entre l'accueil, `/contact`, `/cv`
  et leurs traductions : statut indépendant, périodes d'expérience et temps
  verbaux doivent raconter la même chronologie.
- [ ] Vérifier les contenus EN/FR prioritaires pour supprimer les formulations
  obsolètes héritées de la période Jus Mundi.
- [ ] Maintenir les pages `nabla-site-alban` utilisées aussi dans
  `nabla-site-bababou` à parité lorsqu'elles doivent volontairement être
  identiques, en particulier `/contact`.

## P0 — Achever la migration Next.js native

- [x] Migrer le routage principal vers l'App Router et `next-intl`.
- [x] Migrer les URL SEO principales vers des routes canoniques sans `.html`.
- [x] Consolider les pages Nabla/TrueNAS et retirer leurs runtimes historiques.
- [ ] Migrer `/security` de `PublicHtmlFragment` vers des composants React natifs.
- [ ] Supprimer D3 v3 chargé depuis CDN et remplacer `arf.js` par une
  implémentation moderne intégrée au bundle lorsque la migration Security est
  terminée.
- [ ] Finir la migration du contenu historique encore nécessaire sur `/ai`.
- [ ] Migrer les derniers fragments nécessaires de `/workstation`.
- [ ] Migrer les variantes `cv-{small,medium,large,full}-*.html` avant de
  supprimer `loadCvHtmlFragment`.
- [ ] Réduire puis supprimer `PublicHtmlFragment` dès qu'il n'a plus de
  consommateur justifié.

## P0 — Design system et cohérence UI/UX

- [ ] Introduire des tokens partagés pour couleurs, surfaces, espacements,
  rayons, états success/warning/danger et typographie.
- [ ] Introduire des primitives `Button`, `Card`, `Container`, `Section`,
  `Badge`, `ExternalLink` et `PageHeader` sous `components/ui/`.
- [ ] Migrer le footer et `RouteHeader` vers ces primitives avant les composants
  spécifiques aux pages.
- [ ] Réduire progressivement le mélange Tailwind + Bootstrap + CSS historique.
- [ ] Supprimer les styles inline de layout lorsque les primitives partagées les
  couvrent.
- [ ] Vérifier mobile, tablette et desktop pour les principales pages après
  chaque migration visible.

## P1 — Accessibilité

### Shared SkipToMainContent

- [x] `startup`
- [x] `startup-thanks`
- [ ] `app/[locale]/page.tsx`
- [ ] `app/[locale]/ai/page.tsx`
- [ ] `app/[locale]/security/page.tsx`
- [ ] `app/[locale]/freenas/page.tsx`
- [ ] `app/[locale]/truenas/page.tsx`
- [ ] `app/[locale]/workstation/page.tsx`
- [ ] `app/[locale]/email/page.tsx`
- [ ] `app/[locale]/expertise/page.tsx`
- [ ] `app/[locale]/ciso/page.tsx`
- [ ] `app/[locale]/pricing/page.tsx`
- [ ] `app/[locale]/link/page.tsx`
- [ ] `app/[locale]/nabla/page.tsx`
- [ ] `app/[locale]/checkout-tjm/page.tsx`
- [ ] `app/[locale]/cv/[...path]/page.tsx`
- [ ] `components/payments/PaymentShell.tsx`

Critères d'acceptation : un composant partagé, aucun markup de skip-link dupliqué,
chaque page expose `<main id="main-content">`, et des tests de non-régression.

Autres contrôles :

- [ ] Exécuter un audit axe complet des pages prioritaires en anglais et français.
- [ ] Étendre la vérification du focus visible et de la navigation clavier.
- [ ] Vérifier `prefers-reduced-motion` pour les interactions animées.

## P1 — Page AI : passer du catalogue à la preuve d'expertise

- [ ] Organiser la page autour d'une architecture Secure AI : identité/RBAC,
  LiteLLM gateway, inference locale/distante, PII/secrets, MCP, RAG,
  observabilité, FinOps et gouvernance.
- [ ] Conserver les catalogues d'outils comme contenu secondaire et non comme
  structure principale.
- [ ] Relier explicitement les choix de plateforme à ISO 27001, ISO 42001 et
  aux contraintes GDPR lorsque pertinent.

## P1 — Sécurité applicative

- [x] Construire les URL de retour Stripe depuis une origine contrôlée côté
  serveur et non depuis le header `Host` client.
- [ ] Évaluer un rate limiting adapté à `create-checkout-session`.
- [ ] Vérifier la validation `Origin` des POST initiés par navigateur.
- [ ] Ajouter les webhooks Stripe signés lorsqu'un paiement déclenche un état
  métier côté serveur.
- [ ] Durcir progressivement la CSP au fur et à mesure de la suppression des
  scripts/styles CDN historiques.

## P1 — SEO et i18n

- [x] Centraliser catégories, indexabilité et priorité dans
  `lib/sitePageCatalog.ts`.
- [x] Générer sitemap, canonical et variantes linguistiques depuis les mêmes
  conventions.
- [x] Migrer les principales URL SEO vers des routes sans extension.
- [ ] Contrôler en production canonical, `hreflang`, robots, sitemap et aperçus
  Open Graph.
- [ ] Décider explicitement si CTID, FreeNAS et Workstation doivent être
  indexables.
- [ ] Décider si l'application éditoriale reste volontairement EN/FR ou si DE/NO
  doivent rejoindre progressivement `next-intl`.

## P2 — Performance et dépendances

- [x] Établir une baseline Web Vitals et Lighthouse mobile.
- [x] Réduire fortement le JavaScript tiers chargé par défaut via le mode
  analytique léger.
- [ ] Compléter Lighthouse desktop sur un déploiement stable.
- [ ] Définir des budgets de non-régression pour LCP, CLS, INP, JS, CSS et
  JavaScript tiers.
- [ ] Exécuter l'audit des dépendances, licences et paquets inutilisés.
- [ ] Évaluer Knip pour détecter fichiers, exports et dépendances morts.
- [ ] Supprimer les composants historiques sans consommateur confirmé, par
  exemple les doublons de footer après vérification.

## P2 — CI/CD et Vercel

- [x] Exécuter Playwright sur le Preview Vercel au lieu de rebuilder Next.js dans
  le workflow E2E.
- [x] Utiliser `repository_dispatch: vercel.deployment.success` pour le hand-off
  Preview → Playwright.
- [x] Retirer le fallback OIDC et le chemin `deployment_status` devenus inutiles.
- [ ] Réduire encore les déploiements Preview inutiles : le projet a déjà atteint
  la limite Vercel de plus de 100 déploiements par jour pendant les travaux de
  migration.
- [ ] Valider la suite Playwright complète sur Chromium, Firefox, WebKit et les
  profils mobiles lorsque cela apporte une couverture complémentaire réelle.
- [ ] Confirmer tous les workflows GitHub Actions sur le dernier push avant une
  release importante.

## P2 — Documentation et maintenance

- [x] Documenter l'architecture Next.js/Vercel, l'i18n, la migration SEO et le
  catalogue homelab.
- [x] Consolider `docs/todo.md` dans cette feuille de route unique.
- [ ] Supprimer ou archiver les runbooks qui ne décrivent plus aucun runtime
  actif.
- [ ] Garder les PR de refactoring petites et thématiques afin d'éviter les
  branches de migration à plusieurs dizaines de commits.

## Ordre de livraison recommandé

1. Cohérence du contenu et nettoyage de la roadmap.
2. Design tokens + primitives UI + footer/header.
3. Migration native de `/security` et retrait D3 v3/`arf.js`.
4. Migration finale du legacy AI et recentrage Secure AI.
5. Accessibilité partagée + axe + clavier/focus.
6. Workstation/CV legacy, code mort, CSS et budgets performance.

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
vérification dans un navigateur réel et le diagnostic `/_next/mcp` du serveur de
développement. Sur une PR Vercel, le Playwright Preview E2E reste l'autorité pour
le rendu déployé.
