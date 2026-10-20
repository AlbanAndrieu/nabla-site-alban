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
- [ ] Déployer FastAPI #358 après qualité, puis rendre disponible le
  `catalog/generated/entities.json` canonique de Compose #265 sur la branche
  attendue. Tant que ces PR ne sont pas livrées, un 404/503 est normal ;
  ne pas basculer vers le fichier v1.
- [ ] Valider depuis le Wi-Fi autorisé : `GET /api/homelab-access?diagnose=1`
  reste `trusted:true`; la **clé Preview factice** doit être refusée,
  via un 503 Site dont la raison est `access-denied` uniquement lorsque
  FastAPI répond réellement 401/403. Tester aussi le 404 depuis un autre réseau.
- [ ] Après fourniture d'une vraie clé dédiée, réessayer la Preview exacte :
  HTTP 200 + `X-Homelab-Inventory-Complete:true`, services non vides, révision
  identique sur les routes owner et Architecture, aucun détail secret.
  Aucune clé valide présumée ni récupérée actuellement.
- [ ] Exécuter les tests local-first et les quality gates sur HEAD exact ;
  la PR #240 doit rester ouverte et non fusionnée en l'absence d'autorisation.
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
