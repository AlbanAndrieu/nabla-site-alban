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
