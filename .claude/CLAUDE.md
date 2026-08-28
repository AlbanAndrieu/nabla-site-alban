# Claude project context

Follow `/AGENTS.md` as the canonical repository guidance.

Keep default context minimal: search first, read only relevant files/ranges, and avoid generated/vendor files. Load `.claude/skills` only when a skill directly matches the task.

For frontend/accessibility/i18n/SEO/print work, load `docs/agent-frontend-standards.md` on demand. For Next.js-specific work, locate and read only the relevant installed guide under `node_modules/next/dist/docs/`; do not generate or load broad framework documentation indexes by default.

For CI failures, follow the progressive workflow in `/AGENTS.md`: status → failed job → failed step → targeted logs → richer artifacts only when needed.
