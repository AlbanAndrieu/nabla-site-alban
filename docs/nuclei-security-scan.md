# Nuclei DAST public — Site Alban

## Portée et exécution

Le workflow [Nuclei public DAST](../.github/workflows/nuclei-public.yml) cible exclusivement `https://albanandrieu.com` depuis GitHub Actions lors de modifications applicatives de PR, ou via `workflow_dispatch`. **Ce n'est pas un scan de l'homelab**. Il ne suit pas une URL fournie par l'utilisateur, n'injecte pas de Service Token et ne sonde aucune adresse privée. Le trafic de production est limité à 2 requêtes/s et une seule concurrence ; les modèles DoS, fuzzing, brute force et les tests OAST (`-ni`) sont exclus. Le rapport JSONL reste un artefact GitHub à conservation de trois jours.

Nuclei est épinglé à `v3.11.1`, archive Linux amd64 vérifiée par SHA-256 `ea63d4ae232808cd7c6bc00d0142428e231fab59dae01042246097d195835ab6`. La provenance des templates distants n'est **pas** verrouillée par SHA : il s'agit d'une dette P1, ne pas prétendre à la reproductibilité intégrale avant épinglage du corpus de templates.

Le workflow écrit un résumé par sévérité et ID de modèle. Un résultat Nuclei est un **signal à confirmer**, pas automatiquement une vulnérabilité avérée. Une absence de rapport est une erreur de scan, jamais « zéro alerte ». Le workflow ne remplace pas ZAP Preview, Semgrep, BetterLeaks ni les validations de publication.

## DefectDojo : import conditionnel

L'import utilise l'API v2 `POST /api/v2/reimport-scan/` avec `scan_type=Nuclei Scan`, format JSONL et un test stable `Nuclei public albanandrieu.com`. Il est limité aux exécutions manuelles (`workflow_dispatch`), **pas aux événements `pull_request`**, car le contexte PR ne doit pas obtenir le jeton DefectDojo. Le rapport ne doit pas inclure de cookies, en-têtes d'authentification ou autres secrets.

Secrets GitHub nécessaires :
- `DEFECTDOJO_URL` : URL **HTTPS** de l'instance DefectDojo, joignable depuis le runner ;
- `DEFECTDOJO_API_TOKEN` : jeton API limité au produit/engagement de destination.

Le scanner ne sait pas accéder aux URL privées du LAN depuis un runner GitHub hébergé. Si DefectDojo n'est accessible que sur TrueNAS / derrière Access, prévoir **un runner autonome durci dans le réseau approprié** ou un transfert manuel contrôlé du rapport ; ne jamais publier DefectDojo sans contrôle d'accès pour simplifier l'import. Un échec de connexion génère un avertissement et conserve le rapport, **pas** une déclaration d'import réussi. La réponse synchrone atteste uniquement la prise en charge de l'import, pas la vérification de chaque finding.

## Exceptions : équivalent de `nosec`, `noqa` et `trivyignore`

Nuclei ne reconnaît ni `# nosec`, ni `# noqa`, ni `.trivyignore` dans le code cible. L'équivalent retenu est la sélection explicite d'IDs de templates exclus par `-eid`. La liste est `[.nuclei/ignore-templates.txt](../.nuclei/ignore-templates.txt)` (une entrée par ligne).

Avant d'ajouter une exception, créer un enregistrement avec : ID de template, URL/endpoint touché (expurgé), raison documentée, preuve de faux positif ou risque accepté, propriétaire, date d'expiration et lien vers le ticket. Préférer une correction ou un filtrage précis à une exclusion générique ; chaque exception doit être revue et temporaire. **Aucun ID n'est ignoré par défaut.**

Les filtres Nuclei `-etags` (tags exclus) sont réservés aux familles de tests volontairement non sûres sur un site de production. Les findings High/Critical ne doivent pas disparaître silencieusement au motif de `noqa` ; ils doivent être triés et traités. Le workflow n'échoue pas automatiquement sur chaque finding tant qu'une politique de seuils fondée sur des résultats réels n'a pas été définie.

## État initial

Au 12 octobre 2026 : workflow et import préparés, **scan Nuclei non exécuté depuis ce conteneur** (binaire Nuclei absent et DNS public indisponible) ; résultat DefectDojo **non confirmé**. Attendre une preuve d'exécution du workflow sur le HEAD exact avant de publier un inventaire d'erreurs ou warnings.

