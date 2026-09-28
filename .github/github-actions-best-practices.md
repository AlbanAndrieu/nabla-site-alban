# GitHub Actions — règles du dépôt

Ce document fixe uniquement les invariants propres à `nabla-site-alban`. Pour la
syntaxe Actions, utiliser la documentation officielle GitHub.

## Autorités

- `.github/workflows/ci.yml` est la gate qualité/sécurité canonique.
- `scripts/ci-scope.sh` décide si un changement exige application build,
  SAST et Preview ; ne pas recréer ce classifieur dans un autre workflow.
- `scripts/agent-quality-gate.sh` et `scripts/agent-publish.sh` sont les
  autorités local-first avant publication.
- `scripts/verify-production-baseline.sh` vérifie la preuve production héritée
  avant de dépenser le budget build d'une PR.
- `renovate.json` est l'autorité des mises à jour de dépendances. Renovate est
  le seul bot autorisé à créer ou rebaser des branches de dependency updates.

## Workflows maintenus

- `ci.yml` : qualité, sécurité, lint, types, tests et build conditionnel ;
- `vercel-preview.yml` + `playwright.yml` : Preview exact-SHA et validation navigateur ;
- `release.yml` : semantic-release après validation de `master` ;
- `mega-linter.yml`, `docker-build.yml`, `build-pdf.yml` : contrôles spécialisés ;
- `copilot-setup-steps.yml` : bootstrap des agents.

OpenCommit reste un outil local/on-demand : aucun workflow OpenCommit n'est requis.

## Runtime et secrets

GitHub Actions lit `.nvmrc` pour Node.js 26.8.2 et utilise npm 11.17.x.
L'installation canonique est `npm ci` avec `strict-allow-scripts=true`.

Secrets/variables utiles selon les workflows :

- `SNYK_TOKEN` : scan Snyk optionnel ;
- `DOCKER_USERNAME` / `DOCKER_PASSWORD` : miroir Docker Hub optionnel ;
- `RELEASE_APP_PRIVATE_KEY` + `RELEASE_APP_CLIENT_ID` : identité GitHub App
  utilisée par semantic-release ;
- `PAT` : fallback MegaLinter lorsqu'il est explicitement configuré.

Ne pas créer un secret pour un workflow absent. Les secrets Vercel/Stripe restent
documentés dans leurs runbooks respectifs.

## Sécurité

Les actions critiques doivent être verrouillées sur un SHA Git immuable avec le
tag de release en commentaire. Chaque job déclare les permissions minimales.
Aucun secret ou contenu PR non fiable ne doit être interpolé directement dans un
shell.

Le `GITHUB_TOKEN` est préféré aux PAT lorsqu'il suffit. Les opérations
privilégiées qui dépassent ses permissions utilisent une GitHub App dédiée et
échouent fermé si son identité n'est pas disponible.

## Coût et fast path

La CI doit échouer avant npm/build sur les défauts déterministes détectables par
le preflight. Les changements docs/tests/tooling non déployables peuvent éviter
Next build et Preview lorsque `ci-scope.sh` le permet ; un changement de
workflow reste security-sensitive et conserve SAST.

La concurrency doit annuler les runs de PR obsolètes. Les caches sont des
optimisations : une panne du backend cache ne doit pas masquer ni provoquer un
échec de qualité.

## Dépendances et rebase

Ne pas ajouter `.github/dependabot.yml` pour les version updates. Renovate
groupe les GitHub Actions et pre-commit dans le lot mensuel
`automation toolchain`.

Les GitHub vulnerability alerts restent activées comme signal. Les **Dependabot
Security Updates** doivent être désactivées lorsque les vulnerability PRs
Renovate sont actives afin qu'un advisory ne crée pas deux branches concurrentes.

Le seul mécanisme automatique de rebase des dependency PRs est :

```json
"rebaseWhen": "conflicted"
```

dans `renovate.json`. Ne pas ajouter de workflow GitHub/GitLab de rebase,
ne pas éditer manuellement les branches `renovate/*`, et ne pas faire tourner
un second bot d'update sur le miroir GitLab. Le validator Renovate GitLab peut
rester actif car il valide la configuration sans créer de branche.

## Preview et déploiement

Vercel Git Integration reste propriétaire du déploiement web. Les Preview sont
déclenchées seulement pour un changement `preview_required=true` et sont
enchaînées avec les contrôles Playwright/ZAP exact-SHA.

Les checks Preview ne doivent pas devenir des required checks globaux du ruleset
`master` puisqu'ils sont volontairement absents sur les changements non
déployables. Les checks globaux attendus sont documentés dans
`docs/github-master-ruleset.md`.

## Diagnostic minimal

Sur un échec CI :

```bash
bash scripts/agent-quality-gate.sh --preflight
npm run quality:agent:fix
# revoir et commiter toute mutation déterministe
npm run quality:agent:publish
```

Si CI retourne `QG_AUTOFIX_REQUIRED`, appliquer le **patch exact** produit par
la gate puis rejouer localement. Ne pas relancer un hosted run pour diagnostiquer
un défaut que la gate a déjà identifié.

Pour un problème de scope :

```bash
bash scripts/ci-scope.sh <base-sha> HEAD
```

et vérifier `maintenance_only`, `application`, `sast`, `build` et
`preview_required`.

## Références

- GitHub Actions : <https://docs.github.com/actions>
- Security hardening : <https://docs.github.com/actions/security-for-github-actions>
- Syntaxe workflows : <https://docs.github.com/actions/reference/workflows-and-actions/workflow-syntax>
- Politique du dépôt : `AGENTS.md`, `SECURITY.md`,
  `docs/quality-roadmap.md` et `docs/github-master-ruleset.md`.
