---
name: nabla-nda-guard
description: >-
  Keep NDA-sensitive information about current and previous employers out of the
  public site. Use before committing or publishing changes to app/, components/,
  messages/, public/, lib/ or docs/, when NDA_GUARD_* appears, or when adding
  CV, career or employer-related content.
---
# NDA guard

The repository and the site are public. `scripts/security/nda-guard.json` is the
single source of truth:

- `job-*`: current Job employer, partners and internal codes. They are salted
  SHA-256 token hashes. Never write these terms in clear text: not in code,
  tests, docs, commits, PR text, shared notes or agent messages.
- `notion-url`, `sharepoint`: internal collaboration links.
- `employer-*`: previous employers. The public name is accepted only where an
  `allow` entry says so (CV, career timeline, owner-approved reviews).

Optional private lists, one case-insensitive regex per line, merged so none
masks another: the `NDA_KEYWORDS` environment variable (CI secret), the
checkout's git-ignored `.nda-keywords.local`, then `~/.nda-keywords.local`
(shared by all projects). Findings show `<source>:private-<line>` only (`env`,
`repo`, `home`). Never read, print or copy a private list; build test fixtures
with a temporary `HOME`. A private pattern is never allowlisted itself: it only
stays silent on the exact characters an explicit public allow entry already
approved (a previous employer's name in the CV). Keep generic patterns
(`notion-url`) in the public config. Without any private list, the CLI prints
`NDA_PRIVATE_LIST_NOT_RUN` and the test is skipped under that name: never
report the private check as passed, and never run the gate with a fake `HOME`
to hide a private finding.

## Check a diff before publication

```bash
node scripts/security/nda-guard.mjs
node --test unit-tests/ndaGuard.test.mjs
git diff --cached --stat
```

The `nda-guard` pre-commit hook and `npm run test:unit` run the same scan on
every tracked file under the roots in the config. Then read the diff yourself
for what a keyword list cannot see: internal project or client names, customer
data, internal KPIs or incidents, internal hostnames, tickets, repositories,
screenshots and document metadata.

## Employer validation gate (security process)

Every `allow` entry declares a `scope`:

- `public-mention`: public employer name, role, period, official website;
- `personal`: the owner's own resources (personal workspace, own projects);
- `employer-data`: any non-public employer information (internal KPIs,
  projects, clients, incidents, tools, links).

Publishing `employer-data` requires that employer's explicit validation on the
PR before merge. Record it in the entry as `"approval": { "role", "employer",
"reference": "<PR URL>" }`; add an `approver` name only with that person's
consent. The guard refuses an `employer-data` entry without it. Agents never
add, widen or reclassify such an entry until the owner relays the employer
validation with its PR link, and never invent an approver, a role or a link.

## Manual review of a private finding

Like `.gitleaksignore`, `reviewed` entries in `nda-guard.json` record an
owner-reviewed line: `{ "path", "sha256", "reason" }`, where `sha256` comes from
`node scripts/security/nda-guard.mjs --fingerprint <path>:<line>`. A review
silences private-list findings on that exact line only: any edit to the line
re-opens it, and public patterns (`job-*`, `employer-*`) still need the
allowlist. Inline markers (`# nosec` style) are not used: JSON has no comments
and editing legacy HTML triggers a full formatter rewrite. Agents add a
`reviewed` entry only after the owner states in chat that this line is safe;
`unit-tests/ndaGuard.test.mjs` fails on a stale fingerprint.

## On `NDA_GUARD_FINDING <file>:<line> <pattern-id>`

1. Stop. Do not commit, push or publish.
2. Remove or anonymize the content (`XXX`, "an insurance company").
3. Never bypass the guard: no `--no-verify`, no `SKIP=nda-guard`, no test edit,
   no pattern deletion.
4. Never add or widen an `allow` entry (pattern, path or `line` regex) without
   the owner's explicit approval in chat. Each entry keeps the narrowest path
   and a `reason`.
5. Report `file:line pattern-id` only; never quote the matched text.
6. If the term already reached a pushed commit, tell the owner. Rewriting
   history is the owner's decision; agents never force-push.

## Add a term

- Job-internal term: run `node scripts/security/nda-guard.mjs --hash "<term>"`
  locally and add the printed `sha256`, `words` and, for one word, `chars`
  (substring match, like a regex without `\b`; drop it for whole-token match)
  with a neutral id. Or add it to the private list only.
- Generic tool, URL or previous employer: add a case-insensitive `regex`.

Limits: a hash matches tokens, not regexes; substring matching skips tokens
over 64 characters (encoded blobs); binary files (PDF, DOCX, images) are not
scanned; a hash hides a term from search and indexing, but anyone who guesses
the term can confirm it. The `test:unit` dot reporter hides skipped tests: run
the CLI to see the private list status.
