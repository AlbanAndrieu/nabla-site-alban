# Feuille de route produit et qualité

## P1 — Parité CI local-first avec nabla-compose (22 octobre)

- [x] Les jobs déclenchés par pull_request respectent le cycle Draft/Ready pour réduire les minutes, sans `[skip ci]`.
- [x] Les workflows CI et Trivy suivent explicitement `Dockerfile.k8s*` ; l'image Nginx historique reste testée séparément.
- [x] shfmt passe du hook Docker à shfmt natif, avec Go géré par mise et invocation `agent-quality-gate.sh` synchronisée.
- [x] Test de contrat autonome `ciBudgetConvergence.test.mjs` intégré à pre-commit pour détecter toute régression de la politique Draft et du périmètre Dockerfile.
- [x] `just source-check` exécute aussi les contrats CI et l'inventaire GitHub Actions hors ligne, sans dépendre d'un GitHub Runner ni des dépendances Node.
- [x] L'inventaire Actions de nabla-compose PR #269 (Draft) est porté avec pagination bornée, validation des identifiants et détection d'inventaire incomplet.
- [ ] Passer la quality gate complète `npm run quality:agent:publish` avec Go/npm/Node installés, sur checkout exact et propre ; ne pas confondre revue de fichiers et preuve L3.
- [ ] Vérifier les politiques GitHub Rulesets et que les check runs de sécurité sont réellement requis lors du Ready.
- [ ] Éviter de dupliquer les scans : les hooks actionlint, zizmor, Hadolint et BetterLeaks existaient déjà dans ce site.


Dernière réconciliation : 18 octobre 2026 (5 dernières PR fusionnées).

Cette roadmap contient les **travaux transverses encore ouverts** et les invariants
nécessaires pour comprendre l'état cible. Git/GitHub conserve la chronologie
complète des PR, commits et runs ; les procédures de diagnostic restent dans les
runbooks et les retours d'incident sous `docs/incidents/`.

## P2 — Parité CI avec nabla-site-bababou (audit des dix dernières PR, 20 octobre)

