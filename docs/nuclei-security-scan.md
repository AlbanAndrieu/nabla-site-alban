# Nuclei DAST public — Site Alban

## Coordination CI/DAST au 19 octobre 2026

- **Nuclei** : filtre HIGH/CRITICAL à la source déjà prévu et inchangé ;
  cadence hebdomadaire/manuelle, 2 req/s, une concurrence. **NOT_RUN**
  pour tout nouveau scan `master` non prouvé ; pas de nouveau DAST sur PR.
- **ZAP Site Alban** : modification source-only dans la PR #236 :
  production publie un JSON minimal compatible avec le collecteur privé
  Compose #263, Preview ne publie plus de rapport brut. Validation du
  workflow déployé **INCOMPLETE**, anciens artefacts GitHub déjà publiés
  à inventorier et expirer/purger selon permissions.
- **DefectDojo** : nom du parseur OSS **`ZAP Scan`** ; GitHub App,
  engagement préexistant, RBAC, parsing installé, Celery et déduplication
  **NOT_RUN**. Aucun import ni push depuis un runner public.


## Portée et exécution

Le workflow [Nuclei public DAST](../.github/workflows/nuclei-public.yml) cible exclusivement `https://albanandrieu.com` depuis GitHub Actions chaque lundi à 04:19 UTC, ou manuellement via `workflow_dispatch`. **Ce n'est pas un scan de l'homelab**. Il ne suit pas une URL fournie par l'utilisateur, n'injecte pas de Service Token et ne sonde aucune adresse privée. Le trafic de production est limité à 2 requêtes/s et une seule concurrence ; les modèles DoS, fuzzing, brute force et les tests OAST (`-ni`) sont exclus. Le rapport JSONL reste un artefact GitHub à conservation de trois jours.

Nuclei est épinglé à `v3.11.1`, archive Linux amd64 vérifiée par SHA-256 `ea63d4ae232808cd7c6bc00d0142428e231fab59dae01042246097d195835ab6`. La provenance des templates distants n'est **pas** verrouillée par SHA : il s'agit d'une dette P1, ne pas prétendre à la reproductibilité intégrale avant épinglage du corpus de templates.

Le workflow écrit un résumé par sévérité et ID de modèle. Un résultat Nuclei est un **signal à confirmer**, pas automatiquement une vulnérabilité avérée. Le job est plafonné à 15 minutes ; un scan interrompu, annulé ou échoué est **INCOMPLETE / NOT_RUN**, même si un fichier JSONL partiel existe. Aucun import DefectDojo ni lecture en retour n'est autorisé après un échec de scan. Une absence de rapport est une erreur de scan, jamais « zéro alerte ». Le workflow ne remplace pas ZAP Preview, Semgrep, BetterLeaks ni les validations de publication.

## DefectDojo : récupération privée, pas d'import par GitHub Actions

Le workflow Nuclei de `master` conserve un profil de scan non intrusif,
plafonné à **2 requêtes/s**, une concurrence et 15 minutes. Aucun scan DAST
supplémentaire n'est déclenché à chaque PR.

En cas de succès complet, le job crée `nuclei-public-<run-id>` contenant
`nuclei-results/nuclei.jsonl` et son SARIF. **Avant toute publication**,
`scripts/security/minimize-nuclei-report.mjs` réduit le JSONL aux seuls
findings High/Critical et à des champs explicitement autorisés :
`template-id`, `info.name` calculé depuis cet ID, `info.severity`, le
type HTTP et la seule origine HTTPS `albanandrieu.com` ou
`www.albanandrieu.com`. Le JSONL brut est supprimé. Aucun cookie, URI avec
chemin ou paramètres, corps de requête ou réponse, en-tête d'authentification
ne peut être publié dans cet artefact.

