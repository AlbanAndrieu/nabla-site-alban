# Veille RSS CISO — intégration FreshRSS et pertinence Nabla

## Périmètre

La PR #220 ajoute des cartes RSS accessibles, la recherche, le filtrage par technologie, le tri, les aperçus et la provenance des flux sur `/fr/ciso` et `/ciso`. **Une mention textuelle d'une technologie ou d'un CVE ne prouve ni une exposition ni une vulnérabilité** ; le rapprochement n'est pas un scanner et ne connaît pas les versions.

Les tags dans `lib/cisoThreatFeed.ts` sont un sous-ensemble **public et volontairement limité** des technologies du catalogue `nabla-compose/catalog/services.json` ; aucune IP, version ou adresse interne n'est exportée. Certains services du catalogue sont `planned` : aucune déclaration de déploiement réel n'est déduite de leur présence.

## Source principale : API GReader FreshRSS

Le service **FreshRSS** est déclaré dans `nabla-compose/catalog/homelab-services.json`, mais aucun export OPML ni paramétrage API dédié n'a été retrouvé dans la branche `master` examinée. Les abonnements réellement configurés et les droits API ne sont donc pas encore vérifiés.

1. Créer dans FreshRSS un compte séparé avec **uniquement des abonnements publics de veille cyber publiables sur Internet**. Ne jamais utiliser un compte personnel : la réponse JSON est publique et cacheable.
2. Activer l'API FreshRSS et attribuer un mot de passe API au compte de veille. Via `POST /api/greader.php/accounts/ClientLogin` avec `Email` et `Passwd`, récupérer la valeur `Auth`.
3. Fournir **seulement côté serveur Vercel** le secret `FRESHRSS_GREADER_AUTH` (valeur `Auth`, sans `GoogleLogin auth=`). Ne jamais employer `NEXT_PUBLIC_` ni mettre le secret dans Git.
4. Si Cloudflare Access protège FreshRSS, définir `FRESHRSS_CF_ACCESS_CLIENT_ID` et `FRESHRSS_CF_ACCESS_CLIENT_SECRET` côté serveur avec une politique de service token **limitée au chemin GReader**. Garder l'origine privée ; ne pas désactiver Access pour résoudre un 403.
5. Tester `GET /api/ciso/threat-feed` sur la preview : `mode=freshrss` et uniquement des articles publiables. Inspecter l'absence de secret dans JSON, JS client et logs ; révoquer le secret en cas de fuite.

La route ne contacte qu'une origine préconfigurée : `https://freshrss.albandrieu.com`. Requêtes GET seules, sans redirection, timeout, limite de réponse, aucune URL contrôlée par le visiteur. L'API retourne 503 sans configuration ou 502 lors d'un échec (sans révéler l'erreur amont).

**Mode de secours provisoire :** jusqu'à 16 flux prioritaires depuis `public/ciso-rss-feeds.json`, chargés dans le navigateur via le service public tiers `rss2json`. Cela crée une dépendance externe et une couverture partielle ; il faudra retirer ce secours après validation de FreshRSS. Ce fichier JSON ne correspond pas nécessairement à l'OPML réellement importé.

Pour synchroniser les sources : `GET /api/greader.php/reader/api/0/subscription/list?output=json`, ou export OPML via **Gestion des abonnements → Import / export**. Ne pas exposer les abonnements privés. Référence : https://freshrss.github.io/FreshRSS/en/developers/06_GoogleReader_API.html

## MCP FreshRSS — évaluation, non déployé

- https://github.com/ChrisLAS/freshrss-mcp : GReader, outils de lecture et écriture, serveur HTTP MCP.
- https://github.com/Knuckles-Team/freshrss-agent : API GReader et MCP avec surfaces plus larges.

**Choix :** l'API GReader suffit pour le site web. Un MCP peut être utile à Hermes/OpenClaw *en réseau privé* après revue de code, analyse SCA, pinning, authentification stricte, mode lecture seule et permissions minimales. Ne pas publier un serveur MCP ou exposer ses outils de modification sur Internet.

## Catalogue de technologies et évolution

1. Corréler les **services déclarés** de `nabla-compose/catalog/services.json` avec l'état TrueNAS/Talos réellement observé (`planned`, `running`, `stopped`), sans publier la topologie.
2. Produire un SBOM CycloneDX/SPDX avec **Syft** et/ou **Trivy** à partir d'images et manifestes connus ; compléter avec packages et labels OCI en lecture seule. Éviter un scan de fingerprinting réseau non maîtrisé.
3. Associer purl/CPE, version, criticité et exposition dans un inventaire **privé**. Corréler CISA KEV, OSV et NVD avec SCA et les findings DefectDojo avant toute qualification de risque. Le RSS seul ne doit jamais déclencher un statut « vulnérable ».
4. Générer ensuite un export déterministe de **tags validés et publiables** vers la page CISO, avec contrôle de divulgation automatique (pas d'hôte, d'IP, de secrets ou de version).
5. Ajouter des tests de non-régression pour classement, dédoublonnage, faux positifs, filtrage, fraîcheur et indisponibilité de FreshRSS.

## Vérifications

Commandes à exécuter dans une copie locale du dépôt : `npm run test:unit`, `npm run lint`, `npm run lint:css`, `npm run typecheck`, `npx playwright test tests/ciso.spec.ts`.

Vérifier que la prévisualisation en mode sans secrets affiche clairement le **mode secours**, et que le filtre « pertinent pour la stack » ne conclut pas à une exposition.
