# Feuille de route produit et qualité

Dernière réconciliation : 7 octobre 2026.

Cette roadmap contient les **travaux transverses encore ouverts** et les invariants
nécessaires pour comprendre l'état cible. Git/GitHub conserve la chronologie
complète des PR, commits et runs ; les procédures de diagnostic restent dans les
runbooks et les retours d'incident sous `docs/incidents/`.

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
| Toolchain | Node 26.8.2 / npm 11.17.x en local/CI ; `next` et `eslint-config-next` restent alignés ; ESLint reste sur une major supportée par les plugins Next/React |
| Qualité | Gate local-first, auto-fix déterministe, SAST, Betterleaks v1.9.0, lint/types/tests, build conditionnel et preuve exact-SHA ; Just 1.58.0 complète le Makefile conservé ; Axe EN/FR reste reproductible |
| Preview | Les changements runtime gardent Vercel Preview + Playwright/ZAP ; les changements non déployables suivent `ci-scope.sh` |
| Sécurité | Headers de base, ZAP Preview/production et install scripts explicitement contrôlés ; `/security.txt` est canonique, `/.well-known/security.txt` publie la même copie RFC 9116 et la policy unique utilise la route native `/policy/privacy_policy` |
| CSS/UI | Tailwind/PostCSS retiré ; Bootstrap/CDN reste la dette résiduelle à réduire progressivement |
| Homelab | Déclaration, observation runtime, santé, provenance/fraîcheur et exposition restent distinctes ; un tunnel sain ne prouve pas une origine saine |
| Dépendances | Renovate est l'unique propriétaire prévu des PR/rebases de dépendances ; Dependabot ne doit pas créer une seconde famille de PR |
| Documentation | Index central, deux roadmaps actives, incidents séparés des runbooks et backlog ouvert limité aux roadmaps par `documentationPolicyContract.test.ts` |
| DSOMM | Snapshot OWASP 5.0.2 statique et commit-pinné ; assessment repository v1 portable ; traduction FR build-time complète 251/251 liée par UUID/sourceCommit ; miroir `.well-known` et validation fail-closed pour agrégation future par `nabla-compose` |

- [ ] **Valider le compactage des diagnostics CI/runtime** : sorties par défaut limitées à 20 lignes dans les gates et la CI (`QUALITY_LOG_TAIL`), détails activables par `QUALITY_VERBOSE=1`, warnings Health Board activables par `HOMELAB_HEALTH_VERBOSE=1`. Vérifier les tests et le HEAD exact ; conserver les preuves d'échec complètes accessibles hors console avant de clore le sujet.

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
- [ ] **Prouver un cycle workstation complet** :
  `quality:agent:fix` → revue du diff → commit → `quality:agent:publish`,
  arbre propre et preuve exacte encore valide avec `--status`.
- [ ] **Boucle offline-first / agent à faible contexte** : tester le fallback artefact Dagger exact-SHA dans un environnement sans DNS GitHub et sans registry npm, valider les tests sans dépendances, distinguer `NOT_RUN` de `PASS`, et conserver une preuve de publication uniquement lorsque le checkout Git, la base et la toolchain ont été réellement contrôlés. Le skill `nabla-ci-debug` décrit désormais le protocole de diagnostic minimal et la politique de réduction des tokens (inspirés de `fastapi-sample` #329/#330, `nabla-compose` #240/#247 et `nabla-site-bababou` #209/#210).
- [ ] **Valider le fail-fast sur oscillation d'auto-fix** : le contrat sans réseau `bash scripts/test-agent-quality-oscillation.sh` couvre A→B→A, la convergence et le code retour d’échec ; le harnais a été exécuté sur la fonction correspondante en environnement isolé. Restent la preuve complète avec le script versionné dans le checkout exact-HEAD et la quality gate ShellCheck/pre-commit.
- [x] **Introduire une détection de fingerprint répété** pour éviter de lancer les 12 passes quand le workspace revient dans un état déjà vu.
- [ ] **Identifier les hooks et fichiers oscillants** dans le diagnostic
  `QG_FIX_OSCILLATION` (détection des fingerprints répétés déjà livrée).
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
- [ ] Augmenter la couverture de l'assessment avec les preuves à plus fort levier :
  threat model propre à `nabla-site-alban`, SBOM/provenance/signature de la
  supply chain et inventaire machine-readable des agents AI. Les gaps
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
