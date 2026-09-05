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

## Tool and context efficiency

Optimize the amount of context needed to reach a correct result, **not** the repository's capabilities. `/AGENTS.md` is the canonical repository guidance. Agent-specific instruction files must remain thin adapters to it; do not recursively enumerate every AI-vendor directory or preload every skill.

### Tool classes for this repository

- **First-class:** local Git/search (`git status`, `git diff`, `git ls-files`, `rg`); Node/npm and the commands in `package.json`; `scripts/quality-gate.sh`; GitHub repository/PR, Actions, CodeQL, commit-status, artifact and release diagnostics; Vercel deployment/Preview/build diagnostics and Vercel OpenTelemetry; Playwright; Next.js and the `next-devtools` MCP for Next runtime diagnostics; Semantic Release; conditional Snyk scanning when configured. Docker/Buildx, DockerHub/GHCR and Trivy are first-class for Docker-scoped changes. Use these whenever the task requires them; context efficiency must not restrict their functional use.
- **On-demand:** matching entries under `skills/` or `.agents/skills` (including agent-browser, Next.js optimization/i18n and Stripe skills); Stripe integrations; the FastAPI Cloud homelab health/data backend; Cloudflare diagnostics; Datadog/static-analysis configuration; PDF generation; LibreTranslate; OpenCommit; and the legacy MegaLinter workflow. Discover or load them only when the task materially involves them.
- **Out-of-scope by default:** legacy GitLab CI (`.gitlab-ci.yml`) and unrelated account/service connectors such as Gmail, Calendar, Contacts, Slack, LinkedIn, Supabase or Sentry when the current task has no explicit dependency on them. Do not uninstall or disconnect global integrations merely to save context; leave them installed and simply do not discover/load/invoke them.

The classification is repository-specific and may change when the code or deployment architecture changes. Evidence in current code/workflows takes precedence over assumptions or classifications copied from other repositories.

### Discovery and result reuse

- For MCPs, connectors and plugins, discover only the few functions needed for the current operation instead of loading an entire tool schema. Reuse already-discovered functions for the remainder of the task.
- Reuse prior tool responses/resources when they still describe the same revision/state. Do not repeat equivalent API calls solely to refresh context.
- Prefer specialized operations (file/range, PR diff, workflow jobs, job steps, deployment logs) over broad generic REST/API responses.
- Retrieve only the necessary files, ranges, diffs, status fields or logs. Expand progressively only when the targeted evidence is insufficient.
- A context-saving rule is never a reason to avoid a tool that is necessary for a correct diagnosis, security review, test investigation or deployment validation.

### Repository context

Prefer `git diff`, `git status`, `git ls-files`, `rg`, changed-file lists and explicit file/range reads over recursive repository scans. Do not load large lockfiles, generated files, reports, artifacts or whole instruction/skill trees when a manifest, diff, summary or targeted fragment answers the question.

`docs/agent-frontend-standards.md` contains detailed frontend/accessibility/i18n/SEO/print conventions and is intentionally **on-demand**. Load it when a task touches those concerns rather than carrying it in every agent session.

### CI, logs, artifacts and observability

Inspect failures progressively:

1. workflow/check/deployment status;
2. failing job;
3. failing step;
4. targeted logs around the error;
5. full logs, report, artifact, trace, screenshot or video only when the targeted evidence does not explain the failure or when the richer artifact materially improves the diagnosis.

Keep existing test and E2E coverage. For Playwright failures, use the uploaded report, traces, screenshots and other artifacts whenever they are useful; difficult failures justify retrieving the complete artifact set. Apply the same progressive approach to Vercel, FastAPI Cloud, GitHub security results and other observability platforms.

### Polling

Do not loop on workflow status, deployment status, checks, jobs or observability. Read once, continue other useful work, then revalidate when the result can materially change the next action. A requested final CI/deployment verification is still mandatory; avoiding polling must never become skipping the final verification.

### No quality trade-off

Never reduce or bypass security controls, privacy requirements, quality gates, test coverage, hooks, release rules, CI/CD checks or deployment validation to reduce token/context/tool usage. The governing principle is: **reduce the context required to obtain information, not the agent's capabilities or the evidence required for confidence.**

## Protected default-branch policy

Agents must **never** commit, push, create, update, delete, or otherwise mutate files directly on `master`, and must never move, force-update, or write the `master` ref directly.

This prohibition applies equally to Git CLI pushes, GitHub Contents/API writes, ref updates, merge commits authored by an agent, generated-file updates, documentation-only changes, trivial fixes, and emergency fixes. There is no “small change” exception.

Before every remote mutation, an agent must verify that the destination is a non-default working branch. If a repository API or tool defaults to the repository default branch when a `branch`/`ref` argument is omitted, omitting that argument for a write is prohibited.

All agent-authored repository changes must follow this path:

1. create or reuse a dedicated non-default branch;
2. apply all remote mutations only to that branch;
3. validate the branch and inspect CI/deployment results;
4. open or update a pull request targeting `master`;
5. leave the merge to the user/maintainer unless the user explicitly asks the agent to merge that pull request.

Never force-update `master`. If an accidental direct mutation occurs, stop further writes, report it explicitly, and repair it through the safest reviewed path rather than hiding or rewriting history without user approval.

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

1. Confirm the target is a dedicated non-default branch and is **not** `master`.
2. Run `bash scripts/quality-gate.sh` from a local checkout whenever shell access is available.
3. Fix every formatter, linter, YAML, workflow, configuration, generated-file, or security-check failure caused by the change.
4. If the gate modifies files, review and commit those changes.
5. Run `bash scripts/quality-gate.sh` again until it exits successfully with a clean working tree.
6. Verify `git status --short` is empty.
7. Only then publish the changes to the non-default branch and use a pull request for integration.

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

For Next.js-specific work, locate and read only the relevant installed guide under `node_modules/next/dist/docs/` before editing. Do not enable, generate or load broad Next.js agent-rule/documentation indexes by default; keep framework guidance targeted to the feature being changed.

## Completion

Report:

1. what changed;
2. checks executed;
3. unresolved failures or risks.
