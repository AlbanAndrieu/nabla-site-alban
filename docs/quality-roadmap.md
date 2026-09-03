# Feuille de route produit, qualité et refactoring

Dernière vérification : 3 septembre 2026.

Ce document est la source de vérité unique pour les améliorations du site. Un lot
n'est considéré comme terminé que lorsque les contrôles pertinents, la CI sur la
branche finale et le déploiement Vercel sont validés.

## État validé au 3 septembre 2026

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
- [x] Le connecteur de logs de build Vercel est de nouveau exploitable pour les
  validations ciblées ; les logs runtime restent à revalider séparément.
- [x] Les composants partagés `RouteHeader`, `LocaleSwitcher`, Footer et
  `ContactHero` utilisent désormais les tokens/primitives Next.js sans dépendre
  de Bootstrap pour leur présentation principale.
- [x] Les variantes historiques `cv-{small,medium,large,full}-*.html` sont une
  exception statique intentionnelle et restent des documents HTML autonomes.
- [x] Les six pages de policy sont natives, disposent d'un index `/policy`, de
  canonical/hreflang propres et restent compatibles avec les anciennes URL HTML.
- [x] Les diagnostics homelab distinguent désormais l'échec courant des preuves
  `last_good`/stale et conservent l'âge, le cache et la provenance des observations.

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
- [x] Supprimer D3 v3 chargé depuis CDN et remplacer `arf.js` par une
  implémentation React intégrée au bundle ; `arf.json` reste une entrée de données
  uniquement, couverte par `unit-tests/securityRuntime.test.ts`.
- [ ] Finir la migration du contenu historique encore nécessaire sur `/ai` et
  recentrer la page sur l'architecture Secure AI actuelle.
- [ ] Migrer les derniers fragments nécessaires de `/workstation`.
- [x] Conserver `cv-{small,medium,large,full}-{en,fr,de,no}.html` comme documents
  historiques simples et autonomes sous `public/cv/`. Ils sont explicitement
  exclus de la migration React/Next.js native ; voir `public/cv/README.md` et le
  test de contrat `unit-tests/legacyCvStaticPolicy.test.ts`.
- [ ] Évaluer uniquement si le wrapper localisé `loadCvHtmlFragment` reste utile
  pour la compatibilité App Router. Sa suppression éventuelle ne doit jamais
  imposer de migrer les documents HTML historiques eux-mêmes.
- [ ] Réduire puis supprimer `PublicHtmlFragment` lorsqu'il n'a plus de
  consommateur justifié, hors exceptions statiques explicitement documentées.

## P0 — Design system et cohérence UI/UX

- [x] Introduire des design tokens partagés de base pour les pages Next.js.
- [x] Renforcer les tokens/contrastes spécifiques aux graphes Architecture et à
  la page TrueNAS dark-mode.
- [ ] Auditer l'ensemble des pages en thème clair et sombre et supprimer les
  combinaisons incohérentes issues du mélange Bootstrap/CSS historique (par
  exemple texte clair forcé sur surface Bootstrap claire).
- [x] Définir les tokens sémantiques Next.js `surface`, `surface-muted`,
  `text-primary`, `text-secondary`, `border`, `link`, `success`, `warning` et
  `danger` en les adossant au contrat `theme.css` existant.
- [ ] Valider systématiquement le contraste WCAG AA de ces tokens sur les pages
  prioritaires en thème clair, sombre et préférence système.
- [ ] Ajouter une vérification visuelle automatisée light/dark sur les pages
  prioritaires (`/`, `/truenas`, `/architecture`, `/ai`, `/contact`, `/cv`) afin
  d'empêcher les régressions de contraste lors des migrations Bootstrap/CSS.
- [ ] Normaliser les tokens globaux pour couleurs, surfaces, espacements, rayons,
  typographie, ombres et états success/warning/danger.
- [x] Introduire les primitives `Container` et `ExternalLink` ainsi que la
  primitive d'action partagée utilisée par le Footer et les CTA migrés.
- [ ] Introduire les primitives restantes `Button`, `Card`, `Section`, `Badge` et
  `PageHeader` seulement lorsqu'un consommateur réel permet d'éviter des
  composants abstraits inutilisés.
- [x] Migrer le Footer, `RouteHeader`, `LocaleSwitcher` et `ContactHero` vers les
  tokens/primitives partagés avant les composants spécifiques aux pages.
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

- [x] Interdire explicitement aux agents toute écriture, création/suppression de
  fichier, push ou mise à jour de ref directement sur `master` ; chaque mutation
  distante doit cibler une branche non-default explicite puis passer par une PR,
  y compris pour les changements triviaux ou docs-only (`AGENTS.md` et
  `CONTRIBUTING.md`).
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
- [x] Réconcilier la santé de chaque service depuis les preuves HTTP directes,
  le runtime TrueNAS et les ingress Cloudflare plutôt que depuis un probe unique ;
  les preuves restent séparées et le resolver partagé décide de l'état local.
