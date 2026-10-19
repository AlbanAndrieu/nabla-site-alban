# Security scans & DefectDojo — contrat de collecte privé

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
