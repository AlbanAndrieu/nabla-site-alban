# Repository agent rules

Keep context small. Prefer targeted search/ranges and changed files; never scan generated/vendor output unless required (`node_modules/`, `.next/`, coverage/reports, caches, lockfiles).

## Repository bootstrap

Git hook configuration is versioned, but Git does not install repository hooks automatically after clone. On a new checkout, run:

```bash
mise run hooks
```

This installs the configured `pre-commit`, `commit-msg`, and canonical `pre-push` quality-gate hooks. CI remains the authoritative enforcement layer because local hooks can be absent or explicitly bypassed.

## Workflow

1. Inspect only files relevant to the request.
2. Reuse existing patterns and make the smallest safe patch.
3. Validate narrowly first, then broaden checks.
4. For CI failures, inspect the failing job/step and affected files before unrelated code.

## Validation

For a focused change, run the closest relevant formatter/linter or test first.

Before considering a substantial change complete, and always before publishing repository changes, run:

```bash
bash scripts/quality-gate.sh
```

The canonical gate validates files touched by the branch plus staged, unstaged, and untracked working-tree files through the repository `pre-commit` stage. Fix every formatter, linter, YAML, workflow, configuration, generated-file, or security failure reported by the configured hooks. Re-run until the gate exits successfully and `git status --short` is empty.

Project-specific tests and expensive Playwright, production-build, CodeQL, and deployment checks remain in their native commands and CI; do not duplicate them inside the shared publication orchestrator.

## Mandatory agent publish policy

Agents must never publish changes immediately after editing files.

Before every `git push`, GitHub API file update, or other remote repository mutation:

1. Run `bash scripts/quality-gate.sh` from a local checkout whenever shell access is available.
2. Fix every formatter, linter, YAML, workflow, configuration, generated-file, or security-check failure caused by the change.
3. If the gate modifies files, review and commit those changes.
4. Run `bash scripts/quality-gate.sh` again until it exits successfully with a clean working tree.
5. Verify `git status --short` is empty.
6. Only then publish the changes.

When `mise run hooks` has been run, the normal Git `pre-commit` hook validates commits and the canonical `pre-push` hook invokes the same `scripts/quality-gate.sh` automatically before push.

An API-only agent must not silently treat remote API writes as a way to bypass local hooks. If its runtime cannot obtain or execute a checkout, it must explicitly report that limitation, reproduce the closest deterministic validations available, keep the remote patch minimal, and inspect the resulting CI immediately. It must never claim that the local quality gate passed when it was not executed.

Never bypass repository hooks with `git push --no-verify`. Never weaken or disable formatter, lint, security, YAML, workflow, generated-file, or validation rules merely to make a push or CI build pass.

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

`next.config.mjs` intentionally sets `experimental.agentRules: false` so `next dev` does not regenerate large agent context blocks. For Next.js-specific work, locate and read only the relevant installed guide under `node_modules/next/dist/docs/` before editing. Do not add a full documentation index here.

## Completion

Report:

1. what changed;
2. checks executed;
3. unresolved failures or risks.
