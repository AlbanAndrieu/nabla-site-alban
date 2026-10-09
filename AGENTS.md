# Repository agent rules

Canonical compact policy. Load only the task-specific skill under `.agents/skills/nabla-*/SKILL.md`. Do not preload whole skill trees, lockfiles, unrelated docs or broad CI logs.

## Network-free agent loop

Start with `just context` (bounded local Git summary) then `just preflight` (cached refs). Never repeatedly retry blocked GitHub/DNS/codeload/npm endpoints. If available, obtain the exact-HEAD Dagger `source-snapshot-<SHA>` using the connected GitHub service. Verify workflow HEAD plus artifact SHA-256 with `just snapshot-check ZIP SHA DIGEST OUTPUT`. Such a source-only archive lacks `.git` and `node_modules`: **never** treat it as an exact publication proof. Targeted tests are still useful: `just source-check` runs an offline smoke, not a publish gate.

When network works, fetch once, then run `bash scripts/agent-doctor.sh` and `mise run hooks` on a real checkout. Offline preflight is not remote freshness, dependency validation, or permission to publish.

## OBSERVE → ROUTE → CHANGE → FIX → REVIEW → PROVE → PUBLISH

1. OBSERVE exact HEAD/branch/base and status/stat using `just context`.
2. ROUTE one skill: `nabla-maintenance`, `nabla-ci-debug`, `nabla-quality`, `nabla-review`, `nabla-pr`. Load framework/browser skills only when needed.
3. CHANGE one on-theme cohesive batch, preserving security, API and E2E contracts.
4. FIX with `npm run quality:agent:fix` on a complete Git checkout; inspect changed paths only.
5. REVIEW with a focused `nabla-review` before non-trivial publication.
6. PROVE on a committed clean tree with `npm run quality:agent:publish`, then `-- --status` (exact HEAD/base/toolchain proof).
7. PUBLISH once to the confirmed non-default branch and inspect the exact-HEAD CI. In an API-only environment without a runnable checkout, explicitly disclose missing proof and validate narrowly before any reviewed write.

Never write, push, delete or merge `master`, never omit branch on API mutations, force-push, use `--no-verify`, skip CI via commit messages, weaken tests/SAST/secrets/quality gates, or merge a PR without an explicit user instruction. Stop on stale base, unknown HEAD, oscillator, dirty proof or scope creep.

## Context and evidence budget

Inspect exact HEAD → workflow → failed job → failed step → only matching log lines; expand to artifacts when needed. Never loop on statuses. `QG_AUTOFIX_REQUIRED` means local formatter fix, not broad CI log reading; `QG_FIX_OSCILLATION` and `QG_PUBLISH_*` block publication. Report changed paths, tests, HEAD and remaining blockers, not verbose successful test output.

Roadmaps: `docs/quality-roadmap.md` and `docs/homelab-roadmap.md`. Roadmap=open; runbook=operations; incident=history; contract=invariant; Git=chronology. `docs/agent-frontend-standards.md` is on-demand. Do not mutate OpenCode V1/V2 schema without checking installed version.

---
## Mandatory agent publish policy

Agents must never publish changes immediately after editing files.

Before every `git push`, GitHub API file update, or other remote repository mutation:

1. Confirm the target is a dedicated non-default branch and is **not** `master`.
2. Run `npm run quality:agent:fix` from a local checkout after the editing batch and let it converge without manually investigating intermediate formatter passes.
3. Review `git status --short` and `git diff --stat`, then inspect only the affected diff necessary to confirm the deterministic fixes are safe; commit the complete intended batch.
4. Run or reuse `npm run quality:agent:publish`; when repository hooks are installed, the versioned pre-push hook calls the same proof-aware wrapper automatically. For a local-only merge justification or quota outage, capture `npm run quality:agent:publish -- --status` after the successful pass so the PR records the exact HEAD/base/toolchain evidence without rerunning the gate.
5. When hooks are unavailable, or for an API-only mutation path with an executable checkout, explicitly run `npm run quality:agent:publish` until it succeeds before publishing.
6. Fix every non-auto-fixable formatter, linter, YAML, workflow, configuration, unit/contract, type, executable-bit, destructive-diff, or security-check failure caused by the change.
7. Verify `git status --short` is empty after the strict publication gate, then publish through a pull request.

