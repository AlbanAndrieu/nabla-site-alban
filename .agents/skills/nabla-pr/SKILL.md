---
name: nabla-pr
description: >-
  Safely maintain the current GitHub pull request for nabla-site-alban. Use
  before pushing a branch, updating PR metadata, interpreting checks, or
  preparing a PR for user-controlled merge.
---
# Nabla PR workflow

1. Confirm the branch is non-default. Never mutate, switch to for editing, push to, force-update, or merge `master`.
2. Always author and commit as `AlbanAndrieu <alban.andrieu@free.fr>`, never with a work identity from the global Git config. Check `git log -1 --format='%an <%ae> | %cn <%ce>'` before push; when it differs, commit with `--author="AlbanAndrieu <alban.andrieu@free.fr>"` and `GIT_COMMITTER_NAME=AlbanAndrieu GIT_COMMITTER_EMAIL=alban.andrieu@free.fr`, or amend unpushed commits the same way.
3. Keep the PR small and thematic. Reuse the current PR when the user explicitly asks to continue it.
4. Before the final commit/publication of a non-trivial code/config batch, require one focused `nabla-review` pass after deterministic fixes and resolve every blocking finding.
5. Before push, require the `nabla-quality` workflow, a clean working tree, and a publication proof for the exact committed HEAD/base/toolchain.
6. Never manually rerun GitHub Actions merely to obtain a green badge when quota is constrained.
7. Distinguish the PR number from workflow run numbers and report the exact HEAD SHA.
8. Update the PR description in French when requested. Include:
   - objective and scope;
   - files/behavior changed;
   - exact local validation commands and results;
   - CI results only when observed on the exact HEAD;
   - intentionally skipped build/Preview work;
   - unresolved operational steps or risks.
9. Do not merge unless the user explicitly asks. Mark ready for review only when the current batch is complete and no known technical reason requires Draft state.
