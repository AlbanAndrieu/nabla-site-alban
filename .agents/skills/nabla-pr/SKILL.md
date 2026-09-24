---
name: nabla-pr
description: Safely maintain the current GitHub pull request for nabla-site-alban. Use before pushing a branch, updating PR metadata, interpreting checks, or preparing a PR for user-controlled merge.
---

# Nabla PR workflow

1. Confirm the branch is non-default. Never mutate, switch to for editing, push to, force-update, or merge `master`.
2. Keep the PR small and thematic. Reuse the current PR when the user explicitly asks to continue it.
3. Before push, require the `nabla-quality` workflow and a clean working tree.
4. Never manually rerun GitHub Actions merely to obtain a green badge when quota is constrained.
5. Distinguish the PR number from workflow run numbers and report the exact HEAD SHA.
6. Update the PR description in French when requested. Include:
   - objective and scope;
   - files/behavior changed;
   - exact local validation commands and results;
   - CI results only when observed on the exact HEAD;
   - intentionally skipped build/Preview work;
   - unresolved operational steps or risks.
7. Do not merge unless the user explicitly asks. Mark ready for review only when the current batch is complete and no known technical reason requires Draft state.