When `mise run hooks` has been run, the normal Git `pre-commit` hook validates commits and the versioned `pre-push` hook invokes `scripts/agent-publish.sh`. Copilot setup installs the same hooks automatically before an agent starts.

An API-only agent must not silently treat remote API writes as a way to bypass local hooks. If its runtime cannot obtain or execute a checkout, it must explicitly report that limitation, reproduce the closest deterministic validations available, keep the remote patch minimal, and inspect the resulting CI immediately. It must never claim that the local quality gate passed when it was not executed.

Never bypass repository hooks with `git push --no-verify`. Never weaken or disable formatter, lint, security, YAML, workflow, generated-file, or validation rules merely to make a push or CI build pass.

Agents must not put GitHub-recognized CI bypass directives in pull-request commit
messages. In particular, do not use bracketed CI/action skip markers or a
`skip-checks: true` trailer to save runner time. Documentation-only and
maintenance PRs must rely on the repository's path/scope classification instead
of suppressing the workflow itself.

### Post-merge remediation is recovery only

`.github/workflows/post-merge-quality-remediation.yml` is a recovery safety net for a failed or timed-out `CI (Quality and Security)` run after a push has already reached `master`. GitHub only activates this `workflow_run` trigger once the workflow file exists on the default branch. It may create a non-default automated remediation PR when deterministic formatter/pre-commit fixes converge, or a diagnostic issue when they do not or when GitHub refuses PR publication/validation.

Agents must never rely on this post-merge workflow as justification for publishing a branch with a failing or unexecuted quality gate. The mandatory pre-publish policy above remains authoritative. An automated remediation PR is itself untrusted until its explicitly dispatched Quality/Security validation succeeds and it is reviewed/merged through the normal PR path.

## Project

Next.js 16 / React 19 / TypeScript / next-intl. Node/npm constraints and commands are authoritative in `package.json`.

## Legacy static 404 rendering exception

`public/404.html`, the public `/404` presentation, and `app/global-not-found.tsx` are an **intentional rendering exception to the Next.js migration**.

The current static 404 presentation is preferred over a fully native React/Next rewrite and must be preserved unless the user explicitly approves that architectural migration in the current task.

Agents must therefore:

- keep `public/404.html` as the rendering source of truth for the custom 404 presentation;
- keep `app/global-not-found.tsx` loading the trusted static body via `loadPublicHtmlFragment("404.html", ...)`, or an equivalent static-fragment integration that preserves the same rendered result;
- preserve the established visual effect, layout, copy, animations, home CTA, analytics integration, widget integration, 404 HTTP status and `noindex` behavior;
- **not replace the 404 with fully native Next/React markup or migrate its styling wholesale into a CSS module merely for architectural consistency**;
- not remove `public/404.html` as dead or legacy code while this exception is active;
- keep `app/global-not-found.tsx` as the application-wide unmatched-route handler and do not add root `app/not-found.tsx` unless segment-level `notFound()` behavior is explicitly required;
- treat `tests/not-found.spec.ts`, including its static cloak/style assertions, as an intentional regression contract rather than obsolete implementation detail.

Safety, compatibility, accessibility or browser fixes may be made around the static integration when they preserve the established rendered behavior. Any architectural change that stops loading `public/404.html` requires explicit user approval first.

## Next.js

For Next.js-specific work, locate and read only the relevant installed guide under `node_modules/next/dist/docs/` before editing. Do not enable, generate or load broad Next.js agent-rule/documentation indexes by default; keep framework guidance targeted to the feature being changed.

## Completion

Report:

1. what changed;
2. checks executed;
3. unresolved failures or risks.
