---
name: nabla-maintenance
description: >-
  Continue the current nabla-site-alban roadmap or PR safely. Use for requests
  to continue planned improvements, reconcile roadmap work, fix CI/quality
  failures, or advance the current PR while minimizing GitHub Actions usage.
---
# Nabla maintenance workflow

1. On a workstation checkout, run `git fetch --prune origin` then `bash scripts/agent-doctor.sh`; repair any `AGENT_DOCTOR_*` prerequisite before implementation.
2. Read the relevant section of `docs/quality-roadmap.md`; do not scan unrelated generated/vendor files.
4. Confirm the current branch is not `master` and identify the current PR/HEAD when available.
4. Create a compact task card: goal, in-scope paths, done evidence, validation, and stop conditions.
5. Choose one finishable item that matches the current PR theme. Do not broaden a ruleset/quality PR into UI or product work.
6. Inspect the smallest relevant files and existing contracts before editing.
7. If hosted CI/Preview is red, load `nabla-ci-debug` and prove the failing layer before editing.
8. Load `nabla-quality` for every editing batch.
9. After deterministic fixes, load `nabla-review` once for non-trivial code/config changes; blocking findings return the task to implementation.
10. If PR metadata or publication is involved, load `nabla-pr`.
11. Prefer repository scripts over ad-hoc commands. Existing scripts are the source of truth.
12. Update the roadmap with evidence, not aspirations. Leave an item open when live activation or workstation validation is still pending.
13. If GitHub Actions quota is constrained, do not manually rerun workflows. Maximize local evidence and make one grouped push.