- [x] Propager les dépendances `strength=required` fournies par `fastapi-sample`
  dans l'état final : distinguer `local_state`, `dependency_state` et
  `effective_state`, puis afficher `required_dependencies`, `blocked_by` et les
  preuves ayant provoqué la dégradation.
- [x] Utiliser `effective_state` comme couleur principale des cartes/nœuds tout en
  conservant un indicateur local/runtime afin qu'un service `RUNNING` mais bloqué
  par PostgreSQL, ClickHouse, Redis, MinIO ou une autre dépendance requise soit
  explicitement affiché comme dégradé.
- [x] Unifier la politique de santé des diagrammes React Flow et de la grille des
  services avec un resolver partagé ; les dépendances requises portent l'état de
  leur cible et les relations optionnelles restent secondaires.
- [x] Classer les services par criticité (`foundation`, `shared-data`,
  `shared-platform`, `application`, `support`) et afficher un blast radius
  transitif sans hardcoder les IDs des services.
- [x] Fournir un drill-down d'impact distinguant dépendants directs, impact
  transitif et chemin de dépendances requis dans la vue de criticité partagée.
- [ ] Compléter les relations d'hébergement/runtime dans la topologie autoritative,
  notamment `service -> Docker/runtime -> TrueNAS`, uniquement lorsque la
  configuration réelle les prouve.
- [ ] Faire refléter ces couches d'hébergement dans le React Flow détaillé avec
  foundations/data/platform/apps clairement étagés et les nœuds à fort blast
  radius visuellement dominants.
- [ ] Ajouter une représentation mobile compacte de cette hiérarchie avec
  collapse/expand et, lorsque pertinent, filtres critical-only et optional-edge.
- [x] Distinguer visuellement les arêtes de dépendance des chemins d'exposition :
  le graphe classe maintenant `dependency`, flux API/données, `exposure`,
  hébergement, observabilité et automatisation, tandis que le contrat réseau
  distingue `HAProxy direct`, `Cloudflare Tunnel`, `LAN/VPN only` et routage
  interne ; les ports structurants `7000`, `10443` et `9922` restent visibles.
- [x] Ne jamais utiliser l'état Cloudflare comme preuve du chemin TrueNAS direct
  `Internet -> pfSense:7000 -> HAProxy -> TrueNAS` : la vue et les tests gardent
  explicitement la preuve Tunnel/Access séparée du chemin direct.
- [x] Centraliser les types/tokens/helpers d'état et les composants de preuve afin
  que `/truenas#homelab`, `/architecture` et les futurs graphes ne développent pas
  des conventions de couleurs divergentes. Voir `docs/homelab-dependency-health-ui.md`
  et l'issue #89.
- [x] Rafraîchir automatiquement le snapshot de santé dans l'UI toutes les 30 s,
  suspendre les polls quand l'onglet est masqué et conserver le dernier état
  valide pendant une panne transitoire du backend.
- [x] Afficher explicitement la preuve ayant conduit à vert/orange/rouge et l'âge
  du snapshot : l'UI distingue état courant, fraîcheur/cache, erreur de refresh et
  dernière preuve saine `last_good` afin qu'un ancien état vert ne soit pas lu
  comme une observation live.
- [ ] Revalider le graphe de production après chaque évolution importante du
  catalogue `nabla-compose` / du contrat `fastapi-sample`.
- [ ] Ajouter un test de contrat couvrant explicitement les nouveaux workloads
  multi-services (par exemple Elasticsearch/Kibana) et les services auxiliaires
  qui ne doivent pas devenir des nœuds fonctionnels par erreur.
- [ ] Ajouter une couverture visuelle/Playwright light/dark/mobile des états
  `healthy`, `degraded`, `failed`, `stale` et `unknown` après migration des
  diagrammes vers le resolver partagé.

## P1 — Résilience DNS et politique de résolution

- [ ] Sauvegarder/exporter la configuration pfSense avant la réactivation complète
  de CrowdSec, pfBlockerNG et Snort et avant toute nouvelle modification réseau ;
  conserver une copie datée hors du firewall permettant un rollback rapide.
- [ ] Revoir la politique DNS du LAN en gardant pfSense/Unbound disponible
  indépendamment de TrueNAS Apps, afin qu'un arrêt Docker/TrueNAS ne provoque plus
  une panne DNS globale malgré un routage Internet fonctionnel.