| Contrôle transversal | Site Alban (#240) | Site Bababou (master) | Décision |
| --- | --- | --- | --- |
| Local-first / justfile | `quality`, `offline-l1`, `source-check`, `snapshot-check` | `quality`, `offline-l1`, `publish-check`, Dagger opt-in | Conserver les preuves L0–L3 et l'offline L1 ajoutés à #240 ; ne pas ajouter une seconde gate |
| Hooks pre-commit | BetterLeaks, Biome, Ruff, actionlint, zizmor | BetterLeaks, Biome, Ruff ; actionlint/zizmor non configurés comme hooks | Ne pas diminuer les contrôles Alban ; harmoniser les conventions et exceptions utiles seulement |
| Toolchain | Node 24–26, npm 12, Next 16.4 | Node 24–26, npm 11, Next 16.3 | Divergence de versions intentionnelle ; ne pas rétrograder pour une parité artificielle |
| SAST / confidentialité | Semgrep, secrets, rapports réduits, tests d'accès privé | Semgrep, BetterLeaks, contrats de confidentialité propres au corpus familial | Garder les gates communes et les protections spécifiques à chaque site |
| DAST | ZAP Preview exact-SHA ; rapports bruts runner-local ; no-report = FAIL | ZAP Preview + active scan manuel protégé | Conserver le DAST actif manuel et borné ; ne pas copier d'artefacts contenant du trafic |
| Coût des workflows | `ci-scope.sh`, cache npm/pre-commit, Quality avant build | CI par scope et préflight local-first, Dagger expérimental | Réutiliser le découpage par scope ; mesurer avant toute duplication de job |

- [x] Auditer les PR Bababou #220, #222, #223, #226, #227, #229, #230, #232, #233 et #234 (outillage uniquement) ; transférer les niveaux de preuve et `just offline-l1` dans la PR #240.
- [ ] Valider localement la nouvelle régression Playwright « catalogue OK / topologie KO », puis la gate Preview sur HEAD exact ; le test source et une ancienne CI verte ne prouvent pas l'exécution en déploiement.
- [ ] Vérifier le résultat d'un scan ZAP Preview produit par le nouveau workflow, avec rapport JSON structurellement valide et statut exact-SHA. Ne pas relancer un scanner coûteux tant que le workflow de la PR n'est pas exécutable dans un contexte de confiance.
- [ ] Mesurer à froid/à chaud le coût des jobs `quality`, build conditionnel, Playwright et DAST avant toute optimisation supplémentaire.

## P0/P1 — Portefeuille de scans AppSec proportionnel au risque (2026-10-19)

Le [contrat de scan](security-scan-matrix.md) explicite la matrice
PR/master et le budget CI, en cohérence avec Bababou sans cloner tous les jobs.

- [x] Conserver BetterLeaks v1.9.0 et `detect-private-key` dans la gate PR ;
  le matcher `public/**` inclut aussi les anciennes pages HTML, sans
  ajouter un second scanner de secrets identique.
- [x] Ajouter Trivy `fs` sur `package-lock.json` et le dépôt : vuln/misconfig
  `CRITICAL` bloquants; licences signalées pour revue; SBOM CycloneDX
  uniquement sur `master` / scans manuels.
- [x] Étendre la passe Semgrep diff-only par `p/owasp-top-ten` en plus de
  `p/ci`, sans SAST full-repo à chaque push.
- [x] Reconnaître CodeQL **Default Setup déjà activé** sur GitHub;
  ne pas maintenir de workflow Advanced incompatible (échec SARIF avéré).
- [x] Réduire le ZAP production de « chaque déploiement + quotidien » à
  **hebdomadaire/manuellement**; conserver ZAP Preview pour les PR déployables
  et Nuclei hebdomadaire à faible débit.
- [x] Retirer l'ancien import Nuclei direct depuis GitHub Actions vers
  DefectDojo : ingestion pull locale filtrée préparée dans
  [Compose #263](https://github.com/AlbanAndrieu/nabla-compose/pull/263).
- [ ] Faire respecter la politique de blocage de CodeQL Critical via
  GitHub Code Scanning/Rulesets; vérifier couverture du Default Setup.
- [ ] Étudier ZAP active/full DAST uniquement après approbation et garde
  de trafic sur des routes publiques explicitement autorisées.
- [ ] Mettre en place une remise **chiffrée** des rapports DAST détaillés
  ou les produire directement sur TrueNAS avant import : artifacts GitHub
  d'un dépôt public ne sont pas un stockage privé.
- [ ] Évaluer les licences `Forbidden/Restricted/Unknown` puis choisir
  les exceptions documentées et un éventuel gate bloquant.
- [ ] Faire aboutir quality gate, tests et Preview sécurité sur HEAD exact.
  Les preuves `SKIPPED`/`NOT_RUN` ne valent pas `PASS`.

## Règles de maintenance

- Garder ici les décisions structurantes, invariants et tâches ouvertes.
- Compacter une tâche terminée lors de la réconciliation suivante ; ne pas recopier
  la chronologie des corrections intermédiaires.
- Garder les preuves utiles au diagnostic dans un runbook ou un incident :
  symptômes, commandes, cause/incertitude, mitigation, rollback et follow-up.
- Les travaux homelab détaillés vivent uniquement dans `docs/homelab-roadmap.md`.
- Une tâche n'est fermée que lorsque sa preuve correspond au HEAD réellement livré.

## Invariants livrés

| Domaine | État à préserver |
| --- | --- |
| Runtime | Next.js App Router + `next-intl` pour EN/FR ; CV HTML et 404 statique restent des exceptions explicitement conservées |
| Toolchain | Node 26.8.2 / npm 12.2.0 en local/CI, épinglé dans `mise.toml` ; `next` et `eslint-config-next` restent alignés ; ESLint reste sur une major supportée par les plugins Next/React |
| Qualité | Gate local-first, auto-fix déterministe, SAST, Betterleaks v1.9.0, lint/types/tests, build conditionnel et preuve exact-SHA ; Just 1.58.0 complète le Makefile conservé ; Axe EN/FR reste reproductible |
| Preview | Les changements runtime gardent Vercel Preview + Playwright/ZAP ; les changements non déployables suivent `ci-scope.sh` |
| Sécurité | Headers de base, ZAP Preview/production et install scripts explicitement contrôlés ; `/security.txt` est canonique, `/.well-known/security.txt` publie la même copie RFC 9116 et la policy unique utilise la route native `/policy/privacy_policy` |
| CSS/UI | Tailwind/PostCSS retiré ; Bootstrap/CDN reste la dette résiduelle à réduire progressivement |
| Homelab | Déclaration, observation runtime, santé, provenance/fraîcheur et exposition restent distinctes **dans le plan privé uniquement** ; la vitrine publique n'expose plus les sondes/ports ; un tunnel sain ne prouve pas une origine saine |
| Dépendances | Renovate est l'unique propriétaire prévu des PR/rebases de dépendances ; Dependabot ne doit pas créer une seconde famille de PR |
| Documentation | Index central, deux roadmaps actives, incidents séparés des runbooks et backlog ouvert limité aux roadmaps par `documentationPolicyContract.test.ts` |
| DSOMM | Snapshot OWASP 5.0.2 statique et commit-pinné ; assessment repository v1 portable ; traduction FR build-time complète 251/251 liée par UUID/sourceCommit ; miroir `.well-known` et validation fail-closed pour agrégation future par `nabla-compose` |

- [ ] **Installation npm sans DNS (local-first)** : `just npm-offline-check` indique seulement la disponibilité des outils/cache (aucun contrôle d’intégrité des dépendances) ; `just npm-offline-install` utilise `npm ci --offline --ignore-scripts --no-audit --no-fund` sur un arbre sans `node_modules` et échoue si le cache est incomplet. Rejouer les scripts requis et la gate stricte uniquement depuis un checkout Git complet, avec dépendances installées et provenance vérifiée. Ne jamais convertir une preuve source-only en PASS publication.
- [ ] **Valider le compactage des diagnostics CI/runtime** : sorties par défaut limitées à 20 lignes dans les gates et la CI (`QUALITY_LOG_TAIL`), détails activables par `QUALITY_VERBOSE=1`, warnings Health Board activables par `HOMELAB_HEALTH_VERBOSE=1`. Preuve intermédiaire : PR #232, quality gate, Semgrep, types et tests unitaires verts sur `fd4fbed` (run `39079985149`) ; garde de parité des types entre maintenance et build ajoutée ensuite. Mesurer la réduction réelle lignes/octets sur deux logs représentatifs avec `scripts/agent-output-metrics.sh` ; conserver les preuves d'échec complètes accessibles hors console et revalider le HEAD final avant clôture. Ne pas assimiler une estimation de tokens à une mesure.

## P0 — Confidentialité homelab et transfert vers ops.albandrieu.com

Réconciliation des cinq dernières PR fusionnées : [dossier vérifié](roadmap-merge-reconciliation-2026-10-18.md)
— **#234** (cadrage), **#232** (logs/quality gate), **#230** (architecture/a11y),
**#231** (text-scale), **#227** (oscillation). Ces acquis doivent survivre
à la suppression des détails publics. Contrat et backlog approfondi :
[docs/private-homelab-observability.md](private-homelab-observability.md).

- [ ] Livrer et vérifier la PR de confinement public **#235** : huit routes
  opérationnelles renvoient 404 sans proxy FastAPI, catalogues et legacy HTML
  assainis, pages `/truenas`, `/nabla`, `/architecture` rendues en mode vitrine.
  Le HEAD Git ne constitue pas une preuve de déploiement.
- [ ] Migrer les tests hérités qui supposaient les données privées en accès
  anonyme : conserver leurs assertions métier sur fixtures synthétiques
  et transférer les scénarios E2E opérateur vers la future UI `ops`.
- [ ] Valider la qualité complète, SAST, types, Playwright/axe 200 %, ZAP sur
  le HEAD exact sans désactiver les garde-fous, puis confirmer l'absence de
  fuites dans HTML/JS/JSON, erreurs, headers, previews et caches.
- [ ] Coordination obligatoire : [FastAPI #353](https://github.com/AlbanAndrieu/fastapi-sample/pull/353)
  et [Compose #263](https://github.com/AlbanAndrieu/nabla-compose/pull/263)
  restent distinctes du confinement de Vercel; accès direct à FastAPI Cloud
  non réputé corrigé par #235.
- [ ] Après livraison, purge/invalidation des caches de production et
  previews, test négatif anonyme et postmortem des anciennes copies
  publiques. Ne jamais affirmer que l'ancien historique Git est privé.

## P0 — Protection de merge, publication et dépendances

- [ ] **Activer le ruleset `master` depuis une workstation autorisée** :
  l'audit live du 30 septembre confirme qu'aucun ruleset n'est installé. Exécuter
  `scripts/manage-master-ruleset.sh --apply`, puis fermer uniquement lorsque
  `--check` retourne `RULESET_OK`. Contrat et rollback :
  `docs/github-master-ruleset.md`.
- [ ] **Valider les permissions live du recovery post-merge** : les contrats locaux
  couvrent trigger master, séparation read/write, patch déterministe, déduplication
  et fallbacks PR/issue/dispatch. Il reste à prouver sur le dépôt réel :
  auto-fixable → PR + dispatch CI ; non auto-fixable → issue dédupliquée.
- [x] **Prouver un cycle workstation complet** :
  `quality:agent:fix` → revue du diff → commit → `quality:agent:publish`
  (pre-push), arbre propre et `--status` = `QG_PUBLISH_PROOF_OK` sur
  `d9bade5` (PR #224, 17/10/2026). Le premier push a été correctement refusé
  par la gate (contrats source homelab cassés par l'extraction).
- [ ] **Décider du lockfile `gh actions-lock`** : `.github/workflows/actions.lock`
  (#226) était refusé par GitHub (« The lockfile could not be validated ») et
  plaçait tous les workflows en `startup_failure` ; il est retiré par la PR #224,
  l'épinglage par SHA dans les workflows est conservé. Ne le réintroduire
  qu'après validation sur une branche de test que GitHub l'accepte avec des
  `uses:` épinglés par SHA.
- [ ] **Boucle offline-first / agent à faible contexte** : tester le fallback artefact Dagger exact-SHA dans un environnement sans DNS GitHub et sans registry npm, valider les tests sans dépendances, distinguer `NOT_RUN` de `PASS`, et conserver une preuve de publication uniquement lorsque le checkout Git, la base et la toolchain ont été réellement contrôlés. Le skill `nabla-ci-debug` décrit désormais le protocole de diagnostic minimal et la politique de réduction des tokens (inspirés de `fastapi-sample` #329/#330, `nabla-compose` #240/#247 et `nabla-site-bababou` #209/#210).
- [x] **Valider le fail-fast sur oscillation d'auto-fix** : le contrat sans réseau `bash scripts/test-agent-quality-oscillation.sh` (A→B→A, convergence, code retour d’échec) retourne `QG_OSCILLATION_CONTRACT_OK` dans le checkout exact-HEAD `d9bade5`, ShellCheck est propre sur le contrat et `agent-quality-gate.sh`, et la gate pre-commit/pre-push est passée (17/10/2026).
- [x] **Introduire une détection de fingerprint répété** pour éviter de lancer les 12 passes quand le workspace revient dans un état déjà vu.
- [x] **Identifier les hooks et fichiers oscillants** dans le diagnostic
  `QG_FIX_OSCILLATION` : chaque passe enregistre les hooks pre-commit ayant
  modifié des fichiers et les fichiers dont le contenu a changé ; un cycle
  imprime `QG_FIX_OSCILLATION_HOOKS` / `QG_FIX_OSCILLATION_FILES` avec les
  passes concernées. Prouvé par `scripts/test-agent-quality-oscillation.sh`
  (17/10/2026).
- [ ] **Activer Renovate côté dépôt** : au 30 septembre, aucun Dependency
  Dashboard ni PR Renovate n'est visible. Désactiver *Dependabot Security Updates*,
  confirmer Mend Renovate App, puis observer Dashboard, PR `security` et un
  rebase conflictuel géré uniquement par `rebaseWhen=conflicted`.
- [ ] **Finaliser Semantic Release** : aucune GitHub Release n'est publiée au
  30 septembre. Fournir l'identité GitHub App, publier réellement `v0.0.1`,
  puis vérifier changelog et rollback.

## P1 — UI/UX et design system

- [ ] Auditer les pages principales en thème clair/sombre et supprimer les
  contrastes/surfaces incohérents encore hérités de Bootstrap/CSS historique.
- [ ] Finaliser les tokens sémantiques globaux avant d'ajouter de nouvelles variantes.
- [ ] Introduire `Section` et `PageHeader` seulement avec un consommateur réel ;
  poursuivre la migration vers les primitives partagées et supprimer les styles
  inline redondants.
- [ ] Réduire Bootstrap/CDN et Bootstrap Icons progressivement, route par route.
- [ ] Toute migration visible doit conserver responsive 320/375/768/1024/1440,
  focus clavier, touch targets et reduced-motion.

## P1 — Accessibilité, SEO et i18n

- [ ] Étendre progressivement l’audit Axe EN/FR aux routes prioritaires restantes. Le socle livré couvre désormais 13 paires EN/FR, soit 26 audits : Home, Contact, Policy, Security, Architecture, TrueNAS, Nabla, AI, Expertise, CISO, DSOMM, CV et JM. Conserver ce périmètre comme non-régression et n’ajouter une route qu’avec un consommateur réel et un coût CI borné.

- [ ] Étendre le contrat 404 GET/HEAD aux chemins HTML legacy localisés/nichés
  seulement après preuve qu'il ne capture ni redirects SEO, ni
  `HTML_ROUTE_SLUGS`, ni CV historiques.
- [ ] Appliquer aux images Alban actives les règles CLS : dimensions intrinsèques,
  lazy loading et `next/image` lorsque cela réduit réellement le coût.
- [ ] Finaliser l'audit SEO production sur `www` : canonical, `hreflang`,
  robots, sitemap et Open Graph. Les redirects `/contact.html` et `/ai.html`
  vers leurs URLs sans extension sont confirmés ; conserver les redirects legacy
  tant que les moteurs exposent encore ces anciennes URLs et au minimum jusqu'au
  23 août 2027, sans toucher aux CV historiques.
- [ ] Décider l'indexabilité de CTID, FreeNAS et Workstation, ainsi que le périmètre
  de langues éditoriales au-delà de EN/FR.

## P1 — Sécurité applicative

La heatmap circulaire du site rend désormais une cellule par activité du modèle
piné et dissocie explicitement couverture, N/A et progression des claims
applicables. Elle est calculée au build depuis l'assessment validé, sans fetch
runtime ni assimilation des absences à des zéros.

Le snapshot OWASP statique sous `/security/dsomm` reste la source locale LKG :
aucun iframe, aucune base et aucun fetch runtime. Le repository publie désormais
`nabla-dsomm-assessment.json` et son schéma v1 : claims par UUID, applicabilité,
progression, confiance et preuves avec miroir HTTP exact sous
`/.well-known/nabla/`. Les activités absentes restent `not-assessed` et les
`not-applicable` sont exclues du score. Le futur agrégateur/provider appartient à
la roadmap homelab.

- [ ] Rebaser snapshot et assessment sur la version DSOMM upstream courante,
  actuellement 5.1.0, en conservant une migration explicite par UUID et la preuve
  du commit source cible.
- [x] Formaliser un [premier modèle de menaces STRIDE](security-threat-model.md)
  pour les frontières Next.js/Vercel/Stripe/FastAPI/GitHub et lier l'activité
  DSOMM niveau 1 `47419324-e263-415b-815d-e7161b6b905e` ; cette documentation
  **ne valide pas à elle seule** un claim DSOMM pleinement implémenté.
- [ ] Étendre les preuves DSOMM : faire revoir le modèle et rattacher TM-01 à
  TM-08 à des tests négatifs et à leurs remédiations ; compléter
  SBOM/provenance/signature supply chain et inventaire machine-readable des
  agents AI. Priorité immédiate : TM-01 rate limiting distribué et TM-02
  politique Origin/Fetch Metadata sans bloquer les usages légitimes. Les gaps
  d'enforcement GitHub/Renovate restent propriétaires des items P0 existants.


- [ ] Définir un rate limiting adapté à `create-checkout-session` et vérifier
  la validation `Origin` des POST navigateur.
- [ ] Ajouter des webhooks Stripe signés uniquement lorsqu'un paiement déclenche
  un état métier serveur.
- [ ] Durcir progressivement la CSP à mesure que Bootstrap/CDN et les scripts/styles
  historiques sont retirés.

## P1 — Homelab transverse

Les tâches détaillées sont dans `docs/homelab-roadmap.md`. Priorités :
TrueNAS 26 WebSocket, cutover catalogue v2, Talos/Kubernetes, résilience DNS,
métriques bornées et séparation disponibilité/posture sécurité.

## P2 — Performance et dette de dépendances

- [ ] Compléter Lighthouse desktop sur un déploiement stable et définir des budgets
  de non-régression LCP, CLS, INP, JS, CSS et JavaScript tiers.
- [ ] Compléter l'audit licences/dépendances puis poursuivre Knip sur les exports et
  types réellement morts, sans supprimer un contrat homelab consommé hors du
  graphe d'import applicatif.
- [ ] Après le premier cycle Renovate réel, valider le lot groupé avec la gate
  complète avant d'envisager un automerge ciblé de patch/minor à faible risque.
- [ ] **Décider l'adoption Dagger après trois PR comparables** : mesurer cache
  froid/chaud, `npm ci`, lint/type/tests/build et divergences exact-SHA. Le PoC
  0.21.10 reste non bloquant. Objectifs à confirmer par le diff final :
  **25–35 %** de réduction du code d'orchestration build/test, **8–12 %** sur
  la sélection CI/tooling globale et jusqu'à **35–45 %** du noyau build/test si
  les scripts shell deviennent de simples adaptateurs. Ne pas migrer Vercel,
  OIDC, statuts GitHub, Preview, ZAP ou release dans Dagger.
- [ ] **Industrialiser la validation distante exact-HEAD sans clone** : le PoC
  publie désormais un `git archive` à rétention 1 jour. La méthode
  connector → artifact → extraction → test ciblé est prouvée sans DNS local ;
  la fermer après merge et réutilisation sur une tâche ultérieure. Elle ne doit
  jamais être présentée comme équivalente à `quality:agent:publish`, car
  l'archive ne contient ni `.git` ni les dépendances installées.
- [ ] **Benchmarker les hooks sur le dépôt réel avec Hyperfine** : conserver
  pre-commit comme référence, comparer d'abord prek sur la même configuration,
  puis hk avec parité de règles et exécution parallèle sûre. Évaluer ensuite le
  mode agent de hk (JSON/JSONL, `--safe`, MCP) avant toute migration. Lefthook
  reste un candidat de simplicité si les mesures hk/prek ne compensent pas le
  coût de migration.
- [ ] **Mesurer trois PoC d'efficacité agentique avant ajout permanent** :
  ast-grep pour recherche/codemod structurels, Context7 pour documentation
  versionnée avant génération de code, et Oxlint en pré-lint incrémental avant
  ESLint. Mesurer temps jusqu'au premier diagnostic, volume de contexte lu,
  taille du patch et nombre de reruns. N'évaluer Serena MCP ou Repomix compressé
  que si la recherche GitHub/rg/ast-grep ne donne pas déjà un contexte ciblé.
- [ ] Ajouter un mode local de parité Preview (`BASE_URL=<preview> npm run test:a11y`
  ou équivalent) afin de reproduire les audits exact-SHA sans attendre la CI.
- [ ] Ajouter une régression visuelle ciblée EN/FR (Home, Security, Architecture)
  sur quelques viewports/thèmes stables avant d'étendre Playwright à Firefox/WebKit
  ou à davantage de profils mobiles ; conserver un coût CI borné.
- [ ] Rétablir une lecture automatisable des logs runtime Vercel lorsqu'un
  connecteur/endpoint adapté est disponible.

Les preuves détaillées des livraisons terminées restent dans Git/GitHub et, si
elles ont encore une valeur opérationnelle, dans les documents indexés par
`docs/README.md`.
