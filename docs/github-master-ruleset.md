# GitHub master ruleset

The repository keeps the intended default-branch protection as code in
`.github/rulesets/master-quality.json`.

## Policy

The ruleset targets `~DEFAULT_BRANCH` and is intended to stay active. It:

- requires changes to reach `master` through a pull request;
- requires the unconditional GitHub Actions checks `quality` and `CI policy guard`;
- blocks branch deletion and non-fast-forward updates;
- keeps `strict_required_status_checks_policy=false` to avoid an extra update/rebuild
  cycle solely because `master` moved;
- grants the repository owner a `pull_request`-only bypass. This is the emergency
  path when hosted Actions are unavailable or quota-constrained; it never permits
  a direct push to `master`.

`Vercel`, `Playwright Preview E2E` and Preview ZAP are deliberately not global
required checks. Since #195, `scripts/ci-scope.sh` can set `preview_required=false`
for non-deployable changes and those Preview jobs/statuses may legitimately be
absent or skipped. A repository ruleset required status check is not conditional
on the changed-file scope, so making those statuses globally required would block
maintenance/tooling PRs by design.

## Local audit

The script is read-only unless `--apply` is passed:

```bash
bash scripts/manage-master-ruleset.sh --print
bash scripts/manage-master-ruleset.sh --check --repo AlbanAndrieu/nabla-site-alban
```

`--check` fails closed when the ruleset is missing, duplicated or drifts from the
repository-owned JSON.

## Apply

Applying requires `gh`, `jq` and a GitHub credential with repository
`Administration: write` permission:

```bash
bash scripts/manage-master-ruleset.sh --apply --repo AlbanAndrieu/nabla-site-alban
```

The command creates the ruleset when absent, updates it when present, then reads
it back and requires an exact normalized match.

When GitHub Actions credits are unavailable, the owner bypass should only be used
from the PR merge UI after recording a successful local publication proof (for a
fully bootstrapped checkout, `npm run quality:agent:publish`). The bypass is a
continuity mechanism, not a replacement for the local quality gate.

## Activation state

As of 23 September 2026, the GitHub repository exposes no installed ruleset. The
configuration and audit/apply tooling are versioned first; this roadmap item stays
open until the remote ruleset has been applied and `--check` reports
`RULESET_OK` against the live repository.
