# Feuille de route produit, qualité et refactoring

Dernière vérification : 26 août 2026.

Ce document est la source de vérité unique pour les améliorations du site. Un lot
n'est considéré comme terminé que lorsque les contrôles pertinents, la CI sur la
branche finale et le déploiement Vercel sont validés.

## État validé au 26 août 2026

- [x] `master` compile avec le build Next.js de production dans la CI.
- [x] La CI Quality/Security s'exécute sur les PR et sur les pushes pertinents de
  `master`.
- [x] Le dernier `master` validé est déployé avec un statut Vercel réussi.
- [x] Les pages d'accueil EN/FR et `/fr/truenas` répondent en production.
- [x] Les graphes Architecture affichent les icônes du catalogue, le contraste
  dark-mode renforcé et les états runtime TrueNAS réconciliés.
- [x] Les métadonnées sociales EN/FR couvrent les principales pages SEO et les
  cartes Open Graph/Twitter sont générées localement.
- [x] Le catalogue homelab distingue déclaration, observation runtime et santé.
- [ ] Le connecteur de logs runtime Vercel doit être revalidé lorsqu'il est
  disponible ; il était indisponible lors du contrôle du 26 août.

## P0 — Cohérence produit et contenu

- [ ] Aligner les informations professionnelles entre l'accueil, `/contact`, `/cv`
  et leurs traductions : statut indépendant, périodes d'expérience et temps
  verbaux doivent raconter la même chronologie.
- [ ] Supprimer les anciennes traductions/props Jus Mundi devenues mortes ; ne pas
  réintroduire de dictionnaire local dans les composants.
- [ ] Vérifier les contenus EN/FR prioritaires pour supprimer les formulations
  obsolètes héritées de la période Jus Mundi.
- [ ] Maintenir les pages utilisées aussi dans `nabla-site-bababou` à parité
  uniquement lorsqu'elles doivent volontairement être identiques.

## P0 — Achever la migration Next.js native

- [x] Migrer le routage principal vers l'App Router et `next-intl`.
- [x] Migrer les URL SEO principales vers des routes canoniques sans `.html`.
- [x] Consolider les pages Nabla/TrueNAS et retirer leurs runtimes historiques.
- [ ] Migrer `/security` de `PublicHtmlFragment` vers des composants React natifs.
- [ ] Supprimer D3 v3 chargé depuis CDN et remplacer `arf.js` par une
  implémentation moderne intégrée au bundle après la migration Security.
- [ ] Finir la migration du contenu historique encore nécessaire sur `/ai` et
  recentrer la page sur l'architecture Secure AI actuelle.
- [ ] Migrer les derniers fragments nécessaires de `/workstation`.
- [ ] Migrer les variantes `cv-{small,medium,large,full}-*.html` avant de
  supprimer `loadCvHtmlFragment`.
- [ ] Réduire puis supprimer `PublicHtmlFragment` lorsqu'il n'a plus de
  consommateur justifié.

## P0 — Design system et cohérence UI/UX

- [x] Introduire des design tokens partagés de base pour les pages Next.js.
- [x] Renforcer les tokens/contrastes spécifiques aux graphes Architecture et à
  la page TrueNAS dark-mode.
- [ ] Normaliser les tokens globaux pour couleurs, surfaces, espacements, rayons,
  typographie et états success/warning/danger.
- [ ] Introduire les primitives `Button`, `Card`, `Container`, `Section`, `Badge`,
  `ExternalLink` et `PageHeader` sous `components/ui/`.
- [ ] Migrer le footer et `RouteHeader` vers ces primitives avant les composants
  spécifiques aux pages.
- [ ] Réduire progressivement le mélange Bootstrap + CSS historique et les
  feuilles globales chargées dans le layout.
- [ ] Supprimer les styles inline de layout lorsque les primitives partagées les
  couvrent.
- [ ] Vérifier mobile, tablette et desktop pour les principales pages après
  chaque migration visible.

## P0 — Empêcher une nouvelle régression de merge

Ce P0 reste volontairement le dernier des P0 et le dernier lot de l'ordre de
livraison, comme demandé. Les garde-fous déjà introduits restent actifs pendant
les autres chantiers.

