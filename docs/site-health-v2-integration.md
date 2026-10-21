# Compatibilité Backstage v2 et états de santé — 21 octobre 2026

FastAPI #358 et Site Alban #240 ont été fusionnées. **La PR nabla-compose #265 est désormais fusionnée.** Le fichier v2 est attendu côté source, mais sa publication effective dans le runtime FastAPI doit encore être vérifiée ; un 503 ne prouve pas à lui seul un problème de clé. Pas de fallback vers v1.

Le backend FastAPI #360 ajoute `GET /api/site/health/v2` authentifié par la clé machine existante, en projection stricte `{schemaVersion:2,model:"backstage-health",catalogRevision,boardState,services:[{entityRef,state}]}`. Aucun hôte, port, URL, token, preuve brute ou métrique. L'accès OWNER aux endpoints enrichis garde son CIDR et son identité indépendants.

Cette PR Next.js consomme l'API uniquement côté serveur (Vercel), derrière `gatedHomelabResponse`. L'UI rapproche les états à `entityRef` et refuse les révisions qui ne correspondent pas au catalogue v2 chargé ; observations périmées ou ambiguës = UNKNOWN, et un éventuel instantané enrichi correctement autorisé reste prioritaire. Aucun secret n'est livré à React.

## Ordre de déploiement

1. Vérifier que l'artefact v2 de Compose #265 est bien présent et consommé par le backend déployé (fusion Git ≠ disponibilité du runtime).
2. Déployer la PR fastapi-sample #360 avec la même `DIAGNOSTICS_ACCESS_KEY` actuelle côté FastAPI.
3. Déployer cette PR Site Alban, vérifier la variable `DIAGNOSTICS_ACCESS_KEY` dans les environnements de production/preview Vercel, sans l'exposer en `NEXT_PUBLIC_*`.
4. Vérifier `GET /api/homelab-catalog-v2` et `GET /api/homelab-health-v2` depuis une session propriétaire, comparant `catalogRevision`. Vérifier absence de données privées dans HTML, JSON, headers ou cache public. Statuts absents → UNKNOWN, jamais FAIL.
5. Désactiver les routes HTTP v1 FastAPI avec `HOMELAB_V1_HTTP_ENABLED=false` une fois les autres consommateurs identifiés ; ne pas supprimer les entrées historiques servant aux probes.

Les endpoints OWNER FastAPI (/api/health-board, /api/homelab/health, /api/homelab/probes) restent inaccessibles au serveur Vercel sans un canal d'identité propriétaire complet, et les diagnostics détaillés du Site restent alors déclarés indisponibles. Cette nouvelle projection débloque **les états des cartes**, sans prétendre fournir le détail des sondes.

Le smoke complet du catalogue et des états ne pourra être attesté qu'après déploiement et disponibilité de FastAPI #360. Les tests source ne prouvent pas la connectivité du service.

### Incident de configuration détecté (21 octobre 2026)

Dans Vercel, `DIAGNOSTICS_ACCESS_KEY` était configurée pour Preview mais absente de Production. La même variable sensible a été étendue aux cibles Preview + Production, **sans accéder à la valeur**. Il faut reconstruire le déploiement Production pour prendre en compte cette configuration et vérifier que la valeur correspond bien à la clé attendue par FastAPI. Éviter de journaliser les headers d'authentification.

Sur Vercel, les anciennes routes FastAPI OWNER restent inaccessibles par CIDR même avec la clé machine. Le code ne tente plus de les appeler par défaut en Preview/Production : `HOMELAB_OWNER_RAW_UPSTREAM_ENABLED=true` ne doit être utilisé qu'avec une identité humaine vérifiée et un routage de confiance documenté (ne pas ajouter les egress Vercel au CIDR maison). La nouvelle route SERVICE `/api/site/health/v2` fournit uniquement les états corrélés au catalogue.


## Diagnostics détaillés : échec attendu avec la seule clé SERVICE (21 octobre 2026)

- Le texte « Les preuves opérationnelles sont temporairement indisponibles » provient de `HomelabOperationalEvidence` → `/api/homelab-observability` → `loadFastApiHealthBoard()` → `/api/health-board` (**OWNER**). Il ne concerne **pas** `/api/site/catalog/v2`.
- Sur Vercel, les requêtes OWNER brutes sont intentionnellement désactivées (`owner-upstream-disabled`). Une session depuis le Wi-Fi domicile est autorisée à lire les pages privées du site, mais **l'egress de Vercel n'est pas l'IP du domicile**. La nouvelle clé `DIAGNOSTICS_ACCESS_KEY` ne peut pas transformer une identité SERVICE en OWNER.
- La route retourne à présent uniquement un code diagnostique borné `owner-boundary` ou `upstream-unavailable` et un HTTP 503, sans erreur réseau brute ni URL upstream. Côté UI, des descriptions distinctes remplacent le statut trompeur. Un problème d'accès 404 reste neutre pour un visiteur non autorisé ; la description détaillée n'est présente que dans un composant chargé après vérification propriétaire.
- Les métriques TrueNAS/pfSense/Cloudflare et preuves brutes **ne sont pas remplacées par des données simulées**. Les statuts de santé SERVICE v2 issus de FastAPI #360 restent une capacité distincte, qui nécessite le déploiement de ce contrat.
- **À réaliser pour les preuves riches** : concevoir un relais authentifié OWNER à domicile ou via Cloudflare Access, avec JWT vérifié, filtrage serveur, RBAC lecture seule, anti-replay, journal d'audit et contrôle d'exposition. Ne pas ajouter les adresses de sortie Vercel à `HOMELAB_TRUSTED_CIDRS`, ne pas activer `HOMELAB_OWNER_RAW_UPSTREAM_ENABLED` pour masquer un 401.
- Vercel expose maintenant le nom de `DIAGNOSTICS_ACCESS_KEY` en Production et Preview (valeur masquée) ; un nouveau déploiement Production est nécessaire pour utiliser une configuration modifiée. Le dernier déploiement READY observé correspond au SHA `5f8e125d` et ne contient pas les modifications de cette PR. Aucun résultat positif SERVICE en production n'est encore attesté.