## SARIF et consultation des findings DefectDojo

La PR génère aussi `nuclei-results/nuclei.sarif` avec `scripts/nuclei-to-sarif.mjs`, inclus avec le JSONL dans l'artefact GitHub. Le SARIF est une **vue expurgée** (règle, gravité, libellé) ; il ne constitue pas une nouvelle analyse et ne doit pas contenir cookies, corps de réponse ni URL avec paramètres sensibles. Un import SARIF dans GitHub Code Scanning est distinct et exige les permissions et décisions de visibilité appropriées : sa présence dans l'artefact **ne signifie pas** que GitHub Code Scanning l'a ingéré.

Depuis une session/API DefectDojo disposant des droits de lecture, les findings se consultent via `GET /api/v2/findings/?product=<ID_PRODUIT>` (et les filtres `test`, `active`, `severity`). L'ID produit doit être résolu depuis `GET /api/v2/products/?name=<NOM_PRODUIT>` ou depuis l'interface, jamais inventé. Paginer les résultats ; protéger les jetons et ne pas publier les URL de reproduction sensibles.

### Réconciliation avec nabla-compose

Le catalogue principal `nabla-compose/catalog/services.json` déclare **le service DefectDojo lui-même** sous `id: defectdojo`, `name: DefectDojo`. Il ne déclare pas `nabla-site-alban` ou `albanandrieu.com` comme service applicatif. Le nom initial de produit DefectDojo `albanandrieu.com` provenait donc de la **cible DAST** et non du catalogue. L'import utilise désormais `vars.DEFECTDOJO_PRODUCT_NAME` : en son absence, aucun produit n'est créé arbitrairement. Il faut une association explicite et revue entre le produit DefectDojo, le dépôt `nabla-site-alban`, le domaine `albanandrieu.com` et une éventuelle future entrée canonique du catalogue.

### Cloudflare security-audit-skill vs Nuclei

Le skill Cloudflare épinglé `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` organise un **audit de code raisonné** (reconnaissance, ledger de couverture, investigation, vérification contradictoire, registre de findings). Il n'invoque pas Nuclei par défaut et n'impose pas de scan automatisé de l'URL de production. Il pourrait déceler des défauts équivalents quand le code montre leur cause, mais il ne peut pas reproduire automatiquement toutes les anomalies HTTP, TLS, configuration CDN ou comportements runtime observables par Nuclei. Inversement, Nuclei ne couvre pas toutes les vulnérabilités logiques du code. Les résultats doivent être comparés sur des identifiants/CWE et preuves confirmées, **pas présumés identiques**.

## Mode d'exécution et contrôle des secrets (octobre 2026)

La campagne complète Nuclei est réservée aux exécutions de `master` (push pertinent, programmation hebdomadaire le lundi 04:19 UTC et déclenchement manuel). Le workflow tel que modifié dans la PR #219 ne se déclenchera avec cette programmation qu'après fusion sur la branche par défaut. Les PR ne reçoivent **jamais** le jeton DefectDojo. La récupération des findings par API est tentée uniquement depuis `master`, avec secrets et mapping de produit explicitement configurés. Une PR peut consulter les synthèses non sensibles publiées par une exécution de confiance ; elle ne peut pas prétendre lire directement les findings privés en l'absence d'un canal de publication expurgé.

L'instance DefectDojo du homelab est déclarée dans `nabla-compose` sur l'IP LAN `172.17.0.24`, port `31085`, en HTTP, et non accessible directement depuis un runner public sans exposition ou accès réseau supplémentaire. Ce bind LAN est préférable à une écoute WAN, mais **ne constitue ni TLS ni authentification forte**. Tout accès distant API nécessite un frontal HTTPS fiable avec validation du certificat, contrôle d'accès, identité de service dédiée et jeton à privilèges minimaux. Ne pas publier le port ni contourner Cloudflare Access pour faire fonctionner l'import. Le serveur MCP communautaire `dcianciulli/defectdojo-mcp-server` (révision épinglée `4d34d17f346dccab92e97e3d50e77b568689f283`) est déclarable dans `.mcp.json` ; ses outils d'écriture sont puissants et doivent être audités et restreints avant activation sur la production. Aucun connecteur MCP n'est exécuté automatiquement par la déclaration.