L'ingestion vers DefectDojo est **entièrement externe** à cette CI.
Le collecteur déclaré dans
[nabla-compose #263](https://github.com/AlbanAndrieu/nabla-compose/pull/263)
utilise depuis TrueNAS une **GitHub App à jeton éphémère** limitée à
`Actions:read` sur le dépôt Site Alban. Il vérifie l'identité du workflow,
la branche `master`, la conclusion `success`, l'ID du run et le SHA,
puis filtre encore le JSONL avant un éventuel import privé au format
`Nuclei Scan`. Il refuse un ancien succès lorsqu'un scan plus récent a échoué.

**Aucun** secret `DEFECTDOJO_URL`, `DEFECTDOJO_API_TOKEN`, PAT GitHub,
token Cloudflare Access ou droit de push DefectDojo n'est à fournir aux
runners publics de Site Alban. L'instance
`defectdojo.int.albandrieu.com` reste strictement interne. Le collecteur
n'envoie rien automatiquement : import/reimport `--apply` approuvé,
engagement produit identifié, compte dédié et vérification du traitement
asynchrone restent indispensables.

Un rapport absent, partiel, expiré ou sans attestation d'origine reste
`NOT_RUN` / `INCOMPLETE`, jamais `PASS` ni zéro vulnérabilité.
La rétention GitHub de trois jours suppose une collecte interne périodique
et une politique de purge côté TrueNAS.

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

Le profil Nuclei hebdomadaire est réservé aux exécutions de `master` (programmation le lundi 04:19 UTC ou déclenchement manuel). Les changements applicatifs n'entraînent pas de scan sur push. Ce profil est délibérément restreint aux tags `cve,misconfig,exposure` et sévérités `medium,high,critical`, afin de limiter les minutes Actions et la charge sur la production ; il ne constitue **pas** une campagne exhaustive. Le workflow tel que modifié dans la PR #219 ne se déclenchera avec cette programmation qu'après fusion sur la branche par défaut. Les PR ne reçoivent **jamais** le jeton DefectDojo. La récupération des findings par API est tentée uniquement depuis `master`, avec secrets et mapping de produit explicitement configurés. Une PR peut consulter les synthèses non sensibles publiées par une exécution de confiance ; elle ne peut pas prétendre lire directement les findings privés en l'absence d'un canal de publication expurgé.

L'instance DefectDojo du homelab est déclarée dans `nabla-compose` sur l'IP LAN `172.17.0.24`, port `31085`, en HTTP, et non accessible directement depuis un runner public sans exposition ou accès réseau supplémentaire. Ce bind LAN est préférable à une écoute WAN, mais **ne constitue ni TLS ni authentification forte**. Tout accès distant API nécessite un frontal HTTPS fiable avec validation du certificat, contrôle d'accès, identité de service dédiée et jeton à privilèges minimaux. Ne pas publier le port ni contourner Cloudflare Access pour faire fonctionner l'import. Le serveur MCP communautaire `dcianciulli/defectdojo-mcp-server` (révision épinglée `4d34d17f346dccab92e97e3d50e77b568689f283`) est déclarable dans `.mcp.json` ; ses outils d'écriture sont puissants et doivent être audités et restreints avant activation sur la production. Aucun connecteur MCP n'est exécuté automatiquement par la déclaration.

## Intégration réelle du collecteur privé DefectDojo (2026-10-19)

Le collecteur prévu dans [nabla-compose #263](https://github.com/AlbanAndrieu/nabla-compose/pull/263)
attend **trois workflows `master` réussis** : `Supply Chain Security (Trivy)`,
`Nuclei public DAST (Site Alban)` et `Production DAST`. Leurs artefacts
restent à conservation limitée et **ne sont jamais envoyés directement vers
`defectdojo.int.albandrieu.com` depuis un runner GitHub**.

- **Trivy** : `trivy-master-<sha>` contient `trivy-security.json` et le
  SBOM CycloneDX. Le collecteur importe seulement CVE npm lockfile
  `HIGH/CRITICAL` ; SBOM, licences, misconfigurations et autres scanners
  sont **exclus** du reimport automatique.
- **Nuclei** : `nuclei-public-<run-id>` contient un
  `nuclei-results/nuclei.jsonl` **minimisé avant publication GitHub**.
  Le fichier de collecte conserve seulement `template-id`, le type HTTP,
  la sévérité `high/critical`, le nom du template et l'origine HTTPS
  autorisée. Réponses, requêtes, chemins et paramètres ne sont pas publiés
  dans ce JSONL. Le scan conserve en mémoire de job un JSONL brut pour
  établir les comptes par sévérité, puis le supprime **avant** upload.
- **ZAP production** : `zap-production-report` produit actuellement
  `report_json.json`. Le collecteur convertit ce JSON en XML expurgé
  et utilise le scanner DefectDojo OSS `ZAP Scan` (format XML),
  avec les alertes `riskcode=3` uniquement. **Point bloquant avant
  ingestion automatique** : `zaproxy/action-baseline` archive encore
  lui-même le rapport non expurgé dans GitHub Actions. Aucun filtre
  applicatif ultérieur sur TrueNAS ne garantit sa confidentialité.
  Remplacer cet upload par un artefact minimisé avant de réautoriser
  l'automatisation ZAP ou exécuter les DAST sensibles dans le LAN.

Contrôles nécessaires : provenance `master`/SHA/run/workflow, test de parser
sur l'édition DefectDojo effectivement installée, interdiction de rejouer
un ancien succès après un nouveau scan échoué, compte import seul,
engagement explicitement choisi et test de déduplication. Aucun de ces
points **runtime** ne devient PASS par la seule présence des scripts.
