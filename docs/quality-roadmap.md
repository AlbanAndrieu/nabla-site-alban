# Feuille de route produit, qualité et refactoring

Dernière vérification : 21 septembre 2026.

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
- [x] Les composants partagés `RouteHeader`, Footer et `ContactHero`
  utilisent désormais les tokens/primitives Next.js sans dépendre de Bootstrap
  pour leur présentation principale ; le sélecteur de langue est porté par
  `RouteHeader` et l’ancien `LocaleSwitcher` autonome est retiré.
- [x] Les variantes historiques `cv-{small,medium,large,full}-*.html` sont une
  exception statique intentionnelle et restent des documents HTML autonomes.
- [x] Les six pages de policy sont natives, disposent d'un index `/policy`, de
  canonical/hreflang propres et restent compatibles avec les anciennes URL HTML.
- [x] Les diagnostics homelab distinguent désormais l'échec courant des preuves
  `last_good`/stale et conservent l'âge, le cache et la provenance des observations.

## Contrat de parité `nabla-site-alban` / `nabla-site-bababou`

Dernier audit croisé : 20 septembre 2026, PR Bababou #188 à #198. La règle
commune est **même plateforme et mêmes comportements transverses, contenu métier
distinct**. Une divergence technique doit être intentionnelle, documentée et
justifiée par un consommateur réel ; l'objectif n'est pas de copier une
implémentation plus faible uniquement pour rendre les fichiers identiques.

Doivent converger entre les deux sites :

- versions Node/npm/Next/React/next-intl et politique de compatibilité Vercel ;
- primitives UI réellement consommées, design tokens et conventions responsive ;
- reduced-motion, reflow, focus, touch targets et contrats d'accessibilité ;
- comportements des widgets legacy partagés, notamment thème et retour en haut ;
- sémantique des 404 protégées, exactitude GET/HEAD, noindex et cache négatif ;
- architecture local-first des quality gates, scopes CI, exact-SHA Preview,
  Playwright et DAST/ZAP ;
- politiques de dépendances, assets vendus et réduction des coûts CI.

Peuvent diverger explicitement : contenu et langues, catalogue homelab/TrueNAS,
Stripe/OpenTelemetry/React Flow côté Alban, ainsi que les documents
juridiques/familiaux et contraintes de confidentialité propres à Bababou.

État de convergence après l'audit #188–#198 :

