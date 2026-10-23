## P0 — ReactFlow TrueNAS : rendre visibles tous les services déclarés (24 octobre 2026)

- [x] Cause d'une vue trompeusement vide identifiée : le mode `services` initialisait `scope=critical`, ce qui masque les entités de criticité `support` (notamment lorsque Backstage v2 ne publie pas encore de relations de dépendance). Initialiser `scope=all` **uniquement quand** `initialMode=services` ; conserver le filtre « Chemin critique » accessible dans la barre et le défaut `critical` pour le mode AI existant.
- [x] Ajouter un contrat de régression sur le choix initial « Tous les composants » ; préserver le fallback graphique nœuds seuls quand les relations déclarées sont indisponibles.
- [ ] Confirmer avec Playwright sur un build Next.js complet que les nœuds/miniatures/icônes apparaissent sur `/fr/truenas` dès que le catalogue v2 est accessible, indépendamment des relations.

## P0 — Isolation des modes OWNER / SERVICE v2 et refus explicites (24 octobre 2026)

- [x] Détecter la portée du catalogue dans le hook (`catalogScope = owner/public`) et masquer **synchroniquement** catalogue, topologie et santé de l'autre mode avant le nettoyage des effets React ; remettre à zéro l'état lors d'un changement de mode.
- [x] Appliquer le parseur client à liste blanche aux réponses SERVICE v2 HTTP 200 avant de les placer dans l'état React ; les métadonnées privées et URLs étrangères ne doivent jamais être affichées, même si la passerelle renvoie un JSON malformé.
- [x] Distinguer un refus explicite (`401/403/404`, `reason=access-denied/key-missing`) d'une indisponibilité (`502/503` sans refus) : purger et masquer immédiatement tout LKG public dans le premier cas ; conserver seulement le cache SERVICE validé, borné et signalé périmé dans le second.
- [x] 5 tests ciblés du nouveau module effectivement exécutés en conteneur sous Node 22 (5/5) et vérification `tsc --strict` du module. Ajout de 2 tests d'intégrité du payload public pour la suite de tests du dépôt.
- [ ] Sur checkout complet Node 24/npm 12 : `npm ci`, lint, typecheck, tests unitaires React/hook, compilation et Playwright sur transitions OWNER → public → refus, erreurs 502 et `catalogRevision`. **Non exécutés** ici (DNS GitHub indisponible).
- [ ] Lors d'un test distant, vérifier la présence de ReactFlow, des icônes locales et de l'inventaire effectivement exposé. Ne pas rendre publiques les sondes ou chemins réseau OWNER.

## P1 — Revalidation de l'accès navigateur OWNER / lecture publique (23 octobre 2026)

- [x] Remplacer l'ancien `accessProbe` conservé indéfiniment par un coordinateur client dédupliquant les vérifications concurrentes de TrueNAS et d'Architecture.
- [x] Réexaminer `/api/homelab-access` toutes les **30 secondes** dans les onglets visibles et au retour au premier plan (délai minimal de 2 secondes pour éviter les rafales).
- [x] Masquer immédiatement les vues OWNER pendant une nouvelle vérification (`pending`), refuser les réponses inconnues et révoquer le rendu après une erreur HTTP, réseau ou JSON. Conserver toutes les autorisations sur les routes serveur ; ce hook ne constitue jamais un mécanisme d'authentification.
- [x] Purger les projections publiques stockées localement lorsque l'accès est refusé, y compris après changement de Wi-Fi/VPN. Nettoyer les temporisateurs et événements sur démontage.
- [x] **22/22 tests ciblés réellement exécutés sur le mini-checkout local** sous Node 22 : 14 sur le cache SERVICE, 6 sur la coordination/expiration d'accès et 2 contrats de branchement React. Contrôle `tsc --strict` du nouveau hook, du coordinateur et du cache avec types React simulés.
- [ ] Quality gate complète sous Node 24 LTS, tests React/Playwright et Vercel Preview exact-SHA sur les transitions Wi-Fi/OWNER/public, y compris plusieurs composants simultanés. Ne pas créer de PR ou lancer de CI payante avant validation locale complète.

## P0 — Icônes et ReactFlow TrueNAS / catalogue Backstage v2 (23 octobre 2026)

- [x] Vérifier la version réellement servie par Vercel : la production est toujours sur `55ccc4c` (#247), car le build `53419c1` (#248) a échoué au typecheck. Les quatre erreurs remontent aux valeurs `entityRef` non typées (`unknown`) dans les deux hiérarchies et les filtres.
- [x] Typer explicitement `HomelabService.entityRef` et `HomelabServicesCatalog.catalogRevision` ; ne pas assouplir le parseur strict Backstage v2.
- [x] Rétablir les icônes spécifiques pour les identifiants canoniques et variantes déclarées, avec 102 alias vers 80 assets déjà présents dans `public/assets/selfh-icons`. Ne jamais charger une URL de logo fournie par un catalogue externe.
- [x] Réutiliser ReactFlow (mode `services`) sous les cartes de TrueNAS en OWNER et lecture publique : l'accès extérieur exploite exclusivement la projection v2 ; en l'absence de relations, montrer les seuls services déclarés et indiquer explicitement l'absence d'arêtes.
- [ ] Exécuter Node 24.22.1/npm 12.2.0 : `npm ci`, `npm run typecheck`, `npm run test:unit`, `npm run build`, puis quality gate locale complète. Contrats de sources présents mais compilation et E2E non exécutés dans l'agent sans clone DNS.
- [ ] Après build Vercel READY exact-SHA, vérifier la présence des icônes (/assets/selfh-icons/...), les réseaux OWNER/publiques, l'affichage du graphe, la correspondance des identités et la mise à jour effective du domaine `www.albanandrieu.com`.
- [ ] Distinguer les 502/timeouts des endpoints FastAPI OWNER observés en production d'une défaillance des images statiques ou du graphique de services. Le graphe réseau LAN reste OWNER.

## P1 — Cache navigateur limité aux projections SERVICE v2

- [x] Last-Known-Good **uniquement en lecture publique** : catalogue SERVICE v2 pendant 15 min, derniers états publiables pendant 2 min, corrélation stricte par `catalogRevision`. Les états issus du cache sont toujours `stale/unknown`, jamais déclarés sains sur la base d'une ancienne mesure.
- [x] Liste blanche des champs autorisés dans `localStorage` : identité Backstage, nom, icône statique et topologie déclarative sans preuve d'exploitation. Aucun endpoint, IP LAN, clé, sonde ni résultat OWNER ; le hook OWNER n'utilise pas ce cache.
- [x] Rejeter les références Backstage et les sondes dupliquées ; en cas de topologie incohérente, afficher les nœuds déclarés sans inventer de relations.
- [x] Onglets de longue durée : revalidation du catalogue toutes les 5 minutes lorsque visible et au retour sur l'onglet, sans rafale de requêtes. Un changement de révision invalide les anciens états SERVICE.
- [x] Sur décision d'accès `denied`, purger les deux clés du cache public (y compris après désactivation de l'accès anonyme).
- [x] **14/14 tests unitaires exécutés localement** avec Node 22 et suppression expérimentale des types TypeScript ; `tsc --strict` ciblé réussi. Cas : nettoyage des données, TTL, révisions, doublons, topologies invalides, quota stockage et révocation.
- [ ] Exécuter `npm ci`, typecheck, lint, tests React/Next et build sous Node 24.22.1 LTS sur un checkout complet ; faire une validation Preview exact-SHA de `/fr/truenas` et `/fr/architecture` en OWNER et lecture publique.
- [ ] Tester en E2E le retour réseau, l'abandon des requêtes lors du démontage, la cohérence des deux vues et le comportement multi-onglets ; la validation du module isolé ne constitue pas une quality gate globale.

