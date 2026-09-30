# Feuille de route homelab

Dernière réconciliation : 30 septembre 2026.

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
