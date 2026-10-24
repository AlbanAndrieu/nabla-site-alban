# Roadmap Homelab — nabla-site-alban

**Dernière réconciliation : 24 octobre 2026.** Backlog **actif**, priorisé et fondé sur des critères d'acceptation. La présence d'un correctif dans une PR n'atteste pas son exécution, son déploiement ou la santé actuelle d'un service.

**Source d'autorité :** `nabla-compose` possède le catalogue Backstage v2, les relations, les icônes attribuées aux services et les intentions d'exposition. `fastapi-sample` possède les observations, la réconciliation et les métriques. **Ce site** possède la présentation, l'autorisation du navigateur, le cache SERVICE public et la navigation OWNER. Ne recréer aucune de ces autorités dans un autre dépôt.

**Livraison au 24/10 :** [Site #254](https://github.com/AlbanAndrieu/nabla-site-alban/pull/254) et [FastAPI #373](https://github.com/AlbanAndrieu/fastapi-sample/pull/373) sont ouvertes en Draft, sans recette complète. [Compose #272](https://github.com/AlbanAndrieu/nabla-compose/pull/272) a été fusionnée le 24/10 à 12:41 UTC. Le script `scripts/truenas/verify-fastapi-lan-probes.sh`, commité **après** cette fusion sur l'ancienne branche, **n'est pas livré sur `master`**. Aucune modification TrueNAS ou Vercel n'est présumée déployée.

## P0 — 1. Restaurer et valider les cartes TrueNAS OWNER

**Livrable :** pour chaque `entityRef`, afficher le runtime Docker/TrueNAS (application **et** conteneur principal), HTTP/HTTPS, TLS, Cloudflare Tunnel, latence, dernière sonde **réellement exécutée**, source et lien externe/LAN autorisé. Ne pas confondre `RUNNING`, `reachable`, `observed` et `healthy`.

- [ ] **Site #254 — quality gate locale :** exécuter sur un checkout complet sous la toolchain LTS déclarée `just offline-l1` puis `just p0` / `just quality` selon le `justfile`, tests Node/TypeScript, build Next.js, Playwright et contrôles anti-fuite. Corriger toute défaillance avant Ready ; aucune CI payante déclenchée par l'agent.
- [ ] **Preview au SHA exact :** vérifier les cartes, icônes, liens et ReactFlow sur `/fr/truenas` et `/en/truenas`, avec navigation clavier et capture mobile. Tester depuis le Wi-Fi autorisé **et** hors domicile.
- [ ] **Autorisation :** comparer `/api/homelab-access?diagnose=1`, `/api/homelab-health`, `/api/homelab-probes` et `/api/homelab-catalog-v2`. Vérifier 200 autorisé, 404 visiteur sur routes OWNER, refus 401/403, `503 owner-boundary` et `no-store` sans afficher d'IP ou de preuve OWNER en mode SERVICE.
- [ ] **Rendu des preuves :** inspecter trois services, dont Prometheus, avec les champs `runtime_primary_container_state`, `runtime_primary_container_issue`, `direct_probe_observed_at`, `internal_probe_observed_at`, `tls_trusted`, `tunnel_status` et `exposure`. Un conteneur principal `exited` ne doit jamais être présenté comme sain au seul motif que l'application est `RUNNING`.
- [ ] **Provenance des liens :** afficher la destination externe et l'IP:port LAN **uniquement en OWNER** lorsqu'elles sont déclarées ou observées. Distinguer `déclaré, non sondé` de `observé`. Signaler le protocole ou la route Cloudflare non confirmés. Retirer les paramètres secrets des URLs affichées.
- [ ] **Fraîcheur :** montrer séparément la date de l'inventaire runtime, la dernière sonde HTTP et la dernière sonde TCP. Un `health_board.state=stale` global ne doit pas écraser une preuve individuelle plus récente, et une date d'inventaire n'est pas une date de sonde.

**Critère Done :** les scénarios OWNER/public et les états `désactivée`, `non configurée`, `non exécutée`, `périmée`, `échec mesuré` et `observée` sont vérifiés sur la Preview au HEAD exact. Aucune carte publique ne divulgue de destination LAN.

## P0 — 2. Rétablir les sondes LAN depuis TrueNAS, jamais depuis le cloud

**Fait dans le code, pas encore en production :** Compose déclare `FASTAPI_RUNTIME_MODE=homelab` et `HOMELAB_INTERNAL_PROBES_ENABLED=true` dans `apps/sample/compose.yml`. FastAPI #373 produit `internal_probe_execution` indépendamment de la santé Docker ; le site #254 distingue les états d'exécution des sondes.

- [ ] **Compose — livraison du diagnostic :** intégrer le script de vérification ajouté après la fusion de #272 dans un changement revu du dépôt Compose. Ne pas considérer cette ancienne branche comme `master`. Ne créer aucune nouvelle PR sans instruction.
- [ ] **TrueNAS — vérification en lecture seule :** une fois ce script livré, comparer les variables effectives du conteneur `fastapi-sample` avec `internal_probes_enabled`, `probe_summary.internal.eligible/sampled/completed` et l'horodatage. Ne pas redémarrer, modifier un secret ou activer les sondes par déduction.
- [ ] **FastAPI #373 — observations :** valider par tests locaux les six états `disabled/not-configured/not-executed/stale/failed/observed`, les limites de concurrence, la rotation et l'anti-SSRF. `0/86` lorsque les sondes LAN sont désactivées n'est pas une panne des 86 services.
- [ ] **Relais OWNER authentifié :** concevoir puis vérifier un chemin de lecture des mesures **du collecteur interne vers un consommateur autorisé**, avec identité vérifiée, contrôle des cibles, audit, TLS et limitation de débit. Ne pas faire sonder `172.17.0.0/24` directement par Vercel ou FastAPI Cloud. Ne pas rétablir une exposition brute par simple drapeau.
- [ ] **Écarts de configuration :** auditer sans correction automatique Gatus (origine 8085 / déclaré 30287), Bichon (15630 / 30313), Garage Web UI (3900 / 3909) et Garage Admin (3909 / 3903), sur Compose, TrueNAS, Traefik et Cloudflare.
- [ ] **Catalogue canonique** : enregistrer les ports LAN confirmés dans Compose : Gatus UI 8085, Bichon UI 15630, Garage S3 API 3900, Garage Admin API 3903, Garage Web UI 3909. Traefik Proxy 443 et Traefik Dashboard UI 8080 sont deux endpoints du même déploiement ; ne pas remplacer silencieusement le port proxy par le port dashboard. La correction du snapshot FastAPI est seulement un repli, pas un changement de la source distante. Aucune nouvelle PR Compose sans instruction.
- [x] **Cartes Site #254** : IDs canoniques homeassistant/openwebui ; suffixes UI/API/MCP au rendu selon les rôles établis ; noms Docker et DNS préservés. Tests de contrats versionnés, non exécutés au HEAD final.
- [ ] **Collecte temporelle :** comparer au moins trois cycles du collecteur interne. Documenter services éligibles, sondés, terminés, en rotation, mis en cache et périmés. Une mesure publique 302 Cloudflare Access ne confirme pas l'origine.

**Critère Done :** un collecteur **réellement situé sur le LAN** remonte des sondes datées et bornées, et le site affiche leur provenance en OWNER sans exposer l'amont aux visiteurs externes.

## P0 — 3. Un seul catalogue : Compose → FastAPI → Site

**Déjà codé :** migration directe vers Backstage v2 ; génération des correspondances d'icônes à partir de `catalog/service-icons.json:webAssets` ; cache SERVICE public avec TTL catalogue **15 min**, santé **2 min**, sans persistances d'IP ni de diagnostics OWNER. Le mapping du site n'est pas une nouvelle source éditable.

- [ ] Tester la parité de `catalogRevision` et `entityRef` entre Compose, FastAPI SERVICE v2, les cartes et ReactFlow. Vérifier les services `Component/Resource/API` et les relations, sans réactiver de lecteur v1.
- [ ] Vérifier le snapshot d'icônes généré et la présence des assets locaux. Comparer les identités réellement publiées par FastAPI à la couverture auditée dans Compose (176 mappings, 199 identifiants distincts dans le contrôle historique du 24/10). Une valeur historique n'est pas un décompte live.
- [ ] Éliminer les consommateurs résiduels `iconSrc` v1 **seulement après** vérification de leur absence ; conserver une attribution d'image locale conforme aux licences. Aucun chargement de CDN d'icônes par carte.
- [ ] Vérifier les collisions d'identité, les points et underscores et les correspondances de sous-composants à la source FastAPI/Compose. Une jointure ambiguë par nom doit rester `unknown`, jamais devenir une confirmation.
- [ ] Tester la révocation OWNER, le vidage des anciennes clés de cache, l'expiration SERVICE, le retour réseau et les réponses 401/403/503 sans fuite de provenance amont.

**Critère Done :** le même catalogue produit les mêmes services et logos pour les deux vues, avec état uniquement fondé sur une observation correspondant sans ambiguïté à l'identité canonique.

## P0 — 4. Confidentialité et qualité avant publication

- [ ] Auditer les HTML/JSON/RSC, fichiers `public/`, bundles, previews et caches CDN sur routes TrueNAS/Architecture : aucun secret, IP privée, trace HTTP brute, jeton Access ou état OWNER en réponse anonyme. Rejouer les scénarios de refus et de déconnexion.
- [ ] Conserver `HOMELAB_PUBLIC_READONLY_ENABLED` et les exceptions OWNER temporaires comme **décisions d'exposition réversibles**, pas comme permissions permanentes. Désactiver les exceptions uniquement après une recette Access MFA/VPN et un plan de retour arrière ; ne pas casser silencieusement l'accès mobile public restreint.
- [ ] Valider les identités et les secrets serveur à privilèges minimaux : clé SERVICE pour le read-model, canal OWNER distinct, aucune clé dans `localStorage`, les URLs, les logs, les assets ou les rapports.
- [ ] Conserver les gates obligatoires locales : BetterLeaks, Semgrep, Trivy lockfile/SBOM, CodeQL existant, tests de sécurité des API et ZAP/Nuclei avec budgets et artefacts minimisés. Un ancien PASS ou un test simulé ne valide pas le HEAD final.
- [ ] Maintenir la parité utile avec `nabla-site-bababou` et la boucle `justfile`/pre-commit, sans copier les particularités métier ni recréer des workflows GitHub coûteux. Confirmer Node/npm LTS et le déploiement Vercel exact-SHA.
- [ ] Après contrôle local, faire valider explicitement la sortie de Draft des PR Site #254 et FastAPI #373. Ne pas fusionner ni déployer sans instruction.

**Critère Done :** quality gate et tests de confidentialité vérifiés sur le **même SHA** que la Preview, puis revue des changements opérationnels.

## P1 — 5. Performance et ergonomie de /truenas

- [ ] **Skill d'audit Web** : demander au propriétaire de lancer lui-même `npx skills use "https://github.com/vercel-labs/agent-skills" --skill "web-design-guidelines"`, puis de partager la sortie et le chemin des `supporting-files`. Ne pas installer le skill automatiquement dans l'agent.

**Code préparé dans Site #254 :** cartes avant ReactFlow ; chargement de ReactFlow près du viewport ; dépannage chargé à l'ouverture ; suppression de la recherche `findIndex` pour chaque carte ; registre de preuves sobre, chiffres tabulaires et mise en page mobile.

- [ ] Mesurer **LCP, INP, CLS**, le poids initial du JavaScript et les requêtes sur mobile et desktop, en comparant production et Preview exact-SHA avant toute nouvelle optimisation.
- [ ] Dédupliquer les requêtes SERVICE et la revalidation entre onglets via `BroadcastChannel`, `catalogRevision` et ETag conditionnel. Le cache navigateur ne doit jamais transporter ni partager de preuve OWNER.
- [ ] Évaluer `content-visibility: auto` ou la virtualisation accessible des groupes nombreux. Valider focus, recherche, filtrage, liens d'ancrage, lecteurs d'écran et absence de décalage visuel.
- [ ] Montrer d'abord le résumé non sensible (nombre de services, couverture connue/inconnue, heure de publication), puis les détails OWNER seulement après autorisation. Ajouter des métriques 1 h/24 h uniquement lorsque leur source et leur fraîcheur sont fiables.
- [ ] Vérifier la présentation FR/EN des erreurs, protocoles, cibles et badges, avec états `unknown` explicites lorsque Prometheus/Gatus n'ont pas de scrape observé.

**Critère Done :** gains mesurés et aucun échec d'accessibilité ou de confidentialité introduit.

## P1 — 6. Observabilité, Cloudflare et sécurité applicative

- [ ] **FastAPI #373 :** corréler par `entityRef` les sondes Gatus, Prometheus et exporters (dernier scrape, âge, état, latence), avec des requêtes bornées. Séparer `not-configured`, `not-observed`, `scrape failed` et santé de l'application. Conserver Pyroscope optionnel.
- [ ] Vérifier les diagnostics spécifiques TrueNAS/ZFS, pfSense, Talos/Kubernetes, CNI/CSI et etcd. Ne pas remplacer leur santé par le seul résultat d'un HTTP 200 ; distinguer contrôle disponible et posture de sécurité.
- [ ] Exécuter l'audit du skill Cloudflare seulement après revue de sa provenance et de ses permissions. Prioriser Access (403 anonyme ≠ origine HS), Service Tokens, DNS, Traefik/Tunnel et dérives de configuration. Conserver des findings expurgés, avec STRIDE/DSOMM seulement lorsque les identifiants sont vérifiés.
- [ ] Valider IT Tools, Heimdall, AdGuard Home et Karakeep depuis TrueNAS : politique Access, deuxième sonde authentifiée et diagnostics sans jetons visibles.
- [ ] Achever la chaîne DefectDojo privée : GitHub App lecture seule, import des seuls rapports SAST/DAST réussis et expurgés, déduplication, RBAC, approbation et suivi Celery. Conserver les scans Nuclei/ZAP hebdomadaires ou manuels, sans extraire des artefacts bruts vers Vercel.

**Références de détail :** [runbook audit Cloudflare](cloudflare-security-audit-runbook.md), [sécurité privée](private-homelab-observability.md), [handoff DefectDojo](security-scans-defectdojo-handoff.md), [roadmap FastAPI](https://github.com/AlbanAndrieu/fastapi-sample/blob/master/docs/engineering-roadmap.md).

## P1 — 7. Infrastructures et chantiers transverses

- [ ] **TrueNAS 26 :** inventorier les dépendances REST encore utilisées ; migrer les appels concernés vers WebSocket JSON-RPC authentifié, avec RBAC, reconnexion bornée, erreurs expurgées et smoke DNS → TLS → WebSocket → `system.version` / `app.query`. Bloquer l'upgrade tant que le chemin critique dépend d'une API supprimée.
- [ ] **Talos/Kubernetes :** valider l'image Next.js unique et son digest après build, scan Trivy, stockage `.next` et secrets Kubernetes ; protéger Traefik en LAN/TLS. Confirmer les bindings d'applications et la santé CNI/CSI sans divulgation de secrets.
- [ ] **DSOMM :** évaluer le provider versionné `nabla.dsomm.repository-assessment/v1` à partir d'assessments signés ou traçables, par `activityUuid`. Ne migrer la page sécurité qu'après parité avec le snapshot et conservation d'un état `not-assessed` explicite.
- [ ] **Réseau/DNS pfSense :** auditer les règles WAN least-privilege, la validation TLS/HAProxy, les coupures `e6000sw0port2` et la résilience Unbound indépendant de TrueNAS. Voir les runbooks et le dépôt Compose : ces travaux ne doivent pas être reproduits comme sous-projets du site.

**Références :** [runbook réseau](truenas-fastapi-cloud-network.md), [incidents](incidents/2026-08-28-pfsense-security-services.md), [documentation catalogue](homelab-catalog-convergence-2026-10-24.md). Les décisions et exécutions d'infrastructure appartiennent au dépôt concerné.

## P1 — 8. Installation manuelle du skill frontend-design — **action utilisateur**

- [ ] **Me demander explicitement de solliciter l'utilisateur pour l'installation.** Lors de la prochaine reprise du chantier UI, formuler la demande : **« Pouvez-vous installer vous-même le skill `frontend-design` dans votre environnement local, puis me transmettre la sortie complète de la commande et le chemin du répertoire `supporting-files` s'il est indiqué ? »**
- [ ] Demander à l'utilisateur d'exécuter lui-même, dans son environnement local approuvé : `npx skills use "https://github.com/anthropics/skills" --skill "frontend-design"`. **Ne pas relancer automatiquement `npx` dans l'agent**, ne pas installer globalement et ne pas considérer la lecture du README distant comme une installation.
- [ ] Après réception de la sortie complète, suivre les instructions générées ; résoudre tous les chemins relatifs depuis le répertoire `supporting-files` effectivement indiqué. Vérifier source, version et permissions avant exécution des scripts facultatifs.
- [ ] Reprendre le design de l'interface des cartes uniquement après cette étape ; conserver les contraintes de preuve, d'accessibilité et de confidentialité.

**État : installation NON CONFIRMÉE, action utilisateur requise.** La tentative d'installation précédente a expiré ; ne pas en déduire que le skill est installé.

### Autres skills externes — différés

- [ ] À une reprise dédiée aux déploiements, demander **séparément** votre accord avant toute installation locale de `docker-compose-patterns` (`docker/skills`) ou `kubernetes-specialist` (`jeffallan/claude-skills`). Examiner les sources, dépendances, permissions et conflits avec les skills Nabla avant la demande. Ne rien installer sur TrueNAS ou Talos et respecter les contraintes ZFS/Vaultwarden.

## P2 — 9. Suivi long terme et incidents

- [ ] Réévaluer la migration de l'espace privé `ops.albandrieu.com` après preuve du relais OWNER Access/Tunnel, sans promettre qu'une route Vercel est une frontière suffisante.
- [ ] Clore les incidents pfBlockerNG/ASN, les journaux volumineux et la procédure de sauvegarde/rollback pfSense selon les [preuves d'incident](incidents/2026-08-28-pfsense-security-services.md), dans le dépôt opérationnel concerné.

## Conditions de clôture communes

Une tâche n'est **DONE** qu'après vérification de son résultat dans l'environnement cible. Conserver `NOT_RUN` pour tout contrôle non exécuté ; `unknown` pour toute mesure absente et `stale` pour une mesure trop ancienne. Ne pas confondre PR fusionnée, configuration déclarée, test de source et comportement live.

La présente roadmap est l'**index des dépendances du site et des recettes**. Les détails opérationnels FastAPI restent dans son [engineering roadmap](https://github.com/AlbanAndrieu/fastapi-sample/blob/master/docs/engineering-roadmap.md), les modifications d'infrastructure dans Compose, et les preuves d'incident dans les runbooks. Les anciennes sections datées, doublons de validations et instructions de migration v1 obsolètes restent disponibles dans l'historique Git ; elles ne forment plus une seconde checklist active.
