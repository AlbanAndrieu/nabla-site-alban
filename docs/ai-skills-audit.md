# AI skills audit

Canonical skill location: `.agents/skills/`. The repository targets Cursor, OpenCode, Codex, and GitHub Copilot. Skills should use progressive disclosure: narrow frontmatter for discovery, concise workflow in `SKILL.md`, and references/tool help only when selected.

| Skill | Relevance | Trigger quality | Context cost | Decision |
| --- | --- | --- | --- | --- |
| `agent-browser` | High for UI/QA | Good but broad | Low | Keep. It is already a compact discovery stub and delegates version-specific instructions to the CLI. |
| `next-dev-loop` | High | Good | Medium | Keep. Strong runtime verification workflow; only activates for Next.js runtime verification. |
| `next-cache-components-adoption` | Conditional | Excellent | Very high | Keep on demand. Do not move its long migration procedure into `AGENTS.md`; consult only during Cache Components adoption. |
| `next-cache-components-optimizer` | Conditional | Excellent | Medium + references | Keep on demand. Its sub-loop references provide appropriate progressive disclosure. |
| `stripe-best-practices` | High because the app integrates Stripe | Good | Low + references | Keep. Domain references are already split out and should be loaded selectively. |
| `upgrade-stripe` | Conditional | Good | Medium | Keep on demand. Scope is distinct from integration design; use only for API/SDK upgrades. |
| `stripe-directory` | Low for application development | Previously over-broad | Previously high | Keep but narrow. Trigger only for explicit Stripe Directory/MPP discovery; condensed to CLI-backed workflow. |
| `stripe-projects` | Low/conditional | Previously over-broad | Previously high | Keep but narrow. Trigger only for explicit Stripe Projects provisioning; condensed to CLI-backed workflow. |

## Findings

### 1. Canonical source is already correct

`.agents/skills/` contains the real skill directories. Tool-specific skill trees found elsewhere in the repository are compatibility links/adapters and must not become independent copies. New skills belong in `.agents/skills/<name>/SKILL.md`.

### 2. Avoid false-positive skill activation

The largest token risk is not the number of installed skills but broad discovery descriptions that cause irrelevant skills to load. `stripe-directory` previously claimed essentially every vendor-search request and `stripe-projects` claimed generic database/auth/hosting/API-key requests. Their triggers are now explicitly Stripe-scoped.

### 3. Large skills are acceptable only with narrow triggers

`next-cache-components-adoption` is intentionally detailed. Its frontmatter is narrowly scoped, so the body should remain unloaded for ordinary Next.js work. Do not summarize or duplicate it in always-on rules.

### 4. Prefer live/version-matched documentation

`agent-browser` is the preferred pattern: a small stable skill delegates command details to `agent-browser skills get ...`. Next.js work similarly uses the version-matched docs bundled in `node_modules/next/dist/docs/`. Static skills should focus on workflow and project decisions, not duplicate full external documentation.

### 5. Repository policy

- `AGENTS.md`: small, always-on, cross-agent policy.
- `.agents/skills/`: canonical specialized workflows loaded on demand.
- `.github/copilot-instructions.md`: thin Copilot adapter only.
- Tool-specific skill directories: compatibility links only when required by a tool.
- Never add the same skill body to multiple agent directories.
- Keep skill `description` precise enough to avoid accidental activation.
- Put large reference material in `references/` and load only the relevant file.

## Follow-up

Audit and remove compatibility skill links for agents that are not used, while retaining only the locations required by Cursor, OpenCode, Codex, and Copilot. This reduces repository noise and prevents future tooling from treating compatibility trees as independent sources.