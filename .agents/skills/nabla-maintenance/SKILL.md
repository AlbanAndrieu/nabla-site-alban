---
name: nabla-maintenance
description: Continue the current nabla-site-alban roadmap or PR safely. Use for requests to continue planned improvements, reconcile roadmap work, fix CI/quality failures, or advance the current PR while minimizing GitHub Actions usage.
---

# Nabla maintenance workflow

1. Read the relevant section of `docs/quality-roadmap.md`; do not scan unrelated generated/vendor files.
2. Confirm the current branch is not `master` and identify the current PR/HEAD when available.
3. Choose one finishable item that matches the current PR theme. Do not broaden a ruleset/quality PR into UI or product work.
4. Inspect the smallest relevant files and existing contracts before editing.
5. Load `nabla-quality` for every editing batch.
6. If PR metadata or publication is involved, load `nabla-pr`.
7. Prefer repository scripts over ad-hoc commands. Existing scripts are the source of truth.
8. Update the roadmap with evidence, not aspirations. Leave an item open when live activation or workstation validation is still pending.
9. If GitHub Actions quota is constrained, do not manually rerun workflows. Maximize local evidence and make one grouped push.
