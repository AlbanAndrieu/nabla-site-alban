# Claude project context

Follow `/AGENTS.md` as the canonical repository guidance.

Keep default context minimal: search first, read only relevant files/ranges, and avoid generated/vendor files. Load `.claude/skills` only when a skill directly matches the task.

For Next.js changes, locate and read only the relevant installed guide under `node_modules/next/dist/docs/`; `agentRules: false` intentionally prevents `next dev` from injecting the full docs index into agent files.

For CI failures, start from the failing job/step and changed files. Prefer targeted validation before the full quality gate.
