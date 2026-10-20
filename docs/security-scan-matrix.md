# Matrice de contrôle AppSec et transfert privé DefectDojo

Dernière revue : 18 octobre 2026. Ce document décrit **ce qui est déclaré**
dans le code de CI et le périmètre à accepter, pas une attestation de scan.
Référence Bababou : `AlbanAndrieu/nabla-site-bababou`, workflows
`ci.yml`, `production-dast.yml`, `zap-preview.yml` (parité ciblée,
pas duplication des jobs).

## Répartition pour limiter GitHub Actions

| Contrôle | Pull request | `master` / récurrence | Règle et coût |
| --- | --- | --- | --- |
| BetterLeaks v1.9.0 + détecteur de clés privées | **Bloquant** dans la quality gate pre-commit sur fichiers modifiés, y compris `public/**` | Contrôle à chaque changement; scan historique manuel | Le scanner de secrets n'est pas dupliqué dans Trivy. Une fuite avérée doit être révoquée/rotatée |
| Semgrep SAST | **Bloquant** `p/ci` + `p/owasp-top-ten` sur fichiers JS/TS/Python/workflows **modifiés** | CI sur code modifié, revue élargie à planifier | Pas de full-repo expensive scan sur chaque PR |
| Trivy filesystem / lockfile npm | **Bloquant** sur `CRITICAL` vulnérabilités et misconfigurations, lorsque `package.json`, `package-lock.json` ou Dockerfile changent | Push `master` sur chemins ciblés, plus scan hebdomadaire (dimanche) | `package-lock.json` est validé avant scan; `HIGH` et licences à revoir signalés sans blocage initial |
| Trivy licences | Même passe filesystem | Même passe; baseline revue avant politique de blocage | `--license-full` réservé à un audit manuel car coûteux ; revue Forbidden/Restricted/Unknown |
| Trivy SBOM CycloneDX | **Non généré** sur PR | `master` / manuel ; artefact à rétention courte | Inventaire de composants, **pas** preuve d'absence de vulnérabilités |
| CodeQL JS/TS | **Default Setup GitHub existant**; le workflow Advanced a été retiré après rejet SARIF | Configuration GitHub actuelle | **Ne pas exécuter Advanced + Default simultanément**. Si besoin `security-extended`, modifier la suite dans Default Setup ou planifier une migration autorisée |
| Nuclei | **Pas de scan public sur chaque PR** | Hebdomadaire lundi, manuel ; HTTP public autorisé, `-rl 2 -c 1`, sans OAST/fuzz/bruteforce | Liste d'exclusions révisée, template update externe non SHA-pinné (dette) |
| ZAP Preview | Seulement lorsque le changement est **déployable** et l'exécution Preview autorisée | — | Baseline passive courte sur URL exacte, politique `.zap/rules.tsv`, pas de double scan |
| ZAP production | Pas sur chaque PR | **Hebdomadaire dimanche** ou manuel sur SHA `master`; **pas à chaque déploiement** | Baseline passif, spider borné à deux minutes (`-m 2`), règles passives alpha (`-a`) et pas de détails sensibles (`-s`); un full scan actif nécessite une fenêtre autorisée |
| DAST approfondi | Pas en PR standard | À construire comme lancement manuel approuvé, seulement endpoints publics allowlistés | Pas d'attaque active incontrôlée contre pfSense, TrueNAS, API privée ou Cloudflare Access |
| Docker image Trivy | Sur PR modifiant Dockerfile ou `.dockerignore` | `master`/schedule | Vérification OS/library existante; éviter l'analyse image à chaque modification HTML |

**Attention :** un workflow déclenché uniquement sur certains chemins ne constitue
pas un *required check* universel. Branch rulesets doivent imposer les gates
pertinents et contrôler la politique Critical/secret; CodeQL Default Setup peut
signaler des alertes après analyse sans nécessairement bloquer une PR à lui seul.

## Transfert vers DefectDojo privé

**Cible** : `defectdojo.int.albandrieu.com` / DefectDojo TrueNAS.
Ne **jamais** publier son API ni lui donner un crawler de toutes les
Actions/PR. Le flux est **pull, pas push** :

1. Le workflow de scan `master` publie un **artefact borné** et identifié
   par workflow, run ID et SHA (Trivy CycloneDX + JSON, Nuclei JSONL et
   ZAP JSON selon disponibilité de l'artefact).
2. Un collecteur **sur TrueNAS**, préparé dans
   `nabla-compose/scripts/security/pull-site-alban-security-report.py`,
   utilise une identité GitHub **Actions artifacts:read** restreinte au repo.
   Il refuse les jobs non issus de `master`, les échecs, les archives
   expirées, les noms inattendus, la taille excessive et les entrées ZIP
   non autorisées.
3. Filtrage avant préparation **locale** : Trivy `HIGH/CRITICAL`
   vulnérabilités uniquement; Nuclei `high/critical`; ZAP `riskcode=3`.
   Pas de licences, misconfig, SAST, secrets, SBOM bruts, endpoints internes,
   `INFO/LOW/MEDIUM` par défaut. CycloneDX relève de la revue SBOM
   **séparée**, pas de l'ingestion automatique.
4. Le script `nabla-compose/scripts/security/import-scan-defectdojo.sh`
   conserve le dernier mot : engagement existant, parser autorisé,
   jeton root-only, `--check` par défaut et `--apply` avec approbation
   explicite uniquement. Aucune création automatique d'engagement, aucune
   fermeture automatique d'anciens findings et aucun write API depuis
   GitHub-hosted runners.
5. Les droits **lecture artefacts GitHub** et **écriture DefectDojo**
   sont deux identités différentes; le collecteur ne doit pas lire
   les sources `ops.albandrieu.com`, les secrets JWT, les logs bruts,
   les artifacts de PR non approuvés, ni les autres projets.

**Limite de confidentialité à résoudre avant ingestion active :** les archives
GitHub Actions d'un dépôt public ne constituent **pas un coffre privé**.
Pour les rapports DAST exhaustifs contenant URL/paths/sessions, préférer
l'exécution depuis TrueNAS avec import local, ou **chiffrer les artefacts
avant publication** vers une clé de déchiffrement réservée au collecteur.
Ne pas activer l'import automatique de dumps DAST bruts publics.

## Critères d'acceptation

- Gate BetterLeaks + Trivy Critical **PASS** sur HEAD exact, puis
      quality gate canonique, SAST et tests unitaires **PASS**.
- Vérifier la suite CodeQL Default Setup dans les paramètres GitHub et
      sa politique d'alerte Critical, sans nouveau workflow Advanced.
- Vérifier que ZAP/Nuclei ne redéclenchent pas un DAST lourd sur chaque
      PR/push, et que les timeouts/ratelimits sont appliqués.
- Tests de filtrage et de provenance du collecteur privé; aucune
      connexion à DefectDojo sans un `--apply` local explicite.
- Vérifier le scan `master` réel et la rétention/confidentialité
      des artefacts, puis établir un test import/reimport sur un engagement
      dédié uniquement après consentement et preuve d'accès interne.
- Compter distinctement `PASS`, `FAIL`, `SKIPPED`,
      `NOT_RUN` et `INCOMPLETE`, y compris pour CodeQL/DAST.
