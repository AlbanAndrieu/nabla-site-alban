# Ruleset GitHub de `master`

La politique cible est versionnée dans
`.github/rulesets/master-quality.json` et pilotée par
`scripts/manage-master-ruleset.sh`.

## Contrat

Le ruleset `master-quality-and-pr-safety` cible `~DEFAULT_BRANCH` et doit :

- imposer une pull request avant modification de `master` ;
- exiger uniquement les checks globaux `quality` et `CI policy guard` ;
- bloquer suppression et mises à jour non fast-forward ;
- conserver `strict_required_status_checks_policy=false` pour éviter de rejouer
  les builds uniquement parce que `master` a avancé ;
- autoriser au propriétaire un bypass limité au mode `pull_request`, jamais un
  push direct sur `master`.

Les checks Preview (`Vercel`, `Playwright Preview E2E`, ZAP Preview) restent
conditionnels au diff et ne doivent pas devenir des required checks globaux.

## Validation local-first

Aucun runner GitHub n'est nécessaire pour valider la configuration versionnée :

```bash
bash scripts/manage-master-ruleset.sh --validate
bash scripts/manage-master-ruleset.sh --print
```

`--validate` vérifie localement avec `jq` la cible, l'enforcement, l'ensemble
exact des règles, les paramètres PR, les deux checks obligatoires, `strict=false`
et le bypass propriétaire.

L'audit du dépôt live est read-only et utilise le credential `gh` local :

```bash
bash scripts/manage-master-ruleset.sh --check \
  --repo AlbanAndrieu/nabla-site-alban
```

Résultats attendus :

- `RULESET_OK` : état distant identique au JSON versionné ;
- `RULESET_MISSING` : aucun ruleset portant ce nom ;
- `RULESET_DUPLICATE` : plusieurs rulesets concurrents ;
- `RULESET_DRIFT` : état distant différent.

Le script échoue fermé dans les trois derniers cas.

## Application

L'application utilise la workstation et ne consomme pas de crédit GitHub Actions.
Elle exige `gh`, `jq` et un credential GitHub avec
`Administration: write` sur le dépôt :

```bash
bash scripts/manage-master-ruleset.sh --apply \
  --repo AlbanAndrieu/nabla-site-alban
```

Le script crée le ruleset s'il manque, met à jour un ruleset divergent, puis le
relit et exige `RULESET_OK`.

Après application, exécuter à nouveau `--check` et conserver le résultat avec le
SHA de la branche/PR qui porte la configuration.

## Continuité sans crédits Actions

Le bypass propriétaire sert uniquement depuis l'interface de merge d'une PR
lorsque les runners hébergés sont indisponibles. Il doit être accompagné d'une
preuve locale exacte-SHA, idéalement :

```bash
npm run quality:agent:publish
npm run quality:agent:publish -- --status
```

Ce bypass ne remplace pas la quality gate et n'autorise jamais un push direct sur
`master`.

## État live — audit GitHub du 21 novembre 2026

Deux rulesets sont actifs sur `~DEFAULT_BRANCH` (lecture API GitHub, sans modification) :

- [Protect master](https://github.com/AlbanAndrieu/nabla-site-alban/rules/27355874) (ID 27355874) : bloque suppression et non-fast-forward, impose PR et historique linéaire, mais n'exige que `GitGuardian Security Checks`, **pas** `quality` ni `CI policy guard`.
- [Code quality](https://github.com/AlbanAndrieu/nabla-site-alban/rules/27677122) (ID 27677122) : règle `code_quality` à sévérité `errors`. Elle ne remplace pas la qualité L3.
- Les deux rulesets autorisent `bypass_mode=always` pour l'intégration `4676280`. Son identité et sa justification doivent être vérifiées ; ce n'est pas le bypass propriétaire `pull_request` décrit dans la politique cible.

**Écart P0 :** aucun ruleset live ne porte le nom `master-quality-and-pr-safety`, et les règles actives ne correspondent pas au JSON versionné. **`RULESET_OK` non prouvé ; cible absente et dérive constatée.** Ne pas appeler `--apply` sans inventorier les règles existantes : créer une troisième règle pourrait laisser des protections concurrentes ou des bypass imprévus. Préparer une migration contrôlée avec permission `Administration: write`, vérifier les required checks réellement produits, puis relire avec `--check`.

Le [master@1259c593](https://github.com/AlbanAndrieu/nabla-site-alban/commit/1259c593927ed99aa7c2f68691ce1829480f0dfe) échoue également sur la préparation Python et le smoke production. Correctif : [PR #338](https://github.com/AlbanAndrieu/nabla-site-alban/pull/338). Une PR Draft ou un check `skipped` ne constitue pas une qualité L3 validée.
