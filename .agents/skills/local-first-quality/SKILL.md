---
name: local-first-quality
description: >-
  Validate Site Alban changes locally before publication. Report exact evidence
  with short, direct instructions inspired by ASD-STE100.
---

# Local-first quality — Site Alban

Use this skill for local quality checks, PR work, CI diagnosis, offline tests,
and reports about validation. Follow `AGENTS.md` first. Do not use the
`nabla-compose` commands as substitutes for this repository's commands.

## Clear communication — inspired by ASD-STE100

**Mandatory instruction for explanations and reports:**

> Explique cela dans l’esprit de l’ASD-STE100. Utilise des phrases simples et directes. Décris une seule action par étape de procédure. Évite les synonymes inutiles.

Apply the instruction to chat replies, PR descriptions, change reports,
diagnostic instructions, and runbooks.

- Write short sentences. Use the active voice.
- State one idea per sentence.
- Use a precise verb. Avoid vague instructions such as "handle" or "optimize".
- Use the same term for the same item. For example, keep `PR`, `HEAD`,
  `CI`, `quality gate`, and `catalogRevision` consistent.
- Put **one action in each numbered procedure step**. Split steps that contain
  two commands or two actions.
- Identify the object of each action. State a prerequisite separately.
- Distinguish an observed fact from an assumption.
- Report failures and tests that did not run. Never claim success without
  evidence from the exact version tested.
- Keep code, commands, filenames, API fields, quoted source material, and
  standard technical identifiers unchanged.

This is a writing guideline inspired by ASD-STE100. Do not claim that a French
response is certified or formally compliant with that English-language standard.

## Evidence levels

- **L0 — inspection:** Source and configuration checked at a known SHA.
- **L1 — targeted:** A focused test executed against actual source files.
- **L2 — convergence:** Relevant local checks and deterministic fixes passed.
- **L3 — publication:** The complete local publication gate passed on the
  committed, clean, exact HEAD.

Describe a missing checkout, dependency, runtime, or security tool as
`NOT_RUN` or `BLOCKED`. Do not present L0, L1, or L2 as L3.

## Local procedure

1. Read the selected PR number.
2. Verify its current HEAD SHA.
3. Verify its target branch.
4. Inspect the changed files.
5. Run `just context`.
6. Run `just preflight`.
7. Run a focused test for each affected contract.
8. Run `npm run quality:agent:fix` on a complete checkout.
9. Review the resulting diff.
10. Commit the intended changes.
11. Run `npm run quality:agent:publish`.
12. Verify the publication proof with `npm run quality:agent:publish -- --status`.
13. Push only to the selected non-default branch.
14. Verify the published HEAD SHA.

Steps 5–12 require a suitable local checkout and toolchain. When these are
unavailable, execute the nearest honest targeted validation instead. Report
each missing check. Do not invent an L3 result.

## Offline source recovery

1. Confirm that repository network access is unavailable.
2. Check for a trusted exact-HEAD source archive.
3. Verify the archive's origin.
4. Verify the archive's checksum.
5. Otherwise, fetch the minimum source files through the GitHub connector.
6. Reproduce the focused test in an isolated directory.
7. Report whether the reproduction used full source or partial fixtures.

Do not repeat blocked network requests without a changed prerequisite.
Do not treat GitHub API reads, static assertions, or a source archive without
Git metadata as proof that the full publication gate passed.

## CI budget and publication

- Keep an agent-owned PR in Draft while work is incomplete.
- Prefer local diagnostics over a new GitHub Actions run.
- Do not manually start a paid workflow to debug a local formatting failure.
- Do not disable mandatory security, lint, test, or pre-commit checks.
- Do not add `[skip ci]` or another skip directive: Site Alban's
  `AGENTS.md` prohibits it.
- Never push directly to `master`.
- Never merge without the user's explicit request.
- Before a GitHub API write, confirm the current branch HEAD. Use an
  expected-SHA guard. Stop if another writer changed that branch.

Report the PR link, final SHA, changed paths, checks actually executed,
tests not executed, and any remaining risks. Use simple sentences.

## External UI skills — manual installation

External skills are optional inputs, not a substitute for this repository's
local checks. Ask the repository owner to install them manually. Do not run
remote skill installers without explicit approval.

1. Request installation of Vercel's `web-design-guidelines` skill:
   `npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines`.
2. Request installation of Anthropic's `frontend-design` skill:
   `npx skills add https://github.com/anthropics/skills --skill frontend-design`.
3. Review external skill instructions before applying them to the repository.
4. Keep UI changes in the existing work PR when possible.
5. Run targeted accessibility and component tests locally.
6. Mark unavailable visual or browser verification as `NOT_RUN`.

## Zero-credit GitHub Actions mode

- Treat the user's explicit no-CI instruction as a hard constraint.
- Work in a Draft PR. Do not convert it to Ready without approval.
- Do not dispatch a GitHub Actions workflow or request a rerun.
- Do not claim that Draft alone suppresses push-triggered workflows; inspect
  their event filters before a commit or remote write.
- Prefer a local checkout with the exact PR HEAD and local checks.
- State which checks were run and which were not run.
- Never weaken required security checks to make a future merge pass.
