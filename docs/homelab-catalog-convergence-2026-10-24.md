# Convergence du catalogue et de l'observabilité — 24 octobre 2026

## Portée et preuves

Ce document consolide les décisions pour `nabla-compose`, `fastapi-sample` et
`nabla-site-alban`. Il reprend les constats documentés dans les PR
[Site #254](https://github.com/AlbanAndrieu/nabla-site-alban/pull/254) et
[FastAPI #373](https://github.com/AlbanAndrieu/fastapi-sample/pull/373).
La conversation ChatGPT source n'est pas une API exploitable par les scripts.
Les données opérationnelles ci-dessous sont un **instantané daté**, pas
l'état actuel des services. Aucun déploiement ne découle de ce document.

## Source de vérité et responsabilités

| Domaine | Responsable | Contrat et interdits |
| --- | --- | --- |
| Identité et relations | `nabla-compose` | Backstage v2, `entityRef`, `catalogRevision`, `catalog/generated/entities.json`. Ne pas recopier les services dans le site ou FastAPI. |
| Runtime souhaité | `nabla-compose` | `apps/**/compose.yml`, configuration, intentions d'exposition, bindings et topology déclarative. Ne pas assimiler « déclaré » à « joignable ». |
| Icônes | `nabla-compose` (fichiers sources), `nabla-site-alban` (assets locaux) | `catalog/service-icons.json:webAssets` → `lib/homelabCatalogIcons.generated.ts`. Aucun chemin d'icône ni URL externe dans le DTO FastAPI SERVICE. |
| Collecte | `fastapi-sample` | Réconciliation TrueNAS Apps, conteneurs principaux Docker, DNS/TCP/TLS/HTTP/API, Cloudflare Access, Gatus/Prometheus et exporters ; sondes bornées, provenance et fraîcheur propres. |
| DTO SERVICE | `fastapi-sample` | Identité canonique, états `ok/warn/fail/unknown`, `catalogRevision`, `boardState`, aucune preuve OWNER, IP LAN, URL privée, port ni secret. |
| DTO OWNER | `fastapi-sample` | Probes, endpoints déclarés et vérifiés, transport, runtime, métriques, timestamp et provenance ; contrôle d'accès serveur strict et absence de cache public. |
| Rendu et navigation | `nabla-site-alban` | Cartes, ReactFlow, filtres, icônes locales, liens OWNER uniquement, messages « inconnu » / « non sondé », traduction et accessibilité. Aucun calcul d'une nouvelle vérité runtime. |
| Cache navigateur | `nabla-site-alban` | SERVICE uniquement ; catalogue 15 min, santé 2 min ; purge à la révocation ; `catalogRevision` commun ; une observation périmée ne redevient jamais verte. |

Ne pas remplacer Backstage v2 par un inventaire manuel parallèle.
Ne pas déduire un état sain d'une déclaration Compose, d'un `RUNNING`
TrueNAS, d'une connexion Cloudflare HTTP 302 ou de l'existence d'une icône.

## Contrats de synchronisation

1. La **même référence** `entityRef` nomme un composant déclaré, son état
   publié et sa carte. L'association par `metadata.name` n'est qu'une
   compatibilité transitoire : toute ambiguïté devient `unknown`.
2. `catalogRevision` dérive du **graphe canonique entier**. FastAPI et Site
   rejettent les états issus d'une autre révision.
3. Les relations sont définies une seule fois dans Backstage/Compose.
   L'absence d'arêtes observées ne masque pas les nœuds déclarés.
4. `exposure.declared.internal_host/internal_port` fournit une **adresse
   déclarée**, même si `internal_services=[]`. Ce n'est pas une preuve
   de connexion : afficher « déclaré, non sondé » et limiter les liens à OWNER.
5. `exposure.declared.external=false` interdit d'inventer un lien WAN.
   Une origine Cloudflare observée différente de la déclaration est une dérive,
   pas une autorisation de publier cette origine.
6. Les horodatages d'inventaire, de sonde directe, de cache et de tableau
   global sont distincts. `health_board.state=stale` ne périme pas
   mécaniquement une preuve individuelle récente ; à l'inverse, un
   `boardState=fresh` ne crée pas une preuve absente.
7. Une application TrueNAS `RUNNING` avec conteneur principal `exited`
   doit apparaître comme un écart runtime. Ne pas classer comme panne les
   conteneurs init/migration arrêtés avec succès.
8. Les métriques Gatus, Prometheus et des exporters doivent être rattachées
   par `entityRef` et porter `source`, `observedAt`, `status`,
   `lastValue` si présent, `age` et `reason`. Ces champs sont **OWNER** ;
   aucun test d'exporter en marche ne suffit à prouver une métrique valide.

## Échantillon OWNER du 24 octobre 2026, 13:08 UTC

- 95 applications TrueNAS : 81 RUNNING, 13 STOPPED, 1 DEPLOYING.
- 88 entrées services : 27 OK, 24 WARN, 14 FAIL, 23 UNKNOWN.
- 85 services ont un host/port LAN **déclaré**, mais `internal_services=[]`.
- Sondes LAN : `internal_probes_enabled=false` ; 0/86 couvertes.
- Sondes externes : 16/28 observations connues (57,1 %) ; rotation 12/cycle.
- Divergences d'origine Cloudflare : 11 ; `access_protected_origin_unverified` : 12.
- App Prometheus RUNNING, conteneur principal `prometheus` exited.
- `health_board.state=stale` : ne pas en déduire que chaque preuve est stale.

Ces comptes ne prouvent ni accès LAN, ni succès HTTP d'origine, ni correction
de Prometheus. Recontrôler la révision effectivement déployée avant acceptance.

## Travail P0 par dépôt

**nabla-compose** — maintenir les catalogues Backstage v2, les relations,
l'exposition souhaitée et la correspondance d'icône. Réconcilier les
différences de ports relevées pour Gatus (8085/30287), Bichon (15630/30313),
Garage Web UI (3900/3909) et Garage Admin (3909/3903) en confrontant
déclaration, Docker et routage : ne changer aucun port sur simple soupçon.
Ajouter un contrat local de comparaison `entityRef` / icônes / source digest
et maintenir `x-nabla` seulement pendant la migration nécessaire.

**fastapi-sample** — produire une projection OWNER des preuves runtime
et probes indexées par `entityRef`, distincte du DTO SERVICE.
Prouver la correction du conteneur principal Prometheus avec un relevé frais.
Qualifier les 302 Access comme « edge atteinte / origine non vérifiée ».
Mesurer `eligible / sampled / fresh / stale / unknown` séparément,
sans activer les sondes LAN depuis FastAPI Cloud.

**nabla-site-alban** — consommer les DTO plutôt que deviner les résultats ;
afficher d'abord les cartes, charger ReactFlow près du viewport, et conserver
la navigation via endpoints OWNER validés. Signaler « non sondé » et la
différence entre URL déclarée, origine Cloudflare et réponse HTTP vérifiée.
Assurer le rendu accessible sur mobile et l'absence de données OWNER dans
le cache SERVICE.

## Critères de clôture communs

- Les 151 entités Component/Resource/API du catalogue actuellement examiné
  trouvent une icône locale résoluble parmi les 176 correspondances déclarées.
  L'inventaire runtime de 88 services est un périmètre distinct.
- Comparer les identités et `catalogRevision` sur **le même SHA source**,
  puis sur la Preview et le backend réellement déployés.
- Vérifier la séparation OWNER/public depuis Wi-Fi autorisé et réseau externe.
  Ne jamais exposer une IP, un port ou une preuve privée pour remplir une carte.
- Valider les compteurs de couverture et la fraîcheur sans fausse couleur verte.
- Exécuter les tests ciblés, puis les gates locales complètes sur les deux
  PR en Draft ; conserver **NOT_RUN** pour les contrôles absents. Pas de CI
  GitHub payante, de merge ou de déploiement automatique pour cette analyse.
- Restaurer la restriction des diagnostics publics temporaires seulement après
  validation MFA/VPN ; ne pas casser le lecteur SERVICE expurgé.

## Compétences d'agent

Conserver les skills du dépôt comme règles opérationnelles :
`docker-compose-orchestration`, `nabla-service-catalog`,
`homelab-runtime-status`, `pfsense-api-debugging` et
`local-first-quality`. Le skill externe
[Docker Compose Patterns](https://www.skills.sh/docker/skills/docker-compose-patterns)
est une référence complémentaire à évaluer, non une autorité sur TrueNAS.
Un skill Kubernetes ne peut pas se substituer aux validations Talos/NFS/CSI.
Toute installation externe exige une revue de `SKILL.md`, des scripts,
des permissions et des appels réseau. Rien n'est installé ici.
