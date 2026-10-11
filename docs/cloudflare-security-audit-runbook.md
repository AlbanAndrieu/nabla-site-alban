# Audit Cloudflare — procédure et preuves

> Statut au 10 octobre 2026 : **plan de vérification, pas résultat d'audit**. Ne pas attribuer de succès à un contrôle qui n'a pas été exécuté.

## Clarification du périmètre — apport Site Bababou (11/10/2026)

Le projet [Cloudflare security-audit-skill](https://github.com/cloudflare/security-audit-skill) est un **skill générique d'audit de sécurité du code**, avec six phases, un registre de couverture et des constats vérifiés indépendamment. **Ce n'est pas un scanner de compte Cloudflare** : Access, DNS, WAF, tunnels, FIDO2 et Service Tokens nécessitent des contrôles opérationnels distincts, en lecture seule, avec autorisation et preuves propres.

Documentation de référence : [Site Bababou, PR #230](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/230), fichier `docs/security-audit-skill.md`. Sa révision upstream documentée est `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` (licence MIT, à vérifier avant importation). Épingler **le commit entier** et conserver `LICENSE` ; un blob Git ne prouve ni un téléchargement sûr ni une installation.

Pour un audit effectivement réalisé, respecter les six phases upstream : reconnaissance, couverture, validation contradictoire, constats structurés, vérification indépendante et rapports dérivés. Produire `architecture.md`, `coverage-ledger.json`, `findings.json`, `REPORT.md`, `FINDINGS-DETAIL.md` et `NEEDS-VALIDATION.md`, puis lancer les validateurs upstream `validate-coverage-ledger.cjs` et `validate-findings.cjs` sur les sorties. Les données sensibles doivent rester hors dépôt et hors artefacts publics. Préserver `confirmed`, `needs_validation` et `rejected` et documenter `NOT_RUN` lorsqu'aucun audit n'a eu lieu.

Le validateur local `scripts/validate-cloudflare-audit.mjs` contrôle **uniquement une enveloppe de traçabilité propre au Site Alban** ; il ne remplace ni les deux validateurs upstream, ni Semgrep/BetterLeaks, ni Playwright/ZAP, ni l'audit du compte Cloudflare. Aucun succès d'un contrôle de schéma ne doit être représenté comme absence de vulnérabilité.

## 1. Provenance et trust boundary

Source : https://github.com/cloudflare/security-audit-skill

Avant installation, consigner le SHA exact, la licence, les fichiers effectivement importés, les binaires/scripts invoqués, les permissions réseau et les dépendances. Examiner le code en lecture seule. Ne pas exécuter de contenu distant non relu et ne pas exposer Cloudflare API Token, service token, cookie, clé privée ou session FIDO2.

## 2. Ordre local-first

1. Capturer `git rev-parse HEAD`, `git diff --check`, `git status --short` et la version des outils. Faire correspondre le HEAD audité et celui de la PR.
2. Réutiliser les dépendances locales ; refuser de transformer l'indisponibilité DNS/GitHub en succès. Archiver le blocage et la validation non effectuée.
3. Lancer l'audit Cloudflare limité aux fichiers modifiés, puis élargir les contrôles aux configurations de publication et d'identité ; enregistrer les commandes réellement exécutées après revue des instructions upstream.
4. Lancer la quality gate locale existante `npm run quality:gate` et les contrôles ciblés appropriés. Les tests SAST, BetterLeaks, Playwright et ZAP gardent leurs propres preuves et ne sont pas remplacés par le skill.
5. Comparer le HEAD validé au HEAD distant avant toute publication ; invalider l'attestation si le code change.

## 3. Matrice de couverture

| Domaine | Cas attendu | Preuve minimale | Limite |
| --- | --- | --- | --- |
| Cloudflare Access | Anonyme 302/401/403 selon politique | réponse, chemin, horodatage et décision de politique (expurgés) | un 403 seul ne valide pas l'origine |
| Service Token | Accès avec identité de service autorisée | identité non secrète, décision et résultat HTTP | ne jamais archiver client secret |
| Origine TrueNAS | Reachability LAN et réponse fonctionnelle | DNS, TCP/TLS, HTTP et contrat applicatif séparés | origine non joignable depuis l'agent = non vérifié |
| DNS/Tunnel/Traefik | Alignement publication déclarée/effective | exports de config, changements, propriétaire | catalogue seul insuffisant |
| GitHub/FIDO2 | Politique MFA/SSO et protection de session | export de politique autorisé ou preuve opérateur | ne jamais prétendre connaître l'usage physique YubiKey |
| Code et dépendances | SAST, secrets, DAST et tests UI | rapports propres aux outils concernés | un contrôle non exécuté reste ouvert |

## 4. Format du registre de findings

Un enregistrement par preuve, avec :

- Identifiant, contrôle, sévérité, état : `pass`, `fail`, `not-run` ou `not-applicable`.
- Référentiel et version du skill, SHA du dépôt, date UTC, commande et chemin d'artefact expurgé.
- Propriétaire, cible/route, impact, correction, contre-test et statut de clôture.
- Menace STRIDE avec justification de l'acteur, du flux et de la frontière de confiance ; UUID DSOMM uniquement s'il est retrouvé dans le référentiel officiel épinglé.

## 5. Critères de sortie

Une CI politique verte ne signifie pas que la CI applicative a été exécutée. Ne déclarer « complet » que si l'audit et les quality gates requises ont des résultats rattachés au même HEAD, les vulnérabilités bloquantes sont corrigées et les limites d'accès au runtime sont explicitement documentées. Ne pas merger automatiquement.

## 6. Validation automatisée hors ligne

Le validateur `scripts/validate-cloudflare-audit.mjs` vérifie la structure des preuves, les SHA complets, la version upstream, les états et les preuves obligatoires. Il n'effectue **pas** lui-même d'audit Cloudflare et ne garantit pas que les preuves correspondent à la réalité.

Sur un checkout local de la PR :

```bash
node --test unit-tests/cloudflareAuditEvidence.test.mjs
node scripts/validate-cloudflare-audit.mjs path/to/redacted-evidence.json "$(git rev-parse HEAD)"
git diff --check
npm run quality:gate
```

Ne pas ajouter aux commits des valeurs de jetons ni des exports de configuration non expurgés. Les états `not-run` et `not-applicable` exigent une raison. Le registre doit contenir au moins un contrôle, et chaque succès/échec doit être rattaché à une preuve non secrète.

**Limite connue :** un test des règles de validation n'est pas une attestation de l'audit Cloudflare. Les tests de sécurité indépendants restent obligatoires selon les politiques du dépôt.

## 7. Constat pour la PR #219

- HEAD initial examiné : `5ceac52798bc6da989f8afbef7e342081314177e`.
- Workflow « PR CI policy » du 10/10/2026 : **success**, run [38076572143](https://github.com/AlbanAndrieu/nabla-site-alban/actions/runs/38076572143).
- Aucun autre workflow détecté sur la branche au moment de cet examen ; **aucun audit Cloudflare runtime ni quality gate locale complète attesté**.
- Les commits postérieurs doivent être réévalués ; ce constat ne certifie pas le nouvel HEAD.