- [ ] Définir explicitement le rôle de Pi-hole et d'AdGuard Home : filtrage en
  amont/aval d'Unbound, résolution client-facing ou service secondaire, sans
  laisser l'ordre DNS annoncé par DHCP créer un contournement aléatoire du
  filtrage selon les clients.
- [ ] Si Pi-hole/AdGuard restent directement annoncés aux clients, fournir deux
  résolveurs sur des domaines de panne distincts ; deux conteneurs sur le même
  TrueNAS ne constituent pas une vraie redondance.
- [ ] Documenter DHCP DNS, zones locales, DNSSEC, conditional forwarding,
  comportement de failover et responsabilité des enregistrements internes.
- [ ] Ajouter des tests de panne : TrueNAS arrêté, Docker arrêté, Pi-hole arrêté,
  AdGuard Home arrêté, Unbound redémarré et WAN indisponible.
- [ ] Faire remonter dans la santé homelab la disponibilité DNS et la conformité
  de la politique, pas seulement l'ouverture des ports DNS.

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
- [x] Security
- [x] Checkout TJM
- [x] CV catch-all
- [x] Startup / Startup Thanks

Restant :

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
  indexées par les moteurs (`security.html`, `contact.html`, etc.), sans inclure
  les CV historiques dont les URL `.html` sont intentionnelles.
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
- [ ] Finaliser le bootstrap Semantic Release `v0.0.1` et vérifier après merge la
  création du tag, du changelog synchronisé et de la GitHub Release sans exiger
  une mutation manuelle de `master`.
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

## P3 — Maintenance pfSense / pfBlockerNG

- [x] Documenter l'incident de pression des services de sécurité pfSense, le
  backpressure CrowdSec, l'OOM PHP pfBlockerNG et les erreurs AutoConfigBackup
  transitoires dans `docs/pfsense-security-services-incident-2026-08-28.md`.
- [x] Désactiver temporairement `ASN Reporting` dans pfBlockerNG afin de supprimer
  l'enrichissement ASN non essentiel au filtrage IP/DNS.
- [ ] Terminer la suppression propre de l'enrichissement ASN pfBlockerNG :
  identifier le chemin restant qui déclenche `iptoasn` malgré `ASN Reporting`
  désactivé, empêcher les téléchargements IPinfo répétés lorsque `asn.mmdb` et le
  token IPinfo sont absents, puis vérifier que `pfblockerng.php asn`, `iptoasn` et
  `Downloading [ IPinfo databases ]` ne réapparaissent plus. Ne pas augmenter le
  `memory_limit` PHP pour masquer la boucle.
- [ ] Revalider la rotation/rétention des logs pfBlockerNG déjà configurés à
  environ 10 000 lignes et traiter séparément les fichiers historiques très
  volumineux (`dns_reply.log`, `unified.log`, `error.log`, `extras.log`) sans
  augmenter les limites.

## Ordre de livraison réévalué

1. Compléter la topologie d'hébergement/runtime à partir des sources autoritatives,
   puis améliorer le React Flow détaillé avec les mêmes niveaux de criticité et
   blast radius déjà utilisés dans la vue partagée.
2. Rendre la hiérarchie Architecture/TrueNAS réellement compacte sur mobile avec
   collapse/expand et filtres ciblés lorsque le graphe dense n'est pas adapté.
3. Revalider régulièrement le graphe de production et ajouter les contrats pour
   workloads multi-services/auxiliaires lorsque la topologie autoritative les expose.
4. Cohérence du contenu professionnel et suppression des données mortes Jus Mundi.
5. Design system partagé : poursuivre l'audit light/dark, les primitives restantes
   et le retrait de Bootstrap après les migrations déjà faites de RouteHeader,
   LocaleSwitcher, Footer et ContactHero.
6. Terminer la migration native de `/security` et le durcissement CSP ; D3 v3 et
   `arf.js` sont déjà retirés du runtime.
7. Recentrage `/ai` sur Secure AI en réutilisant la topologie existante.
8. Accessibilité axe/clavier/reduced-motion sur les pages prioritaires.
9. Workstation, code mort, Bootstrap/CDN et budgets performance. Les CV
   historiques restent volontairement hors de la migration Next.js native.
10. Résilience réseau/DNS : pfSense/Unbound, rôle de Pi-hole/AdGuard Home et tests
    de panne ; ce chantier reste volontairement derrière l'architecture/homelab UI.
11. **P0 — empêcher une nouvelle régression de merge**, en dernier comme demandé,
    puis conserver ces garde-fous pour tous les travaux ultérieurs.
12. **P3 — maintenance pfSense/pfBlockerNG**, hors chemin critique : terminer le
    retrait ASN et nettoyer la rétention historique après le durcissement WAN et
    les travaux réseau prioritaires.

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