- [x] Le workflow Node 24 de compatibilité production est identique entre les
  deux dépôts et limité aux entrées runtime/build pertinentes (#189).
- [x] Preview et Production ZAP ont une seule autorité de chargement
  `.zap/rules.tsv` et interdisent le double `-c` (#188).
- [x] Reduced-motion et l'API partagée `ActionLink` sont convergents ; Bababou
  #191 a repris ces contrats depuis Alban sans créer de primitives sans consommateur.
- [x] #191 Alban répare la régression `scrollToTopOfPage` du widget statique,
  découverte en comparaison avec Bababou #192, et ajoute une preuve runtime sur
  un footer statique.
- [x] Les 404 HTML top-level interceptées par Alban héritent désormais d'un
  contrat HTTP 404 + `X-Robots-Tag: noindex, nofollow` +
  `Cache-Control: no-store, max-age=0`, aligné sur Bababou #198 sans remplacer
  le routage SEO/legacy spécifique à Alban.
- [ ] Étendre le même contrat GET/HEAD aux chemins HTML legacy localisés/nichés
  seulement après preuve que cela ne court-circuite ni les redirects SEO,
  ni les pages `HTML_ROUTE_SLUGS`, ni les CV historiques.
- [ ] Réutiliser les enseignements image/CLS de Bababou #197 sur les surfaces
  Alban encore réellement servies : dimensions intrinsèques, lazy loading et
  `next/image` pour le natif, sans générer de variantes plus lourdes que la source.
- [x] Maintenir une matrice responsive commune minimale
  320/375/768/1024/1440 px pour les composants partagés ; la couverture
  Workstation exerce désormais les cinq largeurs prioritaires. Ajouter 1920 px
  uniquement lorsqu'un layout concerné apporte une valeur de couverture.
- [ ] À chaque lot transverse, auditer d'abord les PR récentes du dépôt frère et
  backporter uniquement les écarts de plateforme/comportement réellement utiles.

## Convergence `nabla-site-alban` / `nabla-site-bababou`

Principe directeur : les deux sites doivent partager le même socle technique,
les mêmes primitives UI, politiques accessibilité/sécurité, versions de runtime,
quality gates et comportements de déploiement. Les contenus, données, langues
réellement publiées et intégrations métier restent propres à chaque site.

Audit des 10 dernières PR mergées de `nabla-site-bababou` au 20 septembre 2026 :

| PR Bababou | Apport partagé | État côté Alban |
| --- | --- | --- |
| #199 | Publisher Vercel exact-SHA réutilisable localement, `force-with-lease`, scopes maintenance cohérents | Porté/adapté dans #192 ; même helper pour Preview auto et on-demand |
| #198 | 404 legacy GET/HEAD, no-cache et noindex | Top-level aligné dans #191 ; chemins localisés/nichés restent à traiter selon le proxy Alban |
| #197 | Images raster légères, dimensions intrinsèques, lazy/async, réduction CLS | Principe retenu ; audit ciblé des images Alban restant dans P2 performance |
| #195 | Fallback 404 pour `*.html` inconnus sans capturer les vrais fichiers legacy | Équivalent Alban livré via #188/#191 avec `proxy.ts`, implémentation volontairement différente |
| #194 | Migration d'un hub legacy vers App Router/i18n/catalogue SEO | Contenu Bababou spécifique ; pattern déjà appliqué aux migrations natives Alban |
| #193 | Migration native multi-locale + contrat de contraste legacy | Contenu Bababou spécifique ; tokens/contrastes/native routes déjà couverts côté Alban |
| #192 | Back-to-top robuste sur pages statiques | Aligné dans #191 via le widget partagé et reduced-motion |
| #191 | Reflow 200 %, reduced-motion, primitives partagées | Aligné : `app/accessibility.css`, responsive contracts et primitives communes |
| #190 | Responsive mobile/tablette/desktop + safe-area/touch targets | Aligné ; #192 complète la matrice Workstation 320/375/768/1024/1440 |
| #189 | Node 24 limité aux vrais inputs runtime | Déjà aligné et verrouillé par le workflow/contrat Node 24 Alban |

Règle de portage : une amélioration du socle est portée ou explicitement
documentée comme non applicable ; une migration de contenu n'est jamais copiée
pour obtenir artificiellement la parité.

## P0 — Cohérence produit et contenu

- [x] Aligner les informations professionnelles entre l'accueil, `/contact`, `/cv`
  et leurs traductions : l'identité professionnelle affiche désormais
  `Independent / Freelance` depuis 2007, explicitement comme activité parallèle
  aux postes salariés lorsque pertinent. La chronologie des postes et des CV
  courants ferme Jus Mundi à `2022–2026`; les PDF EN/FR ont été régénérés et
  versionnés depuis les sources LaTeX corrigées.
- [x] Supprimer les anciennes traductions/props Jus Mundi devenues mortes :
  le namespace `jm` ne conserve plus le footer historique, les anciens libellés
  de revue non rendus ni le sous-arbre `home` accidentel ; un test EN/FR verrouille
  le contrat actif sans dictionnaire local dans les composants.
- [x] Vérifier les contenus EN/FR prioritaires pour supprimer les formulations
  obsolètes héritées de la période Jus Mundi : les sources Next/i18n actives étaient
  déjà alignées sur l'activité indépendante depuis 2007 et la fin de Jus Mundi en
  2026 ; les pages legacy de transition `public/contact.html`,
  `public/locales/fr/contact.html` et `public/locales/fr/index.html` ne
  présentent plus Jus Mundi comme poste actuel et le contrat
  `professionalCopyConsistency` verrouille cette cohérence.

## P0 — Achever la migration Next.js native

- [x] Migrer le routage principal vers l'App Router et `next-intl`.
- [x] Migrer les URL SEO principales vers des routes canoniques sans `.html`.
- [x] Consolider les pages Nabla/TrueNAS et retirer leurs runtimes historiques.
- [x] Migrer `/security` de `PublicHtmlFragment` vers des composants React natifs.
- [x] Supprimer D3 v3 chargé depuis CDN et remplacer `arf.js` par une
  implémentation React intégrée au bundle ; `arf.json` reste une entrée de données
  uniquement, couverte par `unit-tests/securityRuntime.test.ts`.
- [x] Finir la migration du contenu historique encore nécessaire sur `/ai` et
  recentrer la page sur l'architecture Secure AI actuelle : la route est désormais
  entièrement native Next.js/`next-intl`, sans `PublicHtmlFragment` ni
  `metadataFromPublicHtml`. `AiSecurePlatformOverview` ouvre les sections
  natives avant le catalogue outils/workflows, et les contrats
  `aiI18nContract`/`aiSecurePlatform` verrouillent l'architecture Secure AI et
  la parité EN/FR.
- [x] Migrer les derniers fragments nécessaires de `/workstation`. #186 a retiré le
  dernier fragment App Router legacy et garde le contenu Workstation en React/Next
  natif avec données techniques typées et copie EN/FR versionnée.
- [x] Conserver `cv-{small,medium,large,full}-{en,fr,de,no}.html` comme documents
  historiques simples et autonomes sous `public/cv/`. Ils sont explicitement
  exclus de la migration React/Next.js native ; voir `public/cv/README.md` et le
  test de contrat `unit-tests/legacyCvStaticPolicy.test.ts`.
- [x] Évaluer uniquement si le wrapper localisé `loadCvHtmlFragment` reste utile
  pour la compatibilité App Router : il reste volontairement requis par
  `app/[locale]/cv/[...path]/page.tsx` pour rendre les variantes HTML historiques
  explicitement allowlistées. Leur autonomie sous `public/cv/` reste inchangée
  et un contrat verrouille ce lien de compatibilité sans imposer une migration
  React de ces documents.
- [x] Supprimer `PublicHtmlFragment` une fois ses consommateurs App Router
  migrés. #186 a retiré le composant après la migration native de `/workstation` ;
  le 404 conserve séparément son loader statique documenté et les CV historiques
  restent servis par leur chemin de compatibilité explicitement allowlisté.

## P0 — Design system et cohérence UI/UX

- [x] Introduire des design tokens partagés de base pour les pages Next.js.
- [x] Renforcer les tokens/contrastes spécifiques aux graphes Architecture et à
  la page TrueNAS dark-mode.
- [x] Appliquer la préférence `light|dark|auto` globalement dans le layout Next
  avant le premier paint, sans dépendre du chargement optionnel de
  `SiteWidgetsScript` ni charger ses widgets legacy sur toutes les routes.
- [ ] Auditer l'ensemble des pages en thème clair et sombre et supprimer les
  combinaisons incohérentes issues du mélange Bootstrap/CSS historique (par
  exemple texte clair forcé sur surface Bootstrap claire).
- [x] Définir les tokens sémantiques Next.js `surface`, `surface-muted`,
  `text-primary`, `text-secondary`, `border`, `link`, `success`, `warning` et
  `danger` en les adossant au contrat `theme.css` existant.
- [x] Valider systématiquement le contraste WCAG AA de ces tokens sur les pages
  prioritaires en thème clair, sombre et préférence système. #189 verrouille un
  ratio d'au moins 4,5:1 pour les couples sémantiques couverts.
- [x] Ajouter une vérification visuelle automatisée light/dark sur les pages
  prioritaires (`/`, `/truenas`, `/architecture`, `/ai`, `/contact`, `/cv`) afin
  d'empêcher les régressions de contraste lors des migrations Bootstrap/CSS.
  #189 couvre les préférences explicites `light`/`dark` et `auto` avec système
  clair/sombre sans recourir à des snapshots pixel-perfect fragiles.
- [ ] Normaliser les tokens globaux pour couleurs, surfaces, espacements, rayons,
  typographie, ombres et états success/warning/danger.
- [x] Introduire les primitives `Container` et `ExternalLink` ainsi que la
  primitive d'action partagée utilisée par le Footer et les CTA migrés.
- [ ] Introduire les primitives restantes `Section` et `PageHeader` seulement
  lorsqu'un consommateur réel permet d'éviter des composants abstraits inutilisés.
  `Button`, `Card` et `Badge` ont désormais des consommateurs réels.
- [x] Migrer le Footer, `RouteHeader`, `LocaleSwitcher` et `ContactHero` vers les
  tokens/primitives partagés avant les composants spécifiques aux pages.
- [x] Retirer Tailwind/PostCSS du toolchain après découplage du CSS rendu : le
  reset navigateur est détenu par le projet, aucune directive/import Tailwind n'est
  maintenu, `tailwindcss`, `@tailwindcss/postcss`, la configuration PostCSS et leur
  graphe de lock sont supprimés. La preuve exacte de #182 couvre CI #1109,
  Playwright #876 (144/144) et ZAP Preview #43 ; Bootstrap reste un chantier séparé.
- [ ] Réduire progressivement le mélange Bootstrap + CSS historique et les
  feuilles globales chargées dans le layout. #190 a migré les cartes/actions
  Workstation React natives vers `Card`, `CardBody`, `ActionLink` et `Button`.
  #191 poursuit ce lot en déplaçant les grilles Hero/services/related, les
  utilitaires de layout, les surfaces/espacements de section et la typographie de
  ces deux composants vers `WorkstationLayout.module.css` et une petite échelle
  typographique sémantique partagée. Le contrat responsive couvre désormais 320/375/768/1024/1440.
  Le même lot migre ensuite les wrappers structurels de `HardwareSection` et
  `BillOfMaterialsSection` vers les primitives partagées et le CSS Module, tout
  en conservant les classes métier `hardware-*` communes à TrueNAS. #191 retire
  aussi le dernier utilitaire Bootstrap de layout de la route Workstation
  (`main.mb-5`) au profit du même CSS Module et d'un token d'espacement partagé.
  Le chargement Bootstrap global reste volontairement différé tant que d'autres
  routes Next/legacy en dépendent encore.
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
- [x] Exécuter une quality gate agent-first identique localement et en CI avant le build : fraîcheur de branche, garde anti-troncature, bits exécutables, pre-commit déterministe, lint, types Next/TypeScript et tests unitaires ; le pre-push utilise `--publish` et le setup Copilot installe les dépendances requises.
- [x] Verrouiller aussi par contrat unitaire le bit exécutable des cinq scripts
  critiques du chemin Quality/Preview. Le run CI #1212 de #192 a correctement
  échoué avant Semgrep/npm parce que `ci-scope.sh` et
  `verify-production-baseline.sh` avaient été réécrits en mode `100644` ;
  ils sont restaurés en `100755` et le contrat empêche désormais une mutation
  Git/API ultérieure de perdre silencieusement ce mode.
- [x] Rejouer le workflow Quality/Security sur `master` après merge.
- [x] Réparer les régressions SEO post-merge qui empêchaient le build Vercel.
- [x] Consolider la politique metadata sociale et conserver une façade de
  compatibilité pour les anciens imports.
- [x] Aligner canonical, sitemap et Open Graph sur le host de production final.
- [ ] Ajouter un ruleset GitHub rendant Quality/Security obligatoire avant merge
  afin qu'une PR rouge ou un ancien run vert ne puisse plus casser `master`.
- [x] Interdire les directives GitHub de contournement CI dans les commits de PR
  avec un guard `pull_request_target` metadata-only : permissions lecture seule,
  aucun checkout, aucun secret et aucun code de la PR exécuté. Ce guard ferme le
  trou observé après #191, où `[skip ci]` a empêché Quality/Security de fournir
  une preuve sur le HEAD fusionné. Le futur ruleset reste nécessaire pour rendre
  ce statut effectivement obligatoire avant merge.
- [ ] Valider opérationnellement le workflow post-merge de #173 après son merge.
  Le chemin **échec non auto-corrigeable → issue diagnostique** est désormais prouvé
  en production : après le merge de #192, `CI (Quality and Security) #1226` a
  échoué sur un contrat unitaire sémantique obsolète, la remédiation #16 a confirmé
  qu'aucun auto-fix déterministe ne progressait et a ouvert l'issue dédupliquée
  #193. Il reste à prouver le chemin **auto-fix convergent → PR
  `automation/quality-remediation-*` → dispatch explicite de `ci.yml`**, ainsi
  que le fallback lorsque GitHub refuse la création de PR ou le dispatch avec
  `GITHUB_TOKEN`. Ce mécanisme reste un filet de récupération et ne remplace jamais
  la quality gate pré-publication.
- [ ] Terminer la validation du chemin local-first sur un workspace agent réel.
  La moitié CI est désormais prouvée à plusieurs reprises dans #177 : un défaut
  formatter/pre-commit s'arrête avant Semgrep, `setup-node`, `npm ci` et le build,
  émet `QG_AUTOFIX_REQUIRED` avec le patch exact, puis la passe corrigée traverse
  la gate complète. Le cold bootstrap Copilot est aussi validé avec npm 11.17
  installé avant les hooks Node de pre-commit. Ruff utilise maintenant une seule
  autorité de lint auto-fixante, `ruff-check --fix --unsafe-fixes`, avant
  `ruff-format`, et un contrat empêche le retour du hook `ruff` redondant. Il reste
  à observer un cycle local réel `quality:agent:fix` → commit → pre-push démontrant
  que la publication gate stricte ne s'exécute qu'une fois et laisse l'arbre propre.
  Le publisher refuse désormais aussi explicitement une toolchain absente ou
  cassée avec `QG_PUBLISH_TOOL_MISSING` / `QG_PUBLISH_TOOL_INVALID`, avant
  toute réutilisation de preuve, afin qu'un bootstrap local incomplet ne se
  traduise plus par un arrêt shell opaque. Le contrat comportemental reproduit
  désormais les deux cas : outil présent mais invalide et `pre-commit`
  réellement absent d'un `PATH` local restreint ; une preuve déjà cachée ne peut
  donc pas masquer une toolchain devenue incomplète.
- [x] Supprimer la double autorité Stylelint après vérification de parité des
  règles : npm / `package-lock.json` + Stylelint 17 couvre désormais
  `app/**/*.css`, `components/**/*.css` et `public/*.css`. L'élargissement a
  détecté les faux positifs CSS Modules `:global()` et deux vrais sélecteurs
  dupliqués avant suppression de `pre-commit-stylelint`, Stylelint 14 et
  `stylelint-config-standard-scss@3.0.0`. Un contrat interdit leur réintroduction.
- [x] Ajouter un garde de non-régression code-size baseline-aware au gate agent :
  seuls les fichiers source/test modifiés sont inspectés, un warning apparaît au-
  dessus de 300 lignes, un nouveau dépassement au-dessus de 600 lignes échoue et
  les fichiers legacy déjà au-dessus de 600 ne peuvent croître que de +2 %. Le
  rapport compact reste visible sur les runs verts et les contrats couvrent
  warning, hard fail, grandfathering et dépassement de la marge legacy.
  Le follow-up post-#192 extrait le contrat des bits exécutables de
  `agentQualityGate.test.ts`, qui repasse de 311 à 288 lignes et ne génère plus
  son warning code-size. Il extrait ensuite sans changement de politique les
  helpers release/maintenance de `verify-production-baseline.sh` vers
  `scripts/lib/production-baseline-classification.sh`, ce qui ramène
  l'orchestrateur sous le seuil de warning. Un contrat comportemental dédié
  verrouille la release SemVer monotone, les chemins maintenance autorisés et le
  refus d'un changement runtime. La librairie reste volontairement hors fast-path
  maintenance CI : modifier la logique d'héritage de preuve production conserve
  le scope sécurité complet. En revanche, le classifieur de baseline accepte son
  propre chemin comme maintenance après merge, afin qu'un commit non déployé de
  cette seule politique puisse hériter de la dernière preuve production saine.
- [x] Durcir le fallback Docker secondaire : image NGINX non-root, smoke runtime
  sur `/` et le `404.html` protégé, Trivy v0.74 HIGH/CRITICAL bloquant sur
  l'image locale exacte, SARIF conservé et envoyé via CodeQL v4 avant toute
  publication. GHCR reste la cible systématique de `master` ; Docker Hub est un
  miroir optionnel qui ne rend plus la CI rouge lorsque ses secrets sont absents.
- [x] Valider en production le smoke post-déploiement sur accueil EN/FR, `/truenas`,
  `/architecture`, `/contact`, `/api/homelab-status` et les cartes sociales.
  Le run `34174782120` du 8 septembre 2026 est vert sur l’origine canonique
  publique et prouve via `/api/deployment` le SHA Vercel
  `7e0a0e880cbc4acb1d83505352b6d09b017c4569`. Il valide également canonical,
  hreflang EN/FR/`x-default`, sitemap et robots sur les routes couvertes.

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
- [x] Compléter les relations d'hébergement/runtime dans la topologie autoritative :
  `nabla-compose` dérive désormais les `hostedBy` depuis les bindings runtime
  prouvés, relie Docker à TrueNAS et expose également Talos/Kubernetes lorsque les
  sources Terraform/docs les prouvent ; FastAPI et Site Alban consomment ce type
  sans le confondre avec une dépendance fonctionnelle.
- [x] Faire refléter ces couches d'hébergement dans le React Flow détaillé avec
  foundations/data/platform/apps clairement étagés ; les nœuds sont triés par
  criticité/blast radius et la dominance visuelle est calculée relativement au
  rayon d'impact maximal de la topologie, sans hardcoder TrueNAS, Docker ou un
  autre ID de service.
- [x] Ajouter une représentation mobile compacte de cette hiérarchie avec
  collapse/expand et filtres critical-only / optional-edge : sous 700 px, la
  hiérarchie groupée réutilise exactement les mêmes groupes, états de santé,
  niveaux de criticité et arêtes filtrées que React Flow, avec des `details`
  repliables par couche puis par relations de service.
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
- [x] Revalider le graphe après les merges `nabla-compose` jusqu'à la release
  0.30.0 : le fallback Site est resynchronisé sémantiquement sur 113 nœuds /
  216 relations et inclut désormais ClamAV, Keycloak et pfSense Unbound, ainsi
  que les dernières preuves Garage, Cloudflare, CrowdSec et pfSense exporter.
  Le catalogue de présentation reste aligné sur 72 services et conserve les
  annotations runtime récentes de Scrutiny.
- [x] Aligner le fallback de réconciliation des anciens payloads sur
  `fastapi-sample#212` : runtime TrueNAS frais arrêté/échoué non masqué par
  Cloudflare, preuves runtime/tunnel périmées non utilisées comme preuve positive,
  erreur applicative joignable classée dégradée et exposition Cloudflare seule
  insuffisante pour déclarer l'application saine.
- [x] Afficher la couverture d'observation directement dans la vue TrueNAS :
  nombre de services du catalogue, nœuds/relations de topologie, observations
  de santé, sondes LAN/internes activées, couverture des preuves directes,
  runtime, Cloudflare et dépendances, tunnels observés et durée du refresh.
  Les compteurs de fan-out consomment maintenant le contrat borné
  `/api/homelab/probes` de FastAPI (`scheduled/completed/timed_out`, budget,
  timeout par sonde et concurrence), propagé également dans `probe_summary`
  du snapshot de santé. Le proxy du Site utilise cette matrice comme fallback
  avant l'ancien agrégat lorsqu'un health-board n'est pas disponible. Ces
  compteurs décrivent les preuves disponibles et ne changent pas la résolution
  de santé.
  Compatibilité anticipée avec `fastapi-sample#231` : le Site comprend aussi
  `eligible/sampled/rotating_sample`, `probe_cache`, la fraîcheur du
  health-board et la provenance de réconciliation. L'UI affiche donc
  `sampled/eligible` lorsqu'il est disponible et reste compatible avec
  `scheduled` sur le runtime actuellement déployé.
  Après la release FastAPI `1.13.11`, le Site consomme aussi la couverture
  roulante `probe_summary.*.evidence` (`known/fresh/cached/coverage_percent`
  et TTL). La page TrueNAS suit l'architecture probe-first préparée dans
  `fastapi-sample#232` : le proxy same-origin `/api/homelab-probes` est
  rendu immédiatement en `no-store`, puis `/api/homelab-health` enrichit
  l'état avec le health-board et la réconciliation sans bloquer le premier rendu.
  Un échec de l'agrégat ne supprime donc plus une matrice de probes valide.
- [x] Dériver le filtre d'environnement TrueNAS depuis
  `service-topology.nodes[].environments` avant le metadata legacy du catalogue.
  Un service sans déclaration reste `production` par compatibilité mais porte
  la provenance `default` et peut être isolé via le filtre « Production par
  défaut / métadonnées à revoir ». Le fallback local conserve explicitement les
  environnements production + staging de FastAPI Sample sans resynchroniser tout
  le graphe dans cette PR thématique.
- [ ] Exécuter puis consommer la progression Kubernetes préparée par
  `nabla-compose#130` (fusionnée) dans l'ordre DNS/CNI → smoke FastAPI
  `test.albandrieu.com` → CSI TrueNAS → secrets d'infrastructure. Le site doit
  séparer santé applicative, réseau/DNS, persistance CSI et présence de
  configuration ; aucune valeur de secret ne doit être exposée.
- [ ] Après fusion de `nabla-compose#131`, avec `fastapi-sample#212` désormais
  fusionnée, vérifier en production que les bindings runtime par `appId` rendent
  2FAuth/Open WebUI
  rouges pendant un état non prêt et qu'un tunnel Cloudflare sain ne masque jamais
  l'origine.
- [x] Ajouter un test de contrat couvrant explicitement les nouveaux workloads
  multi-services et les services auxiliaires : le fallback Site verrouille
  Elasticsearch → Docker, Kibana → Elasticsearch/Docker et Docker → TrueNAS ;
  côté source autoritative, `nabla-compose/tests/test_service_topology_generator.py`
  garantit qu'un service Compose non déclaré par `x-nabla` ne devient pas un
  nœud fonctionnel.
- [x] Ajouter une couverture visuelle/Playwright light/dark/mobile des états
  `healthy`, `degraded`, `failed`, `stale` et `unknown` : le test
  déterministe couvre TrueNAS en thème clair/sombre, Architecture en mobile,
  vérifie le contraste AA des badges, les cibles tactiles et l'absence d'overflow.
  Le contrat UI traite aussi `runtime_missing=true` comme un drift d’inventaire
  lorsque des preuves d’origine fraîches (`internal_state=ok` ou HTTP 2xx)
  démontrent que le workload répond : l’état présenté devient `warn`, avec
  un motif explicite, au lieu d’un faux `fail` (cas Vaultwarden).

## P1 — Présentation service-first et métriques à l'échelle

- [x] Séparer la présentation opérateur de la criticité de dépendance : les cartes
  sont organisées `services et expérimentations -> socle critique -> contrôles de
  sécurité -> plateforme/données partagées -> observabilité/support`, tandis que
  le blast radius et la propagation `required` restent calculés par la topologie.
- [x] Consommer les métadonnées optionnelles autoritatives
  `presentationRole=service|core|support` et
  `criticality=critical|high|medium|low`, avec fallback sémantique tant que le
  catalogue n'est pas entièrement annoté. Le vocabulaire de criticité suit
  `service.criticality` d'OpenTelemetry.
- [x] Rendre les grandes listes navigables par recherche nom/ID et conserver un
  résumé d'attention sur les groupes repliés afin que l'augmentation du nombre de
  services ne masque pas un incident.
- [x] Associer un profil de métriques au rôle sans inventer de valeur :
  `RED` pour les services, `USE` pour le socle, `POSTURE` pour les contrôles
  de sécurité et `RED + USE` pour les backends partagés.
- [x] Consommer les métriques sanitizées et bornées de `fastapi-sample#197`
  via le contrat `platform_metrics` déjà intégré par Site Alban #151, en
  conservant source, fraîcheur et disponibilité de la télémétrie séparées de
  l'état direct de la plateforme.
- [ ] Conserver Pyroscope (`fastapi-sample#211`) comme signal d'observabilité
  optionnel/non bloquant : l'absence de profiling ne doit pas modifier la santé
  fonctionnelle du service.
- [ ] Pour les services, exposer progressivement disponibilité, trafic/rate,
  erreurs/error-rate et latence (p50/p95/p99 seulement lorsque le volume permet
  une interprétation fiable), puis saturation pertinente et SLO/error budget pour
  les expériences sélectionnées disposant de suffisamment d'historique.
- [ ] Pour le socle critique, privilégier pression/capacité et santé spécifique :
  TrueNAS/ZFS, Talos EPHEMERAL, Kubernetes Ready/MemoryPressure/DiskPressure/
  PIDPressure/NetworkUnavailable, CNI/CSI, ainsi qu'etcd leader/membres/alarmes/
  quota. Ne pas réduire ces composants à un simple probe HTTP.
- [ ] Pour les contrôles de sécurité, maintenir deux dimensions distinctes :
  disponibilité du contrôle et posture/policy. Un volume d'alertes, de blocages ou
  de détections n'est jamais assimilé automatiquement à une panne de service.
- [ ] N'autoriser côté API que des requêtes métriques prédéfinies, de cardinalité
  bornée et sans PromQL fourni par le navigateur ; ne jamais exposer kubeconfig,
  Talos config, credentials ou labels bruts de management.
- [ ] Ajouter une vue temporelle courte (par exemple 1 h / 24 h) uniquement après
  stabilisation des métriques instantanées, en privilégiant les tendances utiles
  à l'expérimentation sécurité plutôt qu'un dashboard de capacité générique.

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
- [x] Link
- [x] Test
- [x] Login — shell serveur + interactions isolées dans un Client Component
- [x] `components/payments/PaymentShell.tsx`

Migration Next active terminée : les documents HTML historiques de `public/**`
restent volontairement inchangés.

Critères d'acceptation : un composant partagé, aucun markup de skip-link dupliqué
dans les routes Next actives, chaque page expose `<main id="main-content">`, et
des tests de non-régression.

Autres contrôles :

- [ ] Exécuter un audit axe complet des pages prioritaires en anglais et français.
- [ ] Étendre la vérification du focus visible et de la navigation clavier.
- [x] Vérifier `prefers-reduced-motion` pour React Flow : les arêtes animées
  deviennent statiques lorsque l'utilisateur demande une réduction des
  animations, sans perdre leur couleur, motif ni sémantique.

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

- [x] Conserver CodeQL comme SAST global et ajouter Semgrep CE 1.176.0 dans
  Quality/Security pour scanner les fichiers applicatifs modifiés ainsi que les workflows GitHub Actions modifiés
  avec le ruleset `p/ci`. Le scan reste diff-scoped et s'exécute avant
  l'installation npm afin de bloquer tôt une nouvelle violation SAST. Le
  rapport Semgrep est exporté en SARIF vers GitHub Code Scanning ; l'artifact
  brut est conservé 7 jours seulement en cas d'échec afin de garder le diagnostic
  utile sans dupliquer le stockage sur les runs verts.
- [x] Fermer le risque supply-chain détecté par Semgrep dans les workflows
  critiques : pinner Checkout, GitHub Script, Setup Python/Node, Cache,
  Upload Artifact, CodeQL SARIF et OWASP ZAP sur leurs SHA Git immuables, en
  conservant le tag revu en commentaire. L'image Semgrep 1.176.0 est elle-même
  verrouillée par digest SHA-256 ; un contrat empêche la réintroduction de
  `uses: ...@vN` mutables dans la chaîne sécurité.
- [x] Ajouter OWASP ZAP Baseline 0.15.0 comme DAST passif partagé : le Preview
  protégé utilise le header Vercel Automation Bypass, tandis que la production
  canonique est scannée après les déploiements `master` et quotidiennement.
  Les règles anti-clickjacking, `nosniff`, directory browsing et HSTS sont
  bloquantes ; CSP reste en WARN jusqu'au chantier de durcissement dédié.
  Preview et production chargent `.zap/rules.tsv` une seule fois via
  `rules_file_name`; `cmd_options` conserve uniquement `-I -T 5` afin
  d'éviter le double chargement de politique détecté puis corrigé avec Bababou #188.
  Le DAST production utilise le Vercel Automation Bypass et un preflight 200
  qui rejette `429` / Security Checkpoint afin qu'un scan de page de challenge
  ne puisse jamais produire un faux vert. Les rapports ZAP conteneurisés sont
  supprimés du workspace après leur archivage pour ne pas polluer pre-commit.
- [x] Ajouter un pentest baseline Playwright non destructif sur le Preview Vercel :
  headers défensifs, fichiers sensibles non exposés, méthode TRACE refusée,
  méthode POST non déclarée refusée sur l’API homelab et sonde XSS réfléchie sans
  création de markup exécutable. Le scan DAST complet reste séparé afin de ne pas
  alourdir chaque PR.
- [x] Ajouter les headers applicatifs de base `nosniff`, `SAMEORIGIN`,
  `strict-origin-when-cross-origin` et une `Permissions-Policy` restrictive.
  La CSP bloquante reste un chantier distinct tant que les assets/scripts legacy
  ne sont pas tous réconciliés.
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
- [x] Ajouter un budget performance Preview minimal et peu flakey sur Chromium :
  TTFB ≤ 3 s, DOMContentLoaded ≤ 5 s, load ≤ 8 s, ≤ 120 ressources et budgets de
  transfert de 4 MB au total, 2 MB JS et 1 MB CSS. Ces seuils sont un garde-fou
  grossier ; les budgets Web Vitals LCP/CLS/INP restent à définir séparément.
- [ ] Remplacer progressivement Bootstrap CDN et Bootstrap Icons par les
  primitives/styles réellement utilisés afin de réduire CSS tiers et CSP.
- [x] Exécuter un premier audit des dépendances et retirer les racines sans
  consommateur : CLI Vercel local, D3 npm, Next DevTools MCP local,
  SDK navigateur Datadog/Vercel inutilisés. OpenCommit est conservé comme outil
  local/on-demand par choix explicite. L’audit Knip suivant retire aussi les deux
  SDK Stripe navigateur d’une surface Embedded Checkout non routée ; conserver
  explicitement le SDK serveur `stripe`, React Flow et le contrat
  `@vercel/otel` avec ses peers OTel requis
  (`api`, `api-logs`, `instrumentation`, `sdk-logs`) car le build
  Turbopack prouve qu'ils sont consommés à la compilation.
- [x] Aligner npm sur `>=11.17.0 <12`, activer `strict-allow-scripts` et
  maintenir une denylist explicite des scripts d'installation déjà examinés.
- [x] Reprendre et adapter le nettoyage public validé par
  `nabla-site-bababou#170` : conserver les trois bundles Font Awesome JS,
  les trois CSS et leurs deux webfonts, plus les deux SVG réellement consommés
  par Alban (`linkedin-in.svg` et `react.svg`). Le dépôt retire ainsi
  5 698 fichiers vendus inutilisés, soit 26 729 419 octets (~25,49 MiB), sans
  modifier les URLs runtime existantes.
- [x] Sortir le convertisseur JPG/PNG des assets publics, réparer son wrapper,
  supprimer les wrappers `run-install.sh` / `run-test.sh` orphelins et
  verrouiller ces frontières avec des tests de contrat.
- [ ] Compléter l'audit des licences et des dépendances restantes après plusieurs
  baselines CI post-nettoyage.
- [x] Évaluer Knip 6.35.0 pour détecter fichiers, exports et dépendances morts :
  un audit zéro-config puis une configuration repository-aware séparent les
  assets statiques `public/**`, les outils on-demand et les vrais candidats.
  `npm run audit:dead-code` reste volontairement on-demand et n’ajoute aucun
  coût aux quality gates ordinaires.
- [x] Retirer le premier lot de code mort prouvé : Embedded Checkout non routé,
  ses deux SDK navigateur, `eslint-config-next`, `typescript-eslint`,
  `postcss-selector-parser`, l’ancien `LocaleSwitcher`/navigation, le
  `SiteFooter` remplacé, `ResourceDirectory`/resource catalog, deux sections
  Nabla orphelines, `legacyPageMetadata`, une feuille React Flow obsolète,
  `app/404.module.css` et la configuration PurgeCSS sans consommateur.
- [x] Migrer les contrats architecture vers `HierarchicalArchitectureExplorer`
  puis retirer l’ancien renderer/CSS `ArchitectureExplorer`; supprimer aussi
  les deux anciens helpers d’icônes sans consommateur et conserver explicitement
  le helper i18n documenté.
- [ ] Poursuivre l’audit Knip des exports et types publics inutilisés, en évitant
  de retirer des types de contrat homelab uniquement parce qu’ils sont consommés
  hors du graphe d’import applicatif courant.

## P2 — CI/CD et Vercel

- [x] Vérifier l'état de la production courante avant de consommer le budget CI
  d'une PR : Quality/Security résout désormais une seule fois le HEAD courant de
  `pull_request.base.ref`, expose ce SHA comme `base-sha`, puis le réutilise pour
  les statuts `Vercel`, `Production Post-deploy Smoke` et `Production DAST`, le
  smoke récupéré par `git show`, `QUALITY_BASE_REF` et le diff Semgrep. La CI ne
  dépend donc plus de `github.event.pull_request.base.sha`, qui peut devenir
  périmé lorsque `master` avance pendant qu'une PR reste ouverte.
- [x] Rejouer en plus le smoke HTTP/SEO réel contre
  `https://www.albanandrieu.com` sur chaque PR, avant SAST et avant build, en
  exécutant le script récupéré depuis le SHA `master` de base avec
  `git show`. Une PR ne peut donc pas affaiblir son propre smoke pré-merge.
- [x] Publier `Production DAST` sur le SHA réellement déployé après
  `vercel.deployment.success`, en complément du smoke HTTP/SEO post-déploiement
  déjà existant. Le scan planifié quotidien surveille aussi la production sans
  réécrire artificiellement le statut d'un SHA non redéployé.
- [x] Exécuter Playwright sur le Preview Vercel au lieu de rebuilder Next.js dans
  le workflow E2E.
- [x] Déclencher automatiquement le checkpoint Vercel des PR déployables après
  succès du workflow `CI (Quality and Security)` via `workflow_run`, puis
  laisser le webhook de déploiement enchaîner ZAP Preview et Playwright. Le
  `workflow_dispatch` reste disponible pour une relance manuelle contrôlée.
- [x] Extraire la publication du checkpoint Vercel exact-SHA dans
  `scripts/publish-vercel-preview-checkpoint.sh`, comme Bababou #199 : le helper
  est utilisable depuis un checkout local de confiance pendant une panne/quota
  Actions, valide la relation base→HEAD, refuse les noms hors
  `vercel-preview-pr-<n>`, utilise `--force-with-lease` et reste strictement
  distinct de la preuve Quality/Security obligatoire avant merge. Les chemins
  Preview automatique et on-demand consomment désormais ce même publisher et la
  même classification maintenance afin d'éviter deux autorités de mutation.
- [x] Ajouter un test d’intégration Preview reliant les Route Handlers
  `/api/homelab-services` et `/api/homelab-topology` à la page
  `/architecture`, avec vérification du chemin stable
  `OpenWebUI → LiteLLM → Ollama`. Le même run Chromium exécute aussi le pentest
  baseline et le budget performance afin d’éviter trois workflows redondants.
- [x] Utiliser `repository_dispatch: vercel.deployment.success` pour le hand-off
  Preview → Playwright.
- [x] Retirer le fallback OIDC et le chemin `deployment_status` devenus inutiles.
- [x] Rejeter explicitement les réponses Vercel Security Checkpoint
  (`HTTP 429` / `x-vercel-mitigated: challenge`) dans le preflight Preview au
  lieu de les assimiler à un accès protégé valide.
- [x] Faire vérifier au smoke Docker les trois bundles Font Awesome JS conservés ;
  `public/**` était déjà couvert pour les événements push et pull_request.
- [x] Exécuter lint, type-check, unit tests et `npm run build` dans Quality/Security.
- [x] Exécuter Quality/Security sur `master` après merge.
- [x] Aligner le développement, mise, direnv et les workflows GitHub sur Node 26.8.2, conserver une plage `>=24.11.0 <27` compatible avec le runtime Vercel Node 24.11.0, et garder OpenCommit uniquement comme helper local/on-demand. Le workflow Node 24 est désormais identique à celui de `nabla-site-bababou`.
- [x] Aligner le bootstrap de quality gate local/agent/CI sur Python 3.13 et
  `pre-commit==4.6.2` : `.python-version`, mise, Copilot Setup Steps et
  Quality/Security utilisent désormais les mêmes versions au lieu de laisser
  `pre-commit = "latest"` dériver.
  Un test de contrat dédié verrouille cette parité afin qu'une future mise à
  jour de runtime ou de pre-commit échoue avant le build si un des bootstrap
  agent/CI dérive.
- [x] Invalider les environnements pre-commit mis en cache lorsque
  `.python-version` change et réparer les six fichiers laissés non canoniques
  par le commit `master` `7f025e04` : le run Quality/Security
  `34176979353` s'arrêtait correctement dans la gate avant le build, puis #162
  réapplique le patch formatter exact avant la prochaine intégration.
- [x] Rendre les caches npm/pre-commit non bloquants : une indisponibilité du
  backend GitHub Cache ne doit ni masquer ni provoquer un échec de la quality
  gate. Copilot Setup restaure les mêmes caches et préchauffe les environnements
  pre-commit uniquement sur cache miss afin que l'agent puisse exécuter la gate
  sans réinstaller tous les hooks au moment de publier.
- [x] Retirer `wrangler.jsonc` et les dernières instructions de déploiement Wrangler ; Vercel reste l’unique runtime web publié.
- [x] Aligner Next.js et `eslint-config-next` sur 16.3.4 ainsi que `@types/node` sur la branche 25.
- [x] Converger les correctifs CI partagés avec `nabla-site-bababou#156-#160` :
  formatter ESLint GitHub natif tout en gardant le fallback GitLab, cache npm explicite
  après sélection de Node, pin npm depuis `$RUNNER_TEMP` et authentification de
  Semantic Release avant le contrôle de fraîcheur. Le bootstrap de thème et les
  contrastes WCAG AA étaient déjà présents via #150/#152 ; le fallback Docker
  non-root/Trivy/GHCR était déjà aligné via #154/#155.
- [x] Éviter le bootstrap Docker inutile du scan Snyk optionnel : lorsque
  `SNYK_TOKEN` est absent, Quality/Security ne prépare plus l'action conteneur
  `snyk/actions/node`; le scan reste conditionnel via `npx --yes snyk test`
  et un test de contrat empêche la réintroduction du pull coûteux.
- [x] Aligner le scope CI des changements non-runtime avec Preview et la
  baseline production : `docs/*`, `*.md` et `unit-tests/*` restent soumis à
  pre-commit, lint/typecheck et tests unitaires, mais ne déclenchent plus
  Semgrep applicatif ni `next build`. #1227 a montré le drift précédent en
  classant une PR docs/tests comme `application=true`; les workflows
  `.github/**` restent volontairement hors de cette exemption afin de conserver
  leur analyse Semgrep. Un test comportemental verrouille cette frontière :
  un workflow reste `maintenance_only=false / sast=true / build=true`, même si
  `verify-production-baseline.sh` peut hériter d'une baseline saine à travers
  ce commit non-déployable. Cette asymétrie est intentionnelle : sécurité du code
  CI d'un côté, continuité de preuve production de l'autre.
- [x] Réduire le coût des itérations de PR : réutiliser `.next/cache` par PR
  avec fallback sur un cache compatible `package-lock`, et ne pas répéter
  Trivy OS/library sur une PR qui ne modifie que `public/**`. Le scan Trivy reste forcé lorsque
  `Dockerfile/.dockerignore` change ainsi que sur `master`, en schedule et
  en exécution manuelle. Le correctif CI de #170 supprime aussi les lignes
  blanches réécrites par Prettier avant la quality gate. Le changement du workflow a aussi fait entrer
  `docker-build.yml` dans le périmètre Semgrep : toutes ses actions critiques
  sont désormais verrouillées sur des SHA Git immuables au lieu de tags
  mutables.
- [ ] Mesurer après merge le gain du pipeline local-first sur plusieurs runs : la
  CI doit arrêter les défauts formatter/pre-commit avant le bootstrap npm, ne pas
  rejouer le canonical gate plus tard dans le même job, limiter les logs à 40
  lignes utiles et ne conserver l'artifact Semgrep brut que lors des échecs.
  Comparer notamment à la baseline Quality `master` d'environ 96 s observée avant
  ce changement, sans transformer cette durée en seuil bloquant/flakey.
- [ ] Finaliser le bootstrap Semantic Release `v0.0.1` et vérifier après merge la
  création du tag, du changelog synchronisé et de la GitHub Release sans exiger
  une mutation manuelle de `master`. Le `GITHUB_TOKEN` du run validé du
  7 septembre 2026 a été refusé (HTTP 403) lors de la création du tag technique ;
  le workflow échoue désormais fermé côté mutation et exige le GitHub App dédié
  (`RELEASE_APP_CLIENT_ID` + `RELEASE_APP_PRIVATE_KEY`) avant de publier.
- [ ] Configurer un ruleset GitHub pour rendre réellement obligatoires avant
  merge les statuts de PR `CI (Quality and Security)`, `Vercel` et
  `Playwright Preview E2E`. Le repository ne possède actuellement aucun
  ruleset ; les contrôles production Post-deploy Smoke/DAST sont vérifiés par
  Quality sur le SHA `master` de base.
- [ ] Réduire encore les déploiements Preview inutiles, notamment pour les
  changements docs-only et les commits intermédiaires d'une même PR. Le correctif
  `deploymentEnabled["**"] = false` est préparé pour empêcher les branches
  `fix/*`/`feat/*` de contourner involontairement le checkpoint on-demand.
- [ ] Valider la suite Playwright complète sur Chromium, Firefox, WebKit et les
  profils mobiles seulement lorsque cela apporte une couverture complémentaire.
- [ ] Rétablir une vérification automatisable des logs runtime Vercel lorsqu'un
  connecteur/endpoint de logs est disponible dans l'environnement d'audit.

## P2 — Documentation et maintenance

- [x] Documenter l'architecture Next.js/Vercel, l'i18n, la migration SEO et le
  catalogue homelab.
- [x] Consolider `docs/todo.md` dans cette feuille de route unique.
- [x] Consolider la parité de plateforme avec les 10 dernières PR Bababou dans
  cette roadmap canonique ; toute divergence future doit être classée
  `shared-platform`, `site-specific` ou `deferred-with-reason`.
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

1. Revalider régulièrement le graphe de production après les évolutions
   `nabla-compose` / `fastapi-sample` et étendre les contrats lorsqu'un nouveau
   type de workload ou de relation apparaît. La revalidation du 6 septembre 2026
   couvre 65 nœuds, 133 relations et 55 placements `hostedBy`, dont Talos et
   Kubernetes.
2. Cohérence du contenu professionnel et suppression des données mortes Jus Mundi.
4. Design system partagé : poursuivre l'audit light/dark, les primitives restantes
   et le retrait de Bootstrap après les migrations déjà faites de RouteHeader,
   Footer et ContactHero ; le sélecteur de langue autonome a été retiré.
5. Terminer la migration native de `/security` et le durcissement CSP ; D3 v3 et
   `arf.js` sont déjà retirés du runtime.
6. Recentrage `/ai` sur Secure AI en réutilisant la topologie existante.
7. Accessibilité axe/clavier/reduced-motion sur les pages prioritaires.
8. Workstation, code mort, Bootstrap/CDN et budgets performance. Les CV
   historiques restent volontairement hors de la migration Next.js native.
9. Résilience réseau/DNS : pfSense/Unbound, rôle de Pi-hole/AdGuard Home et tests
    de panne ; ce chantier reste volontairement derrière l'architecture/homelab UI.
10. **P0 — empêcher une nouvelle régression de merge**, en dernier comme demandé,
    puis conserver ces garde-fous pour tous les travaux ultérieurs.
11. **P3 — maintenance pfSense/pfBlockerNG**, hors chemin critique : terminer le
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
