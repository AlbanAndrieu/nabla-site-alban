---
name: nabla-ci-debug
description: >-
  Diagnose hosted CI, Preview, Playwright, security, or quality failures with
  progressive evidence and minimal reruns. Use when a workflow/check is red or
  the user asks to fix CI.
---
# Nabla CI diagnosis

Use `AGENTS.md` as the authority. Diagnose before editing.

## Progressive evidence

Inspect in this order and stop as soon as the root cause is proven:

1. exact current branch and HEAD;
2. failing workflow/check status;
3. failing job;
4. failing step;
5. only the log lines around the first actionable error;
6. traces, screenshots, reports or full artifacts only when targeted logs are insufficient.

Do not fetch broad logs or artifacts first.

## Deterministic failures

Treat repository quality codes as instructions, not mysteries:

- `QG_AUTOFIX_REQUIRED` → switch to `nabla-quality` and run the local fix path;
- `QG_PRECOMMIT_FAILED` → inspect the named hook and affected files only;
- `QG_FIX_DID_NOT_CONVERGE` → stop retries and identify the unstable hook;
- `QG_PUBLISH_*` → publication is blocked until the stated invariant is repaired.

Do not manually rerun GitHub Actions to rediscover a deterministic local failure.

## Hosted failures

Separate the failing layer. A workflow can be red while its `quality` job is green because a downstream Preview, Playwright, ZAP, deployment or status-wait job failed.

For Playwright failures, capture the exact spec, locator/assertion, expected value and received value. Compare the test assumption with the current route/runtime before changing product code. Prefer repairing an obsolete or flaky contract when the product behavior is already correct; never weaken a valid accessibility/security assertion merely to obtain green CI.

## Quota-constrained mode

When Actions quota is constrained:

- never request a manual rerun for a badge;
- maximize local deterministic evidence;
- group fixes into one coherent push;
- record checks that could not run;
- treat remote CI as independent verification, not the primary debugger.

## Completion

Report the exact HEAD, root cause, files changed, local checks actually run, hosted checks observed for that HEAD, and any unresolved risk.


## Environnement isolé : GitHub et registres inaccessibles

Un échec de `git clone`, de DNS ou d'accès au registre n'est **pas** une
régression applicative. Ne pas multiplier les appels réseau identiques.

1. Vérifier une fois l'existence d'un checkout Git local et l'exactitude de
   `git rev-parse HEAD`. Ne jamais utiliser un checkout correspondant à un
   SHA différent comme preuve de publication.
2. Si le checkout est absent, appliquer le protocole
   `nabla-maintenance > Remote exact-HEAD snapshot fallback` : artefact
   Dagger de la CI existante, SHA identique et extraction isolée. Ne pas
   demander de relance GitHub Actions uniquement pour obtenir l'artefact.
3. En dernier recours, utiliser les fichiers ciblés du connecteur GitHub
   **sur le ref SHA**, sans `git clone`, `curl github.com` ni appels
   répétés à codeload/raw. Une reconstruction partielle n'est jamais une
   preuve d'un checkout complet.
4. Exécuter les tests sans dépendances externes réellement disponibles.
   Sans `node_modules` vérifié, marquer lint/typecheck/build et scans
   nécessitant des binaires téléchargés `NOT_RUN`, jamais `PASS`.
5. Pour les défauts de dépendances, ne jamais inventer un
   `integrity` npm ou réécrire le lockfile à la main ; exiger un
   lockfile régénéré puis `npm ci` avant publication.

## Budget de contexte de l'agent

- Conserver une fiche courte : `HEAD | check rouge | première erreur |
  fichiers | correction | preuve | risque restant`.
- Récupérer un **seul** workflow, job et segment de log correspondant à
  la première erreur utile ; élargir seulement lorsque cela ne suffit pas.
- Après une correction de formatter `QG_AUTOFIX_REQUIRED`, consommer
  directement le patch déterministe fourni par la gate, sans réanalyser
  le log complet ni inventer des changements sémantiques.
- Une validation réussie n'est réutilisable que si HEAD, base, toolchain
  et empreinte du workspace sont identiques ; sinon, l'invalider.
- Préférer un lot cohérent et une unique publication à plusieurs petits
  commits déclenchant de nouvelles CI. Jamais de relance manuelle.

La compaction des logs et du contexte **ne supprime aucun test** et ne
transforme jamais un échec en succès.
