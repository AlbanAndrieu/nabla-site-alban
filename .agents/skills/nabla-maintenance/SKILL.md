---
name: nabla-maintenance
description: >-
  Continue the current nabla-site-alban roadmap or PR safely. Use for requests
  to continue planned improvements, reconcile roadmap work, fix CI/quality
  failures, or advance the current PR while minimizing GitHub Actions usage.
---
# Nabla maintenance workflow

1. Read the relevant section of `docs/quality-roadmap.md`; do not scan unrelated generated/vendor files.
2. Confirm the current branch is not `master` and identify the current PR/HEAD when available.
3. Create a compact task card: goal, in-scope paths, done evidence, validation, and stop conditions.
4. Choose one finishable item that matches the current PR theme. Do not broaden a ruleset/quality PR into UI or product work.
5. Inspect the smallest relevant files and existing contracts before editing.
6. If hosted CI/Preview is red, load `nabla-ci-debug` and prove the failing layer before editing.
7. Load `nabla-quality` for every editing batch.
8. After deterministic fixes, load `nabla-review` once for non-trivial code/config changes; blocking findings return the task to implementation.
9. If PR metadata or publication is involved, load `nabla-pr`.
10. Prefer repository scripts over ad-hoc commands. Existing scripts are the source of truth.
11. Update the roadmap with evidence, not aspirations. Leave an item open when live activation or workstation validation is still pending.
12. If GitHub Actions quota is constrained, do not manually rerun workflows. Maximize local evidence and make one grouped push.
