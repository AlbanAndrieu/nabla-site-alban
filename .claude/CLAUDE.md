# Claude project context

Follow `/AGENTS.md` as the canonical repository guidance.

Keep the default context minimal: search first, read only relevant files/ranges, and avoid generated/vendor files. Load `.claude/skills` only when a skill directly matches the task.

For Next.js changes, consult only the relevant installed Next.js documentation page on demand. For CI failures, start from the failing job/step and changed files.

Prefer targeted validation before the full quality gate.