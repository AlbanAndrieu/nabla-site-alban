# Feuille de route homelab

Dernière réconciliation : 28 septembre 2026.

Ce document contient uniquement le backlog actif propre à TrueNAS, FastAPI,
`nabla-compose`, Talos/Kubernetes, DNS et diagnostics homelab. Les décisions
transverses de qualité/CI restent dans `docs/quality-roadmap.md` et ne sont pas
dupliquées ici.

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
  `nabla-compose` → FastAPI → Site Alban pour rendre l'interruption bornée et
  observable.

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

- [ ] Consommer le diagnostic opérateur à six dépendances seulement si FastAPI
  l'expose comme contrat API stable
  (`configured/reachable/authenticated/application_result/stale/error_*/evidence_complete`);
  ne jamais scraper une CLI.
- [ ] Garder Pyroscope comme signal optionnel : l'absence de profiling ne modifie
  pas la santé fonctionnelle.
- [ ] Exposer progressivement disponibilité, trafic, erreurs, latence et
  saturation uniquement avec des requêtes API prédéfinies et de cardinalité
  bornée ; le navigateur ne fournit jamais de PromQL.
- [ ] Pour TrueNAS/ZFS, Talos, Kubernetes, CNI/CSI et etcd, afficher les signaux
  spécifiques (pression, capacité, Ready, alarmes, leader/quota) plutôt qu'un
  simple probe HTTP.
- [ ] Séparer explicitement **disponibilité du contrôle** et **posture/policy**
  pour les composants sécurité ; un volume d'alertes ou blocages n'est pas une
  panne.
- [ ] Ajouter une vue temporelle courte (1 h/24 h) seulement lorsque les métriques
  instantanées sont stables et interprétables.

## P1 — Résilience DNS

- [ ] Garder pfSense/Unbound capable de résoudre indépendamment de TrueNAS Apps,
  afin qu'un arrêt TrueNAS/Docker n'entraîne pas une panne DNS générale.
- [ ] Définir le rôle exact de Pi-hole et AdGuard Home dans la chaîne de
  résolution/filtrage et l'ordre annoncé par DHCP.
- [ ] Si des DNS applicatifs sont annoncés directement aux clients, fournir une
  redondance sur deux domaines de panne ; deux conteneurs sur le même TrueNAS ne
  sont pas une redondance.
- [ ] Documenter DHCP DNS, zones locales, DNSSEC, conditional forwarding,
  failover et ownership des enregistrements internes.
- [ ] Automatiser les tests de panne TrueNAS, Docker, Pi-hole, AdGuard, Unbound et
  WAN, puis exposer disponibilité **et conformité de politique** dans la santé.

## P2 — Follow-up incident pfSense

Le diagnostic détaillé et les preuves historiques sont conservés dans
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

## Fondations déjà livrées

- Le parser v2, les IDs Backstage et les contrôles de `catalogRevision` sont
  préparés mais volontairement non connectés au runtime.
- Les régressions vers TrueNAS REST sont gardées par contrat et le transport
  WebSocket observé est visible dans l'UI.
- Le health board consomme fraîcheur, provenance et rolling probes sans confondre
  `runtime_missing` avec une panne prouvée.
- Cloudflare indisponible ou stale reste une preuve non confirmée, jamais une
  dégradation globale automatique.
- Le navigateur possède un seul owner de polling santé et n'augmente pas le fan-out
  des probes provider.
- Les gros parseurs/observability facades ont été découpés en modules cohésifs ;
  le garde code-size empêche de recréer la dette.

## Règle de clôture

Une tâche homelab est terminée uniquement avec la preuve la plus proche du
runtime concerné. Si elle reste bloquée, conserver **un seul item détaillé ici** ;
la roadmap qualité ne reçoit qu'un pointeur transverse si nécessaire. Ne jamais
laisser l'unique trace d'un risque ou d'un follow-up dans un chat ou un commentaire
de PR.