- [x] Ajouter `npm run build` à la CI avant merge.
- [x] Rejouer le workflow Quality/Security sur `master` après merge.
- [x] Réparer les régressions SEO post-merge qui empêchaient le build Vercel.
- [x] Consolider la politique metadata sociale et conserver une façade de
  compatibilité pour les anciens imports.
- [x] Aligner canonical, sitemap et Open Graph sur le host de production final.
- [ ] Ajouter un ruleset GitHub rendant Quality/Security obligatoire avant merge
  afin qu'une PR rouge ou un ancien run vert ne puisse plus casser `master`.
- [ ] Ajouter un smoke test post-déploiement sur accueil EN/FR, `/truenas`,
  `/architecture`, `/contact`, `/api/homelab-status` et les cartes sociales.

## P1 — Architecture et homelab runtime

- [x] Consommer la topologie déclarée issue de `nabla-compose`.
- [x] Afficher les icônes déclarées par le catalogue avec fallback lisible.
- [x] Consommer `/api/homelab/status` via un proxy Next sans exposer les secrets
  TrueNAS au navigateur.
- [x] Distinguer `in_sync`, `declared_only`, `binding_conflict`,
  `runtime_unknown`, `not_observed` et les workloads `observed_only`.
- [x] Signaler les snapshots runtime périmés (`stale`) séparément d'un runtime
  fraîchement observable.
- [ ] Réconcilier la santé de chaque service depuis les preuves HTTP directes,
  le runtime TrueNAS et les ingress Cloudflare plutôt que depuis un probe unique.
- [ ] Rafraîchir automatiquement le snapshot de santé dans l'UI en conservant le
  dernier état valide pendant une panne transitoire du backend.
- [ ] Afficher explicitement la preuve ayant conduit à vert/orange/rouge et l'âge
  du snapshot afin qu'un ancien état vert ne soit jamais interprété comme live.
- [ ] Revalider le graphe de production après chaque évolution importante du
  catalogue `nabla-compose` / du contrat `fastapi-sample`.
- [ ] Ajouter un test de contrat couvrant explicitement les nouveaux workloads
  multi-services (par exemple Elasticsearch/Kibana) et les services auxiliaires
  qui ne doivent pas devenir des nœuds fonctionnels par erreur.

## P1 — Accessibilité

### Shared `SkipToMainContent`

Déjà migrés :

- [x] accueil
- [x] AI
- [x] FreeNAS
- [x] TrueNAS
- [x] Workstation
- [x] Email
- [x] Expertise
- [x] CISO
- [x] Pricing
- [x] Nabla
- [x] Architecture
- [x] Jus Mundi
- [x] Checkout TJM
- [x] CV catch-all
- [x] Startup / Startup Thanks

Restant :

- [ ] Security lors de sa migration native.
- [ ] Link si le markup manuel subsiste après vérification.
- [ ] `components/payments/PaymentShell.tsx` si le shell expose encore son propre
  markup de skip-link.

Critères d'acceptation : un composant partagé, aucun markup de skip-link dupliqué,
chaque page expose `<main id="main-content">`, et des tests de non-régression.

Autres contrôles :

- [ ] Exécuter un audit axe complet des pages prioritaires en anglais et français.
- [ ] Étendre la vérification du focus visible et de la navigation clavier.
- [ ] Vérifier `prefers-reduced-motion` pour React Flow et les interactions
  animées.

## P1 — Page AI : passer du catalogue à la preuve d'expertise

- [ ] Organiser la page autour d'une architecture Secure AI : identité/RBAC,
  LiteLLM gateway, inference locale/distante, PII/secrets, MCP, RAG,
  observabilité, FinOps et gouvernance.
- [ ] Réutiliser les données/topologies déjà présentes plutôt que créer un second
  catalogue statique spécifique à la page AI.
- [ ] Conserver les catalogues d'outils comme contenu secondaire et non comme
  structure principale.
- [ ] Relier explicitement les choix de plateforme à ISO 27001, ISO 42001 et aux
  contraintes GDPR lorsque pertinent.

## P1 — Sécurité applicative

- [x] Construire les URL de retour Stripe depuis une origine contrôlée côté
  serveur et non depuis le header `Host` client.
