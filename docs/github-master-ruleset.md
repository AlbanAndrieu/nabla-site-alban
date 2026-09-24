# Ruleset GitHub de `master`

Le dépôt conserve la politique de protection prévue pour la branche par défaut sous forme de code dans
`.github/rulesets/master-quality.json`.

## Politique

Le ruleset cible `~DEFAULT_BRANCH` et doit rester actif. Il :

- impose le passage par une pull request avant toute modification de `master` ;
- impose les checks GitHub Actions inconditionnels `quality` et `CI policy guard` ;
- bloque la suppression de la branche et les mises à jour non fast-forward ;
- conserve `strict_required_status_checks_policy=false` afin d'éviter un nouveau
  cycle update/rebuild uniquement parce que `master` a avancé ;
- accorde au propriétaire du dépôt un bypass limité à `pull_request`. Ce chemin
  d'urgence sert lorsque les Actions hébergées sont indisponibles ou sans crédit ;
  il n'autorise jamais un push direct sur `master`.

`Vercel`, `Playwright Preview E2E` et ZAP Preview ne sont volontairement pas
des checks globaux obligatoires. Depuis #195, `scripts/ci-scope.sh` peut produire
`preview_required=false` pour les changements non déployables ; ces jobs/statuts
peuvent donc légitimement être absents ou skippés. Un required status check de
ruleset n'est pas conditionnel au diff : les rendre obligatoires globalement
bloquerait les PR de maintenance/tooling.

Le mode `strict=false` est un compromis explicite coût/risque : le dernier HEAD
de la PR doit avoir ses checks obligatoires verts, mais GitHub n'impose pas de
rejouer ces checks après chaque mouvement ultérieur de `master`. La quality gate
résout déjà le HEAD courant de la branche de base au démarrage du run. Si les PR
concurrentes deviennent fréquentes, passer ce paramètre à `true` devient le
durcissement suivant à évaluer. GitHub documente explicitement ce compromis :
le mode strict requiert une branche à jour mais peut provoquer davantage de builds,
le mode loose réduit ces builds au prix d'un risque d'incompatibilité avec une base
ayant avancé.

## Validation locale

Le script reste en lecture seule tant que `--apply` n'est pas utilisé :

```bash
bash scripts/manage-master-ruleset.sh --validate
bash scripts/manage-master-ruleset.sh --print
bash scripts/manage-master-ruleset.sh --check --repo AlbanAndrieu/nabla-site-alban
```

`--validate` ne contacte pas GitHub et vérifie localement les invariants
sensibles du JSON : cible, enforcement, ensemble exact des règles, paramètres PR,
checks obligatoires, source GitHub Actions, mode strict et bypass.

`--check` échoue fermé si le ruleset distant est absent, dupliqué ou dérive du
JSON versionné.

## Application

L'application nécessite `gh`, `jq` et un credential GitHub disposant de
`Administration: write` sur le dépôt :

```bash
bash scripts/manage-master-ruleset.sh --apply --repo AlbanAndrieu/nabla-site-alban
```

La commande crée le ruleset s'il est absent, le met à jour s'il existe, puis le
relit et exige une correspondance normalisée exacte.

## Bypass de continuité

Lorsque les crédits GitHub Actions sont indisponibles, le bypass propriétaire ne
doit être utilisé que depuis l'interface de merge de la PR après une preuve locale
de publication réussie, idéalement :

```bash
npm run quality:agent:publish
```

Il faut conserver dans la PR le SHA exact validé et la commande de validation
utilisée. Le bypass est un mécanisme de continuité et non un remplacement de la
quality gate locale. Le mode `pull_request` est volontaire : il n'accorde pas de
bypass pour un push direct vers `master`.

## État d'activation

Au 24 septembre 2026, le dépôt GitHub n'expose encore aucun ruleset installé. La
configuration et les outils de validation/application sont versionnés d'abord ;
l'item de roadmap reste ouvert jusqu'à application du ruleset distant et jusqu'à
ce que `--check` retourne `RULESET_OK` contre le dépôt live.
