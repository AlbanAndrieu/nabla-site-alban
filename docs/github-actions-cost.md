# GitHub Actions credit-saving policy

Detail of the compact rule in `/AGENTS.md`. The mandatory publish policy and
security gates there stay authoritative.

## Pull-request lifecycle

- Agents should create and retain pull requests as **Draft** while iterating,
  and run the targeted local `just`/quality-gate checks before requesting
  review.
- Do **not** put `[skip ci]`, `[ci skip]`, or `skip-checks: true` in commits:
  these can leave required checks pending, and can suppress the authoritative
  review gate.
- `ready_for_review` must start the required CI; subsequent non-draft pushes
  run it again. Do not weaken SAST, SCA, DAST, secret scanning, or required
  branch protection to save minutes.
- Never mark a PR Ready automatically merely to burn credits. Only do so after
  explicit user direction or the repository's documented publication gate, and
  never merge without authorization.
- Keep generated PDFs (when uploaded) for at most **1 day**. Prefer no uploads
  on successful routine PR jobs and short-lived failure diagnostics.

## Measure before expanding CI

Run `python3 scripts/github-actions-usage.py --days 30` locally with
authenticated `gh` to compare per-workflow job wall time and retained artifacts
for the four active repositories. The inventory is read-only and uses GitHub
REST; it is intentionally **not** scheduled in GitHub Actions to avoid
consuming the very credits it audits. Job wall minutes are only an operational
proxy, **not** invoiced minutes; rely on GitHub Billing for authoritative
usage. Run `--repo NAME` to narrow scope or repeat it to select multiple
repositories. Review the worst offenders before adding jobs or artifacts, keep
PDF uploads at one day, and preserve mandatory security checks on Ready for
review.

## Copilot Setup Steps sur les PR Draft (23 octobre 2026)

Le workflow `.github/workflows/copilot-setup-steps.yml` ne conditionnait pas son job au statut Draft et pouvait démarrer une installation complète (Python, mise, pre-commit, npm) lors des itérations agent, même si les autres workflows ignoraient les Drafts. Ajouter la condition au job `copilot-setup-steps` : `pull_request` Draft est `skipped`, `ready_for_review` déclenche le setup requis, `workflow_dispatch` reste explicite. Aucun assouplissement des contrôles de qualité ni changement de nom de job.

Une exécution initiée **avant** cette correction peut continuer ; une modification du workflow ne l'annule pas rétroactivement.