## P0 — Node.js LTS et outillage stabilisé (23 octobre 2026)

- [x] Revenir de Node 26 Current à **Node 24.22.1 LTS**, correctifs de sécurité du 21 octobre : aligner `.nvmrc`, `.envrc`, les `engines`/ `devEngines` de `package.json`, la racine de `package-lock.json`, le Dagger LTS local et les fixtures de tests. Conserver npm **12.2.0**, outil pin dans `mise.toml`.
- [x] Ne pas recopier les empreintes SHA-256 de Node 26 : retirer l'ancien bloc du `mise.lock` en attendant un `mise lock` sur une machine ayant accès aux archives signées Node 24.
- [ ] **Quality gate bloquante** avant Ready/merge : reconstruire l'entrée de `mise.lock` sur un environnement de confiance puis exécuter `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`, `just quality`. Aucun résultat global validé à ce stade, pas de CI GitHub payante.
- [x] `@types/node` aligné sur **24.13.3** et Next.js sur **16.4.2** dans les manifestes et le lockfile repris de `master` ; conserver la validation `npm ci`/typecheck/build à effectuer sur Node 24.22.1.
- [ ] Vérifier la configuration runtime Node côté Vercel, la Preview exacte SHA, les pages `/truenas` et `/architecture`, les modes OWNER et public v2 ; aucune migration de déploiement sans validation.
- [ ] Quand Node 26 sera officiellement LTS (date prévue 28 octobre 2026), reconsidérer une **nouvelle** migration uniquement après tests, pas par anticipation.

## P0 — Vue extérieure : ne plus sonder OWNER depuis le navigateur (23 octobre 2026)

- [x] **P0 post-merge #248** : corriger l'inversion `readOnly` entre l'architecture publique et la vue OWNER ; tests distincts par branche et masquage immédiat des snapshots OWNER lorsqu'un rendu passe en lecture seule.

- [x] Les vues externes en lecture seule de TrueNAS et de l'architecture consomment seulement les projections publiques `/api/homelab-services`, `/api/homelab-catalog-v2` et `/api/homelab-health-v2` ; aucun polling du runtime `/api/homelab-status`, des probes `/api/homelab-probes` ou de l'agrégat OWNER `/api/homelab-health`.
- [x] Réutiliser le parseur strict `SiteHealthV2` et indexer les états par `entityRef` et `catalogRevision` ; conserver `unknown` quand le catalogue ne correspond pas ou que `boardState` n'est pas `fresh`.
- [x] Projeter ces statuts sur les cards, filtres et hiérarchies mobile et desktop, sans afficher les composants de diagnostics bruts, sans déduire une panne de l'absence de droits OWNER.
- [ ] Exécuter localement `just offline-l1`, `just p0` et la suite TypeScript/Playwright sur un checkout complet du HEAD. **NOT_RUN** tant que le DNS GitHub bloque l'obtention de la branche dans l'agent ; l'analyse statique des sources ne remplace pas les gates.
- [ ] Valider sur Vercel Preview, hors Wi-Fi et au domicile, que le même `catalogRevision` affiche bien des services avec états publics et que le navigateur ne fait aucun appel OWNER non authentifié. Conserver un LKG uniquement pour l'affichage de la dernière observation, jamais pour déclarer un état `OK` courant.
- [ ] Après MFA/VPN distant opérationnel, rétablir les restrictions OWNER conformément à la section ci-dessous, sans réintroduire de double lecteur v1 ou de contrat parallèle.

## P0 — External remote access, temporary public read-only (22 octobre 2026)

- [x] `HOMELAB_PUBLIC_READONLY_ENABLED=true` (temporary default) serves **only** allowlisted Backstage v2 read projections from the Vercel site to external visitors, without the home CIDR: `/api/homelab-services`, `/api/homelab-catalog-v2`, `/api/homelab-health-v2`. The server-to-FastAPI SERVICE key remains required and must not reach client bundles.
- [x] A cryptographically verified Cloudflare Access owner JWT may also unlock full OWNER views outside the home CIDR while `HOMELAB_OWNER_REMOTE_ACCESS_ENABLED=true` (temporary default). This exception never admits an anonymous visitor to raw OWNER data. A missing/malformed JWT remains denied.
- [x] Public endpoint selection is method- and exact-path-based. Raw probes, `/api/homelab-observability`, runtime topology, security posture, operator controls and mutations remain behind the existing OWNER gate. CDN cache is always `private, no-store`. The /api/homelab-access probe advertises `mode=public-readonly` when that fallback is active.
- [ ] **Re-enable OWNER protection**: set `HOMELAB_PUBLIC_READONLY_ENABLED=false` and `HOMELAB_OWNER_REMOTE_ACCESS_ENABLED=false` when Access MFA/VPN is working remotely, with tests proving an external untrusted visitor gets 404 on all OWNER surfaces. In parallel restore the FastAPI home-CIDR factor by setting `HOMELAB_OWNER_REMOTE_ACCESS_ENABLED=false`.
- [ ] Verify the Vercel production server has a valid `DIAGNOSTICS_ACCESS_KEY` for the canonical FastAPI SERVICE v2 reader; missing, denied, invalid or stale backend catalog remains 503, never a fabricated healthy service or legacy v1 fallback. Validate FR/EN /truenas and /architecture from external/mobile and home networks.
- [ ] Improve operational UI external view by consuming safe, strictly projected read models for additional statuses; **do not** publish raw LAN IPs, credentials, probe HTTP traces, security posture or private URLs to satisfy a missing card. Both repos remain draft/local-first until explicitly approved.

## P0 — Restauration diagnostics OWNER depuis Wi-Fi + icônes (23 octobre 2026)

