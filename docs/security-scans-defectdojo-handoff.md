# Security scans & DefectDojo — contrat de collecte privé

## Mise à jour producteur ZAP — PR #236, 19 octobre 2026

**Code préparé, validation runtime INCOMPLETE** : `master-dast.yml` remplace
`zaproxy/action-baseline` par `zap-baseline.py` (même profil passif
`-I -T 5 -m 2 -a -s`) sans téléversement automatique. Le JSON complet,
les instances, cookies et journaux HTTP restent dans `RUNNER_TEMP` et
sont supprimés sur tous les chemins de sortie. La publication explicite
`zap-production-report` (rétention 3 jours) contient **uniquement**
`report_json.json` réduit à `site[].@name` (origine HTTPS publique
allowlistée) et `site[].alerts[].{pluginid,riskcode,alert}` (règles HIGH,
libellé calculé sur l'identifiant, aucune preuve). Si le scanner ou
l'expurgation échoue, **aucun artefact n'est téléversé**.

`zap-preview.yml` n'utilise plus l'action auto-upload : seuls les comptes
par gravité sont conservés dans le résumé ; aucun rapport ZAP Preview
n'est publié. Ce workflow est invoqué via la branche par défaut par
`repository_dispatch`, donc sa nouvelle définition est **NOT_RUN**
tant qu'elle n'a pas été déployée et vérifiée séparément.

Le collecteur unique dans Compose #263 conserve le contrat
`zap-production-report/report_json.json` et la conversion privée en
XML **`ZAP Scan`**. L'import reste **NOT_RUN / non autorisé** sans
consentement pour la GitHub App, sans validation du parser installé et
sans engagement/RBAC approuvés. Les rapports ZAP des **autres dépôts**
(notamment Bababou) ne bénéficient pas automatiquement de ce correctif
producteur ; vérifier séparément leur confidentialité avant acceptation.


Date : 2026-10-19. Cette documentation ne déploie ni DefectDojo ni un collecteur.

## Matrice exécution / budget

| Contrôle | PR | Master / manuel | Bloquant | Preuve |
| --- | --- | --- | --- | --- |
| BetterLeaks + GitGuardian / pre-commit | Diff, avant publication | Local et CI canonique | Secret détecté = FAIL | Gate local-first / CI |
| Semgrep SAST | Fichiers touchés, règles existantes | Scan élargi à programmer hors PR | Findings bloquants des règles existantes | SARIF |
| Trivy filesystem | `package-lock.json` / `package.json` ou Docker policy | Hebdo ou changement ; vuln, misconfig, license | Critical vuln/misconfig = FAIL ; licences à examiner | JSON validé |
| Trivy image | Si Dockerfile change ; pas de re-scan statique seul | Build master et hebdo | Critique selon configuration existante | SARIF |
| SBOM CycloneDX | Aucun build doublon pour docs/PR | Depuis master de confiance | Génération invalide = FAIL sur workflow master | Artefact CycloneDX |
| CodeQL (Default Setup existant) | Pas de second workflow Advanced | Vérifier suite et cadence dans GitHub | Alertes à classifier dans code scanning/ruleset, sans supposer blocage PR | Code Scanning |
| ZAP Preview | Seulement PR déployables | Baseline prod hebdomadaire | Règles FAIL existantes | Rapport ZAP |
| Nuclei | Jamais sur PR | Master hebdo et manuel, 2 req/s, 1 worker | Échec technique = INCOMPLETE; High/Critical à confirmer | JSONL/SARIF |

**Ne pas doubler** un contrôle pre-commit sur chaque push avec une campagne DAST complète.
Nuclei et ZAP doivent rester séparés : ZAP passive baseline courte sur les routes publiques,
Nuclei templates `cve,misconfig,exposure` limités, avec exclusions d'IDs révisées.
La couverture profonde de ZAP (API/OpenAPI, spider complet, tests actifs sur la production)
n'est **pas** autorisée par défaut : environnement isolé/staging, consentement explicite,
cadence manuelle, garde rate-limit et périmètre exact avant tout lancement.

## Transfert sortant GitHub → collecte interne DefectDojo

**Source** : artefacts de runs **réussis** sur `master` du dépôt autorisé.
**Destination** : `defectdojo.int.albandrieu.com`, résolu/joignable uniquement
sur le réseau privé, derrière contrôle d'identité et TLS vérifié.
Aucun runner GitHub hébergé ne contacte le hostname `.int`.

Le collecteur LAN **initie** l'accès à GitHub en lecture seule. Aucun endpoint
de dépôt de rapport anonyme, webhook d'import ouvert, reverse tunnel DefectDojo
public, API token DefectDojo dans une PR ou upload de secret sur GitHub.

### Registre des allowlists (deny-by-default)

- **Repository** : `AlbanAndrieu/nabla-site-alban` uniquement pour ce produit.
- **Branches** : `refs/heads/master` ; vérifier `head_sha`, provenance,
  event `push|schedule|workflow_dispatch` et workflow ID **réel**.
- **Artefacts admis** : `trivy-master-<sha>`, `nuclei-public-<run-id>`,
  `zap-production-report` pour un run complet et non expiré.
- **Formats admis** : Trivy JSON vuln/misconfig et CycloneDX SBOM pour
  inventaire distinct ; Nuclei JSONL ; ZAP JSON/XML si effectivement émis.
- **Entrées interdites** : logs de PR/Actions complets, captures HTML ZAP,
  requêtes/réponses HTTP brutes, cookies, JWT, tokens, endpoints et topologie
  interne, SARIF doublon d'un finding déjà importé, rapports incomplets et
  données personnelles.
- **Déduplication** : clé `repository + workflow + run_id + head_sha +
  scan_type + report_digest` ; associer produit et engagement explicites,
  aucune création de produit automatique.
- **Ingestion** : sélection de parseurs DefectDojo réellement pris en
  charge, taille/nombre de findings bornés, quarantaine + redaction,
  import `/api/v2/reimport-scan/` après contrôle de statut ; permissions
  minimum pour compte technique dédié, pas d'administration globale.
- **Retour d'état** : `IMPORTED`, `REJECTED`, `INCOMPLETE`, `NOT_RUN`,
  jamais `PASS` pour un simple téléchargement d'artefact.
- **Rétention** : artefacts GitHub limités à 3 jours ; synchronisation
  planifiée depuis le réseau interne sans que les pipelines attendent le
  résultat; purger les données refusées et journaux sensibles.

## Gates sécurité

- Aucun secret : BetterLeaks dans la PR et détecteur de clés privées via pre-commit.
  GitGuardian est complémentaire et ne doit pas devenir le seul contrôle.
- Critical Trivy : échec de la quality gate du workflow correspondant, sans
  désactivation par `continue-on-error` ; une exception nécessite avis,
  échéance, preuve et identifiant, jamais une ignore globale.
- Ne pas confondre permission GitHub `security-events: write` et autorisation
  de lire/écrire DefectDojo.
- `NOT_RUN` tant qu'aucune exécution sur le HEAD n'a été vérifiée.

Coordination : [Site Alban #236](https://github.com/AlbanAndrieu/nabla-site-alban/pull/236),
[FastAPI #352](https://github.com/AlbanAndrieu/fastapi-sample/issues/352),
[Compose #262](https://github.com/AlbanAndrieu/nabla-compose/issues/262).

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
- **ZAP production** : depuis les changements non fusionnés de #236, émission
  explicite d'un `report_json.json` à schéma minimal `site/alerts` (origines
  approuvées et identifiants HIGH seulement), sans artefact brut. Compose convertit
  ce JSON en XML interne `ZAP Scan` et conserve l'approbation indépendante.
  **INCOMPLETE** jusqu'à l'exécution réelle sur `master` et acceptation parser.

Contrôles nécessaires : provenance `master`/SHA/run/workflow, test de parser
sur l'édition DefectDojo effectivement installée, interdiction de rejouer
un ancien succès après un nouveau scan échoué, compte import seul,
engagement explicitement choisi et test de déduplication. Aucun de ces
points **runtime** ne devient PASS par la seule présence des scripts.

### Alignement avec le parser réel (19/10/2026)

Le parser upstream DefectDojo `dojo/tools/zap/parser.py` annonce
`get_scan_types() = ["ZAP Scan"]` et exige une extension `.xml`.
Le collecteur Compose #263 produit le XML de synthèse sur TrueNAS, en
supprimant tous les corps HTTP, cookies, chemins et paramètres de requête.
Cela **ne corrige pas** l'artefact ZAP brut encore publié par l'action
`zaproxy/action-baseline` : interdire l'ingestion automatique tant que
l'upload du producteur n'est pas révisé. Ne pas ajouter de DAST actif
ou de runner GitHub supplémentaire pour contourner cette restriction.

Les neuf scénarios E2E de l'ancien tableau de bord public ont été
réconciliés : les tests publics vérifient désormais le refus 404 et
l'absence d'éléments privés; les fixtures du test visuel de santé
sont marquées pour reprise future sous authentification dans
`ops.albandrieu.com`. Toute assertion réclamant des IP, ports ou
métriques dans la vitrine publique est invalide.