- [ ] Évaluer un rate limiting adapté à `create-checkout-session`.
- [ ] Vérifier la validation `Origin` des POST initiés par navigateur.
- [ ] Ajouter les webhooks Stripe signés lorsqu'un paiement déclenche un état
  métier côté serveur.
- [ ] Durcir progressivement la CSP pendant la suppression de Bootstrap/CDN et
  des scripts/styles historiques.

## P1 — SEO et i18n

- [x] Centraliser catégories, indexabilité et priorité dans
  `lib/sitePageCatalog.ts`.
- [x] Générer sitemap, canonical et variantes linguistiques depuis les mêmes
  conventions.
- [x] Migrer les principales URL SEO vers des routes sans extension.
- [x] Ajouter Open Graph/Twitter, locales `en_US`/`fr_FR`, images 1200×630 et
  métadonnées sociales page-aware.
- [x] Ajouter une image sociale générée localement sans dépendance distante.
- [x] Consolider `socialMetadata` et conserver `siteMetadata` comme façade de
  compatibilité.
- [ ] Contrôler après déploiement canonical, `hreflang`, robots, sitemap et
  aperçus Open Graph sur le host final `www`.
- [ ] Vérifier puis rediriger/retirer proprement les anciennes URL `.html` encore
  indexées par les moteurs (`security.html`, `contact.html`, etc.).
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
- [ ] Remplacer progressivement Bootstrap CDN et Bootstrap Icons par les
  primitives/styles réellement utilisés afin de réduire CSS tiers et CSP.
- [ ] Exécuter l'audit des dépendances, licences et paquets inutilisés.
- [ ] Évaluer Knip pour détecter fichiers, exports et dépendances morts.
- [ ] Supprimer les props, composants et feuilles historiques sans consommateur
  confirmé.

## P2 — CI/CD et Vercel

- [x] Exécuter Playwright sur le Preview Vercel au lieu de rebuilder Next.js dans
  le workflow E2E.
- [x] Utiliser `repository_dispatch: vercel.deployment.success` pour le hand-off
  Preview → Playwright.
- [x] Retirer le fallback OIDC et le chemin `deployment_status` devenus inutiles.
- [x] Exécuter lint, type-check, unit tests et `npm run build` dans Quality/Security.
- [x] Exécuter Quality/Security sur `master` après merge.
- [ ] Configurer un ruleset GitHub avec Quality/Security comme check requis.
- [ ] Réduire encore les déploiements Preview inutiles, notamment pour les
  changements docs-only et les commits intermédiaires d'une même PR.
- [ ] Valider la suite Playwright complète sur Chromium, Firefox, WebKit et les
  profils mobiles seulement lorsque cela apporte une couverture complémentaire.
- [ ] Rétablir une vérification automatisable des logs runtime Vercel lorsqu'un
  connecteur/endpoint de logs est disponible dans l'environnement d'audit.

## P2 — Documentation et maintenance

- [x] Documenter l'architecture Next.js/Vercel, l'i18n, la migration SEO et le
  catalogue homelab.
- [x] Consolider `docs/todo.md` dans cette feuille de route unique.
- [ ] Supprimer ou archiver les runbooks qui ne décrivent plus aucun runtime
  actif.
- [ ] Garder les PR de refactoring petites et thématiques afin d'éviter les
  branches de migration à plusieurs dizaines de commits.

## Ordre de livraison réévalué

1. Santé homelab : réconciliation HTTP + TrueNAS + Cloudflare, auto-refresh et
   âge/preuve du snapshot.
2. Cohérence du contenu professionnel et suppression des données mortes Jus Mundi.
3. Design system partagé : tokens globaux puis primitives Footer/RouteHeader.
4. Migration native de `/security`, retrait D3 v3/`arf.js` et durcissement CSP.
5. Recentrage `/ai` sur Secure AI en réutilisant la topologie existante.
6. Accessibilité axe/clavier/reduced-motion sur les pages prioritaires.
7. Workstation/CV legacy, code mort, Bootstrap/CDN et budgets performance.
8. **P0 — empêcher une nouvelle régression de merge**, en dernier comme demandé,
   puis conserver ces garde-fous pour tous les travaux ultérieurs.

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
le rendu déployé. Sur `master`, le build Quality/Security et le statut Vercel
doivent tous les deux être verts.