- [x] L'accès OWNER à la page est déjà vérifié via l'edge Vercel ; ne pas confondre cette IP navigateur et l'egress Vercel vers FastAPI.
- [x] Lever le blocage site OWNER uniquement en présence de `DIAGNOSTICS_ACCESS_KEY` côté serveur et d'une requête déjà passée par `gatedHomelabResponse`. Conserver `HOMELAB_OWNER_RAW_UPSTREAM_ENABLED=false` comme arrêt d'urgence.
- [x] Envoyer `X-Diagnostics-Key` aux trois sources FastAPI (health-board, aggregate, probes), sans chaîne de redirection et sans exposer la clé au navigateur.
- [x] Rendre les icônes statiques indépendantes des observations runtime : projection canonique Backstage v2 → assets SVG publics autorisés.
- [ ] Confirmer en production l'activation temporaire FastAPI `HOMELAB_OWNER_REMOTE_ACCESS_ENABLED=true`, la correspondance de la clé, et le comportement HTTP 200 versus 401/403/503 depuis la vraie IP domestique.
- [ ] Après disponibilité du relais OWNER authentifié, remettre les deux drapeaux FastAPI et Site à leurs valeurs restrictives ; ne jamais autoriser l'egress Vercel dans `HOMELAB_TRUSTED_CIDRS`.
- [ ] Compiler et tester le dépôt entier avec Node 24, puis vérifier la Preview exact-SHA et la production ; PR #247 et #248 déjà fusionnées, ne pas relancer GitHub Actions payantes avant validation locale.

## P0 — Une seule image Dockerfile pour Talos (23 octobre 2026)

- [x] Le Dockerfile racine devient l'application complète Next.js SSR/API (port 3000), non-root et multi-stage ; supprimer Dockerfile.k8s et son ignore spécifique.
- [x] Mettre à jour .dockerignore, justfile, tests de contrat, CI Docker et SCA, ainsi que le runbook ; ne pas modifier le build natif Vercel.
- [x] Ne plus ignorer Trivy sur des mises à jour Next.js : construire, smoke et scanner l'image avant publication ; image par SHA et déploiement par digest.
- [ ] Construire et lancer le vrai conteneur avec Node/npm/Docker disponibles ; scan Trivy et tests de bout en bout à prouver avant passage en Ready.
- [ ] Inventorier les consommateurs historiques de l'image de fallback Nginx avant publication sous les anciens tags GHCR/Docker Hub.

## P1 — Convergence qualité nabla-compose → site-alban (23 octobre 2026)

- [x] Comparaison des contrôles des deux dépôts : actionlint, zizmor, hadolint, ShellCheck, Betterleaks, contrôle des exécutables, hook Git pre-push et politique Draft/Ready déjà présents ; ne pas les dupliquer.
- [x] Ajouter `just loop` et `mise run agent-loop` comme étape rapide pre-commit sur les fichiers modifiés, avec comparaison Git stricte et sans publication.
- [ ] Vérifier la convergence du gate local sur un checkout **Node 24.22.1 LTS** et npm 12 ; `just loop` ne remplace ni typecheck, tests, build ni quality:agent:publish.
- [ ] Déployé en un seul `Dockerfile` pour le serveur Next.js port 3000 (Vercel reste natif) ; le workflow Docker vérifie cette image uniquement hors PR Draft. Tests de build réels restant à faire localement.

## P0 — Convergence CI / hooks avec nabla-compose (22 octobre 2026)

- [x] Reprendre le principe `Draft` sans runner facturé : jobs conditionnels dans Docker fallback, Trivy SCA, RSS OPML et MegaLinter ; `ready_for_review` doit réactiver les contrôles obligatoires, sans directives de skip.
- [x] Remplacer `Dockerfile.k8s*` par le seul `Dockerfile` dans la portée CI/SCA et supprimer le fallback Nginx du workflow Docker ; Trivy de l'image est bloquant sur Ready.
- [x] Remplacer le hook shfmt-docker par shfmt natif comme dans nabla-compose, avec Go 1.25.12 géré par mise. Le premier bootstrap du hook requiert Go et l'accès aux dépendances, **non validés ici**.
- [x] Adapter l'inventaire GitHub Actions à la proposition bornée de nabla-compose #269 (encore Draft) : pagination limitée, validation des IDs, métriques partielles en échec explicite et tests hors ligne indépendants de GitHub CLI. Les tests du vrai checkout restent à exécuter.
- [ ] Exécuter `just hooks`, quality fix/publish, actionlint, zizmor, BetterLeaks et Next.js build dans un checkout complet avant revue. Source-check ajoute désormais le contrat CI et les tests Actions, sans prétendre à une preuve de publication. Aucun GitHub Actions lancé.
- [ ] Auditer puis réduire les droits de mutation du workflow MegaLinter sur les PRs externes, sans compromettre les validations obligatoires.

## P1 — Image Next.js pour Talos/Kubernetes (22 octobre 2026)

