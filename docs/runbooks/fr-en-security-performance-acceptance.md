# Recette locale — FR/EN, protection GitHub, dépendances et Lighthouse

**État au 30 octobre 2026.** Ce runbook ne remplace ni les quality gates, ni l'audit de sécurité. Les résultats `READY`, `skipped`, `NOT_RUN`, `BLOCKED` et `PASS` doivent rester distincts.

## Préconditions

Checkout intégral d'une branche non protégée, Node 24 (`>=24.22.1 <25`), npm 12 (`>=12.2.0 <13`), `npm ci` sur le lockfile exact, Chromium/Playwright installés. Conserver les protections Vercel et le secret d'automatisation hors du dépôt. Ne pas relancer de GitHub Actions payante pour les diagnostics.

## 1 — Tests navigateur et SEO FR/EN

```bash
npm run typecheck
npx playwright test tests/seo-indexing.spec.ts tests/accessibility-axe.spec.ts tests/yubikey.spec.ts --project=chromium
npx playwright test tests/accessibility-responsive.spec.ts --project=chromium
```

Sur une Preview protégée, fournir `BASE_URL`, `VERCEL_PREVIEW_PROTECTED=true` et, **depuis un gestionnaire de secrets autorisé**, `VERCEL_AUTOMATION_BYPASS_SECRET`. Ne jamais publier la valeur. Un `429` avec `x-vercel-mitigated: challenge` signifie **blocage edge** ; ce n'est ni une preuve WCAG ni une panne de l'application.

Les contrôles SEO couvrent explicitement `/security/yubikey` et `/fr/security/yubikey` : sitemap, canonical, alternates réciproques et `x-default`. Axe attend que ReactFlow soit visible sur ces routes ; la seule compilation ne satisfait pas la recette.

## 2 — Ruleset et SAST

**Observation de l'API GitHub, 30/10/2026 :** `GET /repos/AlbanAndrieu/nabla-site-alban/rulesets` a retourné **0 ruleset**. La lecture de la protection de branche historique a retourné `403 Resource not accessible by integration` : son état est **UNKNOWN**. La configuration `.github/rulesets/master-quality.json` est versionnée, mais **non attestée active**.

```bash
bash scripts/manage-master-ruleset.sh --validate
bash scripts/manage-master-ruleset.sh --check --repo AlbanAndrieu/nabla-site-alban
```

**Action d'administration requise :** depuis une workstation disposant des droits `Administration:write`, appliquer `bash scripts/manage-master-ruleset.sh --apply --repo AlbanAndrieu/nabla-site-alban`. Relire `--check` et conserver le résultat `RULESET_OK`. Ne pas supprimer les checks obligatoires, ni ajouter un bypass permanent de push sur `master`.

La version actuelle prévoit les checks `quality` et `CI policy guard`, plus PR obligatoire, interdiction de suppression et de non-fast-forward. Aucun succès SAST n'est déduit des statuts Vercel. Contrôler les résultats CodeQL, secrets et Trivy sur le HEAD exact avant toute décision.

## 3 — Dépendances

```bash
node --test unit-tests/siteDependencyPosture.test.mjs
npm ci
npm audit --audit-level=moderate
npm run quality:agent:publish
npm run quality:agent:publish -- --status
```

La lecture du lockfile du 30/10/2026 indique `next@16.4.2`, `eslint-config-next@16.4.2`, `sharp@0.35.5`, `react@19.3.0` et `react-dom@19.3.0`. La version Next est postérieure au correctif de sécurité du 14 octobre (`16.4.1`) ; `sharp@0.35.5` atteint le plancher conseillé. **Ce constat ne remplace pas `npm audit` ni la vérification des transitives.** Conserver Renovate en revue manuelle, sans automerge.

## 4 — Lighthouse et dette technique

Le runner ne télécharge rien : il attend `node_modules/.bin/lighthouse` déjà installé, ou un chemin local explicite `LIGHTHOUSE_BIN`. Tester d'abord **un environnement autorisé** ; ne pas auditer une page de challenge Vercel en la présentant comme la page du site.

```bash
BASE_URL=http://127.0.0.1:3000 just lighthouse-core
BASE_URL=http://127.0.0.1:3000 just lighthouse-full
just agent-efficiency
```

Le profil `core` couvre Home et Security/YubiKey EN/FR. `full` ajoute Architecture et TrueNAS EN/FR. Les rapports Lighthouse sont écrits dans un dossier temporaire, hors Git. Les seuils initiaux sont **80 performance / 90 accessibilité / 90 bonnes pratiques / 90 SEO** ; une note sous seuil reste `FAIL`. Le LCP et le CLS viennent du laboratoire ; **l'INP réel nécessite des mesures terrain** et n'est pas déduit d'un run Lighthouse.

Le test de dette `unit-tests/siteAcceptanceContracts.test.mjs` valide les protections du runner. Prioriser ensuite les budgets réels, la suppression d'adaptateurs dupliqués et les tailles de bundle, sur la base de rapports datés.

## 5 — Mesurer les gains agent

`just agent-efficiency` émet uniquement : taille en octets des deux instructions, durée médiane de trois commandes de routage et `tokenCost=UNKNOWN`. Répéter sur trois interventions comparables avant de conclure à un gain de temps ou de tokens facturés. Une absence de Git ou de fichiers rend la mesure `BLOCKED`.

**Clôture :** consigner le SHA, les tests exécutés, leurs statuts et la première action bloquante. Ne jamais marquer `PASS` un test non lancé.
