---
name: nabla-review
description: >-
  Perform a focused read-only review of the current batch before publication.
  Use after deterministic fixes on non-trivial code or configuration changes.
---
# Nabla focused batch review

Review only the current intended diff and the contracts it directly affects. Do not edit files and do not broaden the task into unrelated refactoring.

Check:

1. the batch still matches the user's request and the current PR theme;
2. changed behavior is supported by an existing requirement, roadmap item, failing test, or explicit user request;
3. security, privacy, branch protection and publication rules are not weakened;
4. tests assert the intended behavior rather than an obsolete implementation detail;
5. UI changes preserve accessibility, responsive behavior, reduced motion and SEO contracts when relevant;
6. configuration changes fail closed and do not silently broaden permissions;
7. generated/vendor files and unrelated cleanup are absent;
8. the planned validation is sufficient for the changed paths.

Report blocking findings first with file/path and concrete reason. If there are no blocking findings, say so explicitly and list only residual risks that still require runtime or hosted evidence.

Do not commit, push, merge, rerun hosted CI, or modify the working tree.