- [x] Conserver un seul Dockerfile racine pour Next.js standalone SSR/API, Node 26.8.2 et npm 12.2, UID/GID 10001 et port 3000.
- [x] Ajouter un contexte Docker spécifique excluant les secrets, un smoke read-only avec frontière OWNER fermée et des cibles justfile sans Actions.
- [x] Aligner le conteneur sur scripts/talos/deploy-site-alban.sh déjà présent dans nabla-compose ; déploiement Talos limité au hostname privé de recette, sans bascule de www.albanandrieu.com.
- [ ] Protéger le déploiement par Traefik TLS/LAN-only, fournir le cache .next writable en emptyDir et une Secret Kubernetes via GitOps (source d'autorité nabla-compose).
- [ ] Construire, scanner Trivy et publier une image par digest sur une machine avec Docker/Node/npm ; procéder au preflight Talos et dry-run serveur puis effectuer un smoke HTTPS.
- [ ] Ne pas contourner lib/homelabAccess.ts : le contrôle OWNER basé sur les entêtes Vercel ne reconnaît pas le proxy Traefik, faute de chaîne de confiance validée.
- [ ] Quality gate, tests Next.js complets et mise en production : non exécutés dans l'environnement agent sans checkout ni Docker.

## P0 — Résilience UI TrueNAS / frontière OWNER (22 octobre 2026)

- [x] Déduire du code la cause structurelle de la réponse OWNER 503 sur Vercel :
  `HOMELAB_OWNER_RAW_UPSTREAM_ENABLED` désactivé par défaut ; ne pas le réactiver
  sans relais d’identité propriétaire validé.
- [x] Classifier explicitement le 503 `owner-boundary` dans les deux routes
  protégées, court-circuiter l'amont et éviter leur polling répété depuis le
  navigateur ; continuer la collecte SERVICE v2.
- [x] Corriger les faux crânes TrueNAS : `unknown` lorsque la télémétrie est
  absente ou périmée ; `missing` exclusivement lorsque `runtime_missing`
  est confirmé sur des données courantes.
- [ ] **Recette live sur le réseau autorisé** : comparer les réponses
  `/api/homelab-health-v2`, `/api/homelab-catalog-v2` et le motif OWNER
  `/api/homelab-health` après déploiement du HEAD exact.
- [ ] **Diagnostics enrichis** : définir un relais OWNER sécurisé (Access/JWT
  vérifié, RBAC, audit, anti-replay, TLS), sans accepter l’egress Vercel comme
  identité humaine.
- [ ] Quality gate locale complète, tests Playwright et comportement Production
  vérifié une fois le checkout Node/npm compatible disponible ; pas d'Actions
  GitHub coûteuses dans le quota actuel.

## P0 — Unicité stricte des services Backstage v2 (22 octobre 2026)

- [x] Audit de `nabla-compose/master` au SHA `1e4060d58c6553c1717630a024c7739fdb7d24f0` : 153 entités, dont 150 Component/Resource/API ; **0 doublon** de `metadata.name`, titre affiché ou slug de carte. Les noms en collision utilisés auparavant dans les tests étaient fictifs.
- [x] Refuser le catalogue v2 dans le parseur si deux entités affichables possèdent le même nom insensible à la casse, le même titre normalisé ou le même identifiant de carte. Ne jamais renommer un service ambigu ou fabriquer une identité alternative.
- [x] Simplifier la projection React Flow en supprimant l'algorithme de résolution des collisions, tout en conservant les identifiants existants pour les services valides.
- [ ] Appliquer la même invariant dans le générateur de `nabla-compose` et le validateur FastAPI, avant publication, afin que les erreurs soient diagnostiquées à la source.
- [ ] Validation intégrale du dépôt (formatage, pre-commit, tests Next.js et Preview exacte) lorsque l'environnement Node/npm compatible et le checkout complet seront disponibles ; aucun runner Actions tant que les crédits sont épuisés.

## P0 — Corrélation des états SERVICE v2 et cartes privées (21 octobre 2026)

- [x] Empêcher l'attribution d'un état SERVICE à plusieurs `entityRef`
  partageant le même nom lorsque FastAPI ne corrèle encore les sondes que sur
  `metadata.name` : état `unknown`, jamais état positif supposé.
- [x] Pour les cartes Backstage v2, n'accepter les observations OWNER détaillées
  que si leur identifiant explicite correspond exactement au service projeté.
  Les cartes historiques sans `entityRef` gardent leur rapprochement par nom/URL.
- [x] Vérifier dans l'environnement agent : 8 tests isolés d'états SERVICE,
  5 tests isolés d'identité et 5 tests de projection (18 PASS), compilation
  TypeScript ciblée stricte. Ces bancs partiels ne prouvent pas le build Next.js.
- [ ] **FastAPI** : supprimer la jointure sur `metadata.name` au profit d'une
  identité canonique `entityRef` étayée par la source de sondes, puis
  synchroniser les tests inter-repos et retirer la mesure conservatrice.
- [ ] **Contrat inter-repos** : aligner le traitement des points et underscores
  dans les noms/références : le Site accepte ces caractères mais les validateurs
  FastAPI actuels n'acceptent que les noms avec tirets.
- [ ] **Validation restante** : vrai checkout Node 26/npm 12, quality gate
  local-first, tests Playwright exact-SHA et recette SERVICE live. Ne pas
  utiliser GitHub Actions en quota épuisé ; conserver cette branche sans PR,
  car `pull_request_target` côté `master` peut encore réserver un runner.

## P0 — Cutover direct Backstage v2 (20 octobre 2026, Site #240)

- [x] Cible confirmée auprès de FastAPI [#358](https://github.com/AlbanAndrieu/fastapi-sample/pull/358) :
  `GET /api/site/catalog/v2`, schéma `{schemaVersion:2, model:"backstage", catalogRevision, entities}`,
  `X-Diagnostics-Key` server-only. Aucun lecteur HTTP v1 en secours.
- [x] Site : API owner `/api/homelab-catalog-v2`, projection `entityRef`
  vers cartes et graphe, contrôle CIDR indépendant de l'identité SERVICE,
  confidentialité et gestion explicite 401/403/404/503, tests simulant la clé
  invalide et les relations sans fuite d'IP/ports.
- [x] Préserver les cartes même si une topologie indépendante échoue :
  cartes et topologie résident maintenant dans la même réponse v2.
  La page Architecture lit uniquement le graphe v2 authentifié.
- [ ] **Validation effective du runtime v2** : Site #240, FastAPI #358
  et Compose #265 sont fusionnées ; vérifier toutefois que FastAPI déployé
  charge réellement `catalog/generated/entities.json` et répond avec un
  catalogue SERVICE contenant des Component, Resource ou API. La fusion des PR
  n'atteste pas ce résultat. Aucun fallback v1.
- [ ] Valider depuis le Wi-Fi autorisé : `GET /api/homelab-access?diagnose=1`
  reste `trusted:true`; la **clé Preview factice** doit être refusée,
  via un 503 Site dont la raison est `access-denied` uniquement lorsque
  FastAPI répond réellement 401/403. Tester aussi le 404 depuis un autre réseau.
- [ ] Après fourniture d'une vraie clé dédiée, réessayer la Preview exacte :
  HTTP 200 + `X-Homelab-Inventory-Complete:true`, services non vides, révision
  identique sur les routes owner et Architecture, aucun détail secret.
  Aucune clé valide présumée ni récupérée actuellement.
- [ ] Exécuter les quality gates complètes sur le HEAD exact dès qu'un
  environnement compatible Node/npm est disponible ; pendant le quota Actions
  épuisé, conserver la branche de stabilisation en dehors d'une PR pour
  éviter l'exécution du workflow `pull_request_target` sur `master`.
  Aucune fusion sans autorisation.
- [ ] Confirmer les scans OWASP ZAP Preview réels et la confidentialité
  des rapports ; la classification des erreurs sans rapport n'est pas une
  preuve d'exécution du scanner.

## Diagnostic supplémentaire — 20 octobre 2026
L'accès propriétaire `trusted:true` est confirmé depuis le Wi-Fi du domicile.
La clé `DIAGNOSTICS_ACCESS_KEY` est désormais présente en **Preview** dans Vercel
(variable sensible créée le 20 octobre, avant la Preview READY du HEAD `7fae991`).
Ce constat **ne prouve pas** que FastAPI accepte la clé ni que l'inventaire est complet :
depuis le domicile, vérifier l'API privée et la présence effective de PostgreSQL.
Ne pas partager la valeur de la clé ni la promouvoir en production.

Le catalogue est chargé indépendamment de la topologie (PR #240), afin qu'un
échec de `/api/homelab-topology` ne masque pas les cartes valides.
Le serveur préfère `HOMELAB_SERVICES_API_KEY` à la clé générique de transition,
transmet `X-Diagnostics-Key` exclusivement au backend et interdit de suivre une
redirection avec cette clé. Une réponse FastAPI 401/403 laisse le fallback neutre.

## P0 — Réparer les cartes de services privées après #238 (20 octobre 2026)

- [x] Le diagnostic owner de la PR #240 a été confirmé depuis le Wi-Fi domicile :
  `trusted:true`, `authorized`, IPv4, CIDR chargé. Ce n'est pas une erreur d'accès.
- [x] Identifier le **placeholder unique** de `public/homelab-services.json` :
  l'ancien catalogue complet n'est plus publié (confidentialité). Son utilisation
  en repli ne doit plus ressembler à une liste opérationnelle vide.
- [x] Faire accepter au client serveur FastAPI un `HOMELAB_SERVICES_API_KEY`
  (en-tête `X-Diagnostics-Key`, secret Vercel serveur uniquement), sans l'exposer
  aux bundles, assets, URL de logs ou pages publiques. Garder le fallback sûr.
- [ ] **Validation runtime bloquante** : la clé générique `DIAGNOSTICS_ACCESS_KEY` existe en Preview et la Preview `7fae991` est READY, mais aucune réponse authentifiée propriétaire du catalogue n'a encore été constatée sur ce build. Depuis le domicile, contrôler que FastAPI renvoie PostgreSQL et Prometheus. Le fallback public reste uniquement un placeholder.
- [ ] **Séparation des privilèges** : provisionner une `HOMELAB_SERVICES_API_KEY` dédiée en lecture seule (Vaultwarden), confirmer les droits du backend, l'utiliser dans Vercel et retirer la clé générique dès validation. Ne pas publier le JSON brut dans Git ou les artefacts.
- [x] Contrat unitaire : clé réservée au fetch serveur, PostgreSQL accepté dans le catalogue FastAPI, erreur 403 amont → repli placeholder sans fuite de secret (tests dans la PR #240, exécution sur HEAD final à revalider).
- [ ] Tester sur la dernière Preview du HEAD après déploiement, depuis le domicile,
  `/api/homelab-services` (HTTP 200, `X-Homelab-Services-Source: fastapi`,
  `X-Homelab-Inventory-Complete: true`), puis les cartes et les liens
  `#service-postgresql` et `#homelab-service-postgresql`.
  Depuis un réseau extérieur, exiger toujours 404.
- [x] Corriger l'initialisation indépendante catalogue/topologie et ajouter
  trois contrats E2E avec API simulées : inventaire valide malgré topologie
  inaccessible, placeholder explicite, refus visiteur. **Exécution locale NOT_RUN**
  (pas de checkout et DNS GitHub indisponible dans l'environnement d'agent).
- [ ] Fermer la dette ZAP Preview : échec scanner sans rapport sur PR #240.
  La CI historique #39490804675 n'est **pas** une preuve du nouveau workflow.
  Classification exit=3 (scanner), rapport JSON valide avec site(s), détection
  démarrage/docker, et absence d'artefact HTTP brut ajoutées dans la PR.
  **Reste NOT_RUN** : un scan réel exact-SHA via la politique déployée, sans
  retirer la gate bloquante ni déclencher des pipelines inutilement.

## Qualité — parité choisie avec nabla-site-bababou

- [x] Réutiliser les niveaux de preuve L0–L3, le chemin source exact-SHA lorsque DNS est indisponible et la lecture du seul job CI réellement échoué dans le skill `nabla-quality`.
- [ ] Valider la qualité du HEAD final avec les gates Alban existantes ; ne pas recopier intégralement les hooks spéciaux Bababou (données familiales, Dagger expérimental, outillage Python hors périmètre) sans analyse de compatibilité.

# Feuille de route homelab

## État du chantier DefectDojo / Preview — 19 octobre 2026 (HEAD de la PR #236)

| Périmètre | Statut | Preuve / limite |
| --- | --- | --- |
| Quality + Trivy du HEAD initial `8a19211` | **PASS** | GitHub Actions #39325632157 (quality), #39325632138 |
| Vercel + ZAP Preview du même HEAD | **PASS** | Statuses exact-SHA, ZAP run #39326142900 ; **ancien scanner**, pas la nouvelle implémentation |
| Playwright Preview du même HEAD | **FAIL** | Run #39326142907 : 184 passés, 3 ignorés, 1 échec dû aux deux injections `addInitScript` concurrentes (thème dark resté light) |
| Correction E2E | **INCOMPLETE** | Contextes Playwright distincts en light/dark, puis migration des fixtures détaillées vers `tests/ops-homelab-health-visual.spec.ts` (opt-in privé uniquement) ; nouvelle Preview pas encore attestée |
| ZAP production et Preview — confidentialité source | **INCOMPLETE** | Dans cette PR, action à téléversement brut supprimée ; CLI ZAP conserve le brut dans le runner, production n'upload que `report_json.json` minimisé, Preview n'upload aucun ZAP. Test d'exécution réel post-merge restant |
| GitHub App → TrueNAS → DefectDojo | **NOT_RUN** | Identité, environnement, parser installé, RBAC, déduplication et traitement Celery non vérifiés en runtime ; aucun import approuvé |
| E2E opérateur `ops.albandrieu.com` | **NOT_RUN** | Tests privés sous `OPS_E2E_ENABLED=YES`, environnement authentifié/privé absent de la CI publique |

**Frontière P0 :** ne jamais remettre les fixtures de santé, IP, endpoints privés ni rapports ZAP HTTP bruts sur Vercel public. `PASS` sur l'ancien SHA ne vaut pas `PASS` du dernier commit.


## Transition des contrats E2E publics — 19 octobre 2026

- [x] Replacer les attentes d'API publique riche par des assertions `404`, `no-store` et sans provenance upstream.
- [x] En PR #236, contrôler les deep links obsolètes, l'absence de graphe privé et d'états de santé sur `/truenas` et `/architecture`, FR/EN selon le cas.
- [x] Nuclei ne publie le JSONL expurgé que lorsque le scan complet a réussi; contrat de minimisation testé avec URLs contenant secrets simulés.
- [x] Déplacer les fixtures visuelles et tests de santé vers `tests/ops-homelab-health-visual.spec.ts`, explicitement privés et désactivés en CI publique. Validation fonctionnelle sur l'UI `ops` : **NOT_RUN**, conditionnée par Access + JWT origin.
- [ ] Vérifier la CI Playwright Preview sur le HEAD exact après migration des tests ; un succès local source-only n'est pas une preuve de déploiement.


## Réconciliation — collecteur DefectDojo privé (19 octobre 2026)

Coordination : [Site #236](https://github.com/AlbanAndrieu/nabla-site-alban/pull/236)
et [Compose #263](https://github.com/AlbanAndrieu/nabla-compose/pull/263).

- [x] Nuclei hebdomadaire/manuel uniquement : sortie JSONL publiée après
  minimisation à `template-id`, gravité et origine HTTPS autorisée ;
  les titres proviennent de l'ID canonique, jamais d'une réponse reflétée.
  Le JSONL brut est supprimé avant l'upload ; un scan incomplet ne peut être importé.
- [x] Produire le rapport d'entrée attendu dans la branche de confiance :
  `nuclei-results/nuclei.jsonl`; garder `trivy-security.json` au sein
  de `trivy-master-<sha>` et `report_json.json` pour ZAP master.
- [x] Maintenir les gates BetterLeaks/Semgrep, Trivy Critical et la politique
  économique ZAP/Nuclei : **aucun DAST long supplémentaire sur chaque PR**.
- [x] Côté Compose #263 : sélection du dernier run par workflow et dépôt,
  source `alban` / `bababou` explicite, approbation d'import distincte,
  Trivy vuln High/Critical uniquement, Nuclei minimisé, conversion ZAP
  JSON en XML et type DefectDojo **`ZAP Scan`**.
- [x] **Gate confidentialité ZAP au niveau source (code)** : suppression de l'action auto-upload dans production et Preview ; rapport production minimal seul dans l'artefact, aucun artefact ZAP Preview. **INCOMPLETE** jusqu'au test réel du workflow après déploiement ; les anciens ZIPs doivent expirer/être purgés.
- [ ] **Gate runtime** : GitHub App autorisée (Actions:read par dépôt), clé
  matérialisée depuis Vaultwarden, cron TrueNAS initialement désactivé,
  parser installé `ZAP Scan`, engagement et RBAC réels, déduplication et
  retour de traitement asynchrone DefectDojo vérifiés.
- [ ] **CI au HEAD final / G0–G5** : contrôles de qualité, scans de
  confidentialité public/Preview, CDN et chaîne Cloudflare/FastAPI ;
  `NOT_RUN` ou `PENDING` tant que la preuve n'est pas disponible.


## P0/P1 — Security gates Trivy, CodeQL, Semgrep, ZAP et DefectDojo (2026-10-19)

Contrat [scans/ingestion privée](security-scans-defectdojo-handoff.md) ; implémentation sur
[PR #236](https://github.com/AlbanAndrieu/nabla-site-alban/pull/236), sans nouvelle PR.

- [x] Trivy filesystem/lockfile (vuln, misconfig, license), filtre bloquant Critical
  et SBOM CycloneDX `master` préparés dans `.github/workflows/security-supply-chain.yml`.
  La couverture effective et les conclusions restent dépendantes des exécutions.
- [ ] CodeQL : garder le **Default Setup** existant et vérifier dans GitHub ses alertes et la suite `security-extended` ; ne pas déclarer un second Advanced Setup ou un blocage Critical non prouvé.
- [x] BetterLeaks reste dans pre-commit/quality gate ; Semgrep PR, ZAP Preview
  et Nuclei/ZAP production existants ne sont pas remplacés ni dupliqués.
- [ ] Examiner règles Semgrep supplémentaires pour Next.js/SSR, proxy public,
  authorization, secrets et XSS, avec tests de détection et sans faux positifs bloquants.
- [ ] Examiner ZAP API/OpenAPI + spider élargi uniquement à cadence manuelle/staging
  contrôlée ; Nuclei conserve budget réseau et template IDs validés.
- [ ] Livrer collecteur LAN read-only GitHub pour rapports réussis sur master,
  provenance SHA/run, mapping produit allowlist, redaction et reimport DefectDojo.
  Aucun runner GitHub ne se connecte à `.int`; aucune collecte automatique
  de logs/PII/snapshots complets. À coordonner avec `nabla-compose`.
- [ ] Tests de format JSON/validité et CI exact HEAD ; mettre `NOT_RUN` lorsque
  seule la source a été examinée.


## P0/P1 — Confidentialité de /truenas et espace privé ops.albandrieu.com (2026-10-18)

**Exécution P0** : [réconciliation des 5 dernières PR fusionnées](roadmap-merge-reconciliation-2026-10-18.md).
La présente branche met en place le refus des API publiques et retire les pages/exports riches ;
la réduction fonctionnelle est volontaire tant que `ops` n'est pas opérationnel.
Ne pas compter une PR documentaire comme preuve de protection live.


Épopée [#233](https://github.com/AlbanAndrieu/nabla-site-alban/issues/233) et
[plan de confidentialité détaillé](private-homelab-observability.md) ; coordination
[FastAPI #352](https://github.com/AlbanAndrieu/fastapi-sample/issues/352) /
[Compose #262](https://github.com/AlbanAndrieu/nabla-compose/issues/262).

- [ ] **P0** Scanner et fermer toutes les fuites des routes Next.js, des exports
  `public/homelab-services.json` et `public/service-topology.json`, des assets
  compilés, métadonnées et cache CDN ; publier uniquement un DTO à allowlist.
- [ ] **P0** Ajouter des contrats de non-régression anti-fuite pour FR/EN,
  HTML/JS/JSON et en-têtes, y compris scénarios dégradés et previews.
- [ ] **P1** Remplacer les diagnostics publics par une vitrine sûre avec
  lien vers **`https://ops.albandrieu.com`**; Access/Tunnel et autorisation
  FastAPI sont hors Vercel. Aucun token dans le navigateur ni proxy public.
- [ ] **Gates transverses** : site JSON/public/RSC sans fuite → API FastAPI
  DTO + JWT validée → Access policy MFA et origine privée → Tunnel/DNS →
  E2E anonyme/refusé/propriétaire et purge des caches.
  Références : [Site #234](https://github.com/AlbanAndrieu/nabla-site-alban/pull/234),
  [FastAPI #353](https://github.com/AlbanAndrieu/fastapi-sample/pull/353),
  [Compose #263](https://github.com/AlbanAndrieu/nabla-compose/pull/263).
- [ ] **P1** Recette conjointe et contrôle de la rémanence des caches avant clôture ;
  pas de merge automatique ni de revendication de test live sans preuve.

**Décision** : le masquage CSS/React ou la seule protection d'un path ne répond
pas à l'exposition des API et fichiers statiques. Ne pas attendre Keycloak
pour corriger les fuites P0.


- [ ] **P1 — Nuclei public DAST + DefectDojo** : maintenir le profil hebdomadaire ou manuel borné sur `albanandrieu.com` (pas de scan à chaque push/PR), puis obtenir une première exécution complète sur `master` et lire les résultats par sévérité. Les scans interrompus restent `INCOMPLETE / NOT_RUN`. Stabiliser la provenance/version des templates et les exceptions par IDs ; importer les JSONL depuis un environnement autorisé ayant accès à DefectDojo, puis confirmer côté API. Les contrôles statiques du workflow ne remplacent pas la preuve d'exécution. Voir [procédure Nuclei](nuclei-security-scan.md).

- [ ] **P1 — Transfert contrôlé Bababou #230** : distinguer audit générique de code en six phases et audit opérationnel du compte Cloudflare ; réutiliser les validateurs upstream du ledger/findings, l'upstream épinglé et la procédure de sandbox sans données sensibles. Ne pas confondre le validateur local de métadonnées avec une attestation de sécurité. Détails : [runbook](cloudflare-security-audit-runbook.md).
- [ ] **P1 — Cloudflare security-audit-skill (Site Alban + FastAPI)** : intégrer le skill officiel `cloudflare/security-audit-skill` dans `nabla-site-alban` et `fastapi-sample` en épinglant l'upstream et la licence, sur le modèle de `nabla-compose/.agents/skills/security-audit`. Réaliser d'abord un audit incrémental local-first des PR actives, puis une revue élargie (Access 403 / Service Tokens, GitHub + YubiKey/FIDO2, DNS/Traefik/Tunnel, secrets et sondes authentifiées). Produire un rapport reproductible avec ledger de couverture, findings, preuves et limites ; rapprocher les scénarios STRIDE et les UUID DSOMM officiels. Réutiliser l'audit partiel de `nabla-compose` comme antériorité, sans le présenter comme un audit complet ni supprimer les tests SAST/DAST existants. Ne pas merger automatiquement.

## P1 — Protocole d'audit Cloudflare (local-first)

Procédure et critères détaillés : [runbook d'audit](cloudflare-security-audit-runbook.md).

- [ ] Vérifier licence, version et commit SHA upstream avant importation ; inventorier dépendances et permissions du skill et conserver un manifeste de provenance.
- [ ] Exécuter le skill sur le diff de la PR au HEAD exact, enregistrer commandes, environnement, portée, contrôles exécutés et non exécutés ; étendre ensuite aux routes publiques.
- [ ] Vérifier distinctement refus HTTP 403 anonyme attendu, requête authentifiée Service Token et disponibilité LAN de l'origine. Un 403 ne démontre ni une panne ni la configuration correcte d'Access.
- [ ] Comparer routes déclarées et règles Traefik, DNS, Tunnel et politiques Cloudflare effectivement consultées : une URL déclarée ne prouve pas sa publication.
- [ ] Produire un registre de findings avec sévérité, CWE/STRIDE, activityUuid DSOMM vérifié, propriétaire, preuve expurgée et remédiation.
- [ ] Maintenir SAST, BetterLeaks, Playwright et ZAP indépendants ; valider localement la quality gate sur le HEAD exact avant de consommer la CI.
- [ ] Avant merge : contrôles CI requis sur HEAD exact et findings critiques traités ; ne jamais présenter le seul succès PR CI policy comme une validation exhaustive.

## Exécution et acceptation — audit Cloudflare (P1)

1. **Préparation sans exécution implicite** : vérifier la révision upstream officielle et sa licence ; enregistrer le commit exact, le checksum et la provenance avant tout vendoring ou lancement. Ne pas prétendre que le skill est installé tant que ces preuves manquent.
2. **Périmètre initial** : examiner uniquement les fichiers modifiés de la PR active, les configurations Cloudflare pertinentes et les contrôles de sécurité existants ; exclure les secrets et les jetons des rapports. Les appels à Cloudflare exigent une autorisation explicite et des permissions minimales en lecture.
3. **Couverture traçable** : conserver pour chaque contrôle un identifiant stable, la cible, la révision, la commande réellement exécutée, la date, le résultat (`pass`, `fail`, `not-run`, `not-applicable`), les preuves expurgées et les limites. `not-run` ne vaut jamais `pass`.
4. **Scénarios à couvrir** : Access (403 attendu vs origine indisponible), authentification GitHub/FIDO2, Service Tokens, DNS, Tunnel/Traefik, surface publique, cookies/sessions, secrets et probes authentifiés. Associer les constats STRIDE et DSOMM uniquement sur la base d'identifiants officiels vérifiés ; ne pas inventer d'UUID.
5. **Quality gate et publication** : exécuter d'abord les contrôles locaux ciblés, puis la gate de publication lorsque l'environnement le permet. Ne jamais désactiver SAST, BetterLeaks, Playwright, ZAP ni les gardes de publication ; reporter explicitement tout contrôle non exécuté. La CI GitHub reste une preuve distincte, non substituable à un test local.
6. **Critère de clôture** : rapport versionné, ledger de couverture, provenance upstream, constats et remédiations priorisés P0–P4, vérification des faux positifs, preuves locales et état de la CI au HEAD exact. Garder la PR ouverte jusqu'à revue, sans merge automatique.

**Ordre de déploiement** : prototype en lecture seule sur Site Alban → validation de la parité avec l'audit partiel `nabla-compose` → transposition dans `fastapi-sample` → audit élargi sur preuves de runtime autorisées. La simple présence de cette tâche dans la roadmap ne prouve ni installation ni exécution.

## P1 — Cloudflare Access, identité et exposition interne (10/10/2026)

- [x] Préserver les preuves de deuxième vérification Access de `fastapi-sample` dans les snapshots : éligibilité, tentative et résultat d'accès à l'origine.
- [x] Afficher ces preuves dans les détails des services, même sans télémétrie de sonde périodique ; préserver la distinction entre refus anonyme et panne réelle.
- [x] Corriger la classification de la preuve Access HTTP 403 : un blocage anonyme connu ne constitue pas une panne de l'origine ; un échec LAN indépendant demeure visible. Tests de régression enregistrés, exécution locale encore requise.
- [ ] Vérifier en environnement TrueNAS les cas IT Tools, Heimdall, AdGuard Home et Karakeep ; exposer la configuration et les tests Access sans jamais rendre les jetons visibles.
- [ ] Réconcilier l'état « Inconnu » et les identités canoniques avec `nabla-compose` (LanguageTool unique, `external: false`) et distinguer « non surveillé » de « indisponible ».
- [ ] Afficher les dérives DNS, Cloudflare Tunnel et Traefik issues d'un inventaire vérifié, avec propriétaire et dernier contrôle ; ne jamais interpréter une URL déclarée comme une publication prouvée.
- [ ] Relier les preuves Access / FIDO2 (GitHub comme IdP) et les risques de session détournée au modèle STRIDE / DSOMM existant.


Dernière réconciliation du protocole : 10 octobre 2026 (validation runtime encore requise).

Ce document est l'unique backlog actif propre à TrueNAS, FastAPI,
`nabla-compose`, Talos/Kubernetes, DNS et diagnostics homelab. Les runbooks
décrivent l'état courant et le diagnostic ; ils ne maintiennent pas une seconde
checklist de travaux ouverts.

## P0 — Migration TrueNAS 26 vers WebSocket JSON-RPC

- [ ] Traiter la transition TrueNAS 26 comme un **upgrade blocker** : aucun
  composant maintenu ne doit dépendre d'un endpoint REST TrueNAS legacy lors du
  prochain upgrade.
- [ ] Inventorier les intégrations TrueNAS de `fastapi-sample`,
  `nabla-compose`, Site Alban, CSI/storage, MCP et runbooks ; classer chaque
  appel WebSocket JSON-RPC, CLI/SSH, indirect ou REST restant.
- [ ] Migrer les derniers appels REST vers un client WebSocket JSON-RPC versionné,
  avec allowlist de méthodes, deadlines, reconnexion et erreurs nettoyées.
- [ ] Conserver deux preuves distinctes : reachability HTTPS du listener et santé
  API authentifiée (`system.version`, `app.query`, etc.).
- [ ] Valider auth/RBAC du compte observer puis exécuter un smoke pré-upgrade
  DNS → TCP/TLS → WebSocket → auth → `system.version` + `app.query`.

Références : <https://api.truenas.com/> et notes de version TrueNAS 26.

## P0 — Cutover direct du catalogue/security graph v2

Le site reste un consommateur non critique : une courte interruption contrôlée
est préférable à une compatibilité v1/v2 durable.

- [ ] Attendre que FastAPI publie le read-model v2 avec le même
  `catalogRevision`, puis connecter directement le parser v2 déjà présent.
- [ ] Remplacer `lib/homelabServices.ts` et `lib/serviceTopology.ts` dans la
  même fenêtre, supprimer les parseurs/tests v1 et ne pas créer de double reader
  ou feature flag de transition.
- [ ] Utiliser les IDs/refs canoniques pour tout état UI et vérifier la fermeture
  de toutes les relations avant déploiement.
- [ ] Préserver exposition/access intent, type/force/preuve des relations,
  provenance runtime et findings sécurité ; ne pas les reconstruire depuis les
  labels ou URLs côté UI.
- [ ] Si un LKG local reste utile, le régénérer uniquement au schéma v2 avec le
  même `catalogRevision`; supprimer le fallback v1
  `public/homelab-services.json`.
- [ ] Préparer un rollback commit/tag et coordonner l'ordre de déploiement
  `nabla-compose` → FastAPI → Site Alban.

Les designs canoniques restent dans `nabla-compose`
`docs/service-catalog-security-graph.md` et
`docs/service-catalog-v2-normalization.md`.

## P1 — Talos/Kubernetes et runtime

- [ ] Consommer la progression Kubernetes dans l'ordre DNS/CNI → smoke FastAPI
  `test.albandrieu.com` → CSI TrueNAS → secrets d'infrastructure. Le site doit
  distinguer santé applicative, réseau/DNS, persistance et présence de
  configuration sans exposer de secret.
- [ ] Vérifier en production les bindings par `appId` : un service non prêt doit
  rester dégradé même si Cloudflare Tunnel est sain.

## P1 — Provider et agrégateur DSOMM

- [ ] Déployer l'application DSOMM dans `nabla-compose` avec une version upstream
  explicitement pinée, puis implémenter l'agrégateur
  `nabla.dsomm.repository-assessment/v1`. Découvrir
  `nabla-dsomm-assessment.json` dans chaque repository (ou son miroir
  `/.well-known/nabla/dsomm-assessment.json`), valider schéma + provenance,
  agréger par `activityUuid`, préserver les preuves et le détail par repository,
  exclure `not-applicable` et conserver une absence comme `not-assessed`.
  Refuser la fusion directe de `sourceCommit` DSOMM différents : normaliser
  d'abord vers un modèle cible explicite. Exposer ensuite un contrat read-only
  portfolio versionné ; migrer `/security/dsomm` vers ce provider uniquement
  après preuve de parité et conserver le snapshot/assessment statiques comme LKG.

## P1 — Santé, diagnostic et métriques

Le contrat de santé dépendances (`local_state`, `effective_state`,
`blocked_by`, `degraded_by`, `unconfirmed_dependencies`) est déjà consommé
par un resolver partagé et protégé par tests. Ne pas recréer cette logique par
vue.

- [ ] Consommer le diagnostic opérateur à six dépendances seulement si FastAPI
  l'expose comme contrat API stable
  (`configured/reachable/authenticated/application_result/stale/error_*/evidence_complete`);
  ne jamais scraper une CLI.
- [ ] Garder Pyroscope comme signal optionnel : l'absence de profiling ne modifie
  pas la santé fonctionnelle.
- [ ] Exposer disponibilité, trafic, erreurs, latence et saturation uniquement
  avec des requêtes API prédéfinies et de cardinalité bornée.
- [ ] Pour TrueNAS/ZFS, Talos, Kubernetes, CNI/CSI et etcd, afficher les signaux
  spécifiques plutôt qu'un simple probe HTTP.
- [ ] Séparer explicitement **disponibilité du contrôle** et **posture/policy**
  pour les composants sécurité.
- [ ] Ajouter une vue temporelle courte (1 h/24 h) uniquement lorsque les métriques
  instantanées sont stables et interprétables.

## P1 — Réseau, exposition et DNS

- [ ] Remplacer la règle WAN large `Easy Rule: Passed from Firewall Log View`
  par des règles least-privilege ; le webConfigurator pfSense reste LAN/VPN-only
  et seul le frontend HAProxy TrueNAS explicitement publié utilise TCP/7000.
- [ ] Décider si HAProxy → TrueNAS exige réellement mTLS ; sinon retirer le client
  certificate backend. Conserver un timeout WebSocket explicite et des logs HTTP
  utiles sans `Authorization`, cookies ni secrets.
- [ ] Identifier le peer/câble/port correspondant à `e6000sw0port2` et confirmer
  l'absence de nouveaux DOWN/UP avant de considérer le chemin réseau stable.
- [ ] Garder pfSense/Unbound capable de résoudre indépendamment de TrueNAS Apps.
  Définir le rôle exact de Pi-hole et AdGuard Home et l'ordre DNS annoncé par DHCP.
- [ ] Si un DNS applicatif est annoncé directement, fournir deux domaines de panne
  distincts ; deux conteneurs sur le même TrueNAS ne constituent pas une redondance.
- [ ] Documenter zones locales, DNSSEC, conditional forwarding, failover et
  ownership des enregistrements internes, puis automatiser les tests de panne
  TrueNAS/Docker/Pi-hole/AdGuard/Unbound/WAN.
- [ ] Garder le health-check HAProxy léger (`/ui/`) et distinct de la validation
  WebSocket/API authentifiée. TrueNAS SSH `:9922` reste trusted-LAN-only.

Runbook courant :
`docs/truenas-fastapi-cloud-network.md`.

## P2 — Follow-up incident pfSense

Le diagnostic historique est conservé dans
`docs/incidents/2026-08-28-pfsense-security-services.md`.

- [ ] Terminer la suppression de l'enrichissement ASN pfBlockerNG : identifier
  le chemin qui appelle encore `iptoasn`, empêcher les téléchargements IPinfo
  répétés sans token/`asn.mmdb`, puis vérifier l'absence de nouvelle boucle.
  Ne pas augmenter le `memory_limit` PHP pour masquer le défaut.
- [ ] Revalider rotation/rétention des logs pfBlockerNG et traiter les gros
  historiques (`dns_reply.log`, `unified.log`, `error.log`, `extras.log`)
  sans relever les limites configurées.
- [ ] Avant une nouvelle vague de changements réseau/sécurité, conserver un
  export pfSense daté hors du firewall pour rollback.

## Fondations livrées

- Parser catalogue v2, IDs Backstage et contrôles `catalogRevision` préparés
  mais volontairement non connectés au runtime.
- Santé dépendances livrée côté site : resolver partagé, états
  bloqué/dégradé/non confirmé, preuves de relation et protection contre les faux
  rouges `runtime_missing`.
- Régressions TrueNAS REST gardées par contrat ; WebSocket, fraîcheur, provenance
  et rolling probes visibles sans transformer `runtime_missing` en panne prouvée.
- Cloudflare stale/indisponible reste une preuve non confirmée ; le navigateur
  garde un seul owner de polling santé.
- Les grands parseurs/facades d'observabilité sont découpés et protégés par le
  garde code-size.

## Règle de clôture

Une tâche est terminée uniquement avec la preuve la plus proche du runtime
concerné. Si elle reste bloquée, conserver **un seul item détaillé ici** ; les
runbooks et incidents pointent vers cette roadmap au lieu de recopier le backlog.
