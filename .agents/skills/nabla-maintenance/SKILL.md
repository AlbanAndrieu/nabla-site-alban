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
3. Confirm the current branch is not `master` and identify the current PR/HEAD when available.
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


## Remote exact-HEAD snapshot fallback

Use this fallback when the agent runtime can use the GitHub connector but local
DNS prevents `git clone`, `curl github.com`, codeload or raw GitHub access.

1. Read the current PR HEAD first. Never validate an archive whose provenance
   does not resolve to that exact SHA.
2. Prefer the automatically produced Dagger PoC artifact named
   `source-snapshot-<HEAD_SHA>`. Require its workflow run `head_sha` to equal
   the PR HEAD and require the artifact to be unexpired.
3. Download the workflow artifact through the GitHub connector. Verify the
   connector-reported artifact digest when available, then unzip it in an
   isolated directory.
4. Require exactly one inner tarball named
   `nabla-site-alban-<HEAD_SHA>.tar.gz`. Extract it to a fresh directory;
   never silently accept a merge-commit SHA or a differently named snapshot.
5. Run the cheapest real targeted checks that do not need unavailable
   dependencies. For dependency-free TypeScript contract tests, Node 22 can run
   suitable files with
   `node --experimental-strip-types --test <test-file.ts>`. Use this only when
   the selected test imports Node built-ins/repository files and does not need
   package dependencies.
6. Treat the snapshot as source-tree evidence, not as a Git checkout. A
   `git archive` has no `.git`, so merge-base, changed-file, branch,
   pre-push and exact publication-proof checks cannot be proven from it.
   Likewise, tests that require `node_modules` still need a real dependency
   bootstrap or hosted CI.
7. If no matching snapshot artifact exists, use connector file reads and the
   already-running hosted checks. Do not manually rerun a workflow solely to
   create the artifact when CI quota is constrained, and do not loop on
   codeload/DNS failures.

This fallback was validated against an exact PR snapshot with 1,175 files and
the dependency-free tooling contract tests passing directly from the extracted
archive. Keep the workflow artifact retention short; it is a transport for
ephemeral validation, not a release artifact.
