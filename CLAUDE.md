# Claude repository guidance

`/AGENTS.md` is the canonical source of repository rules. Follow it in full, including protected-branch, security, validation, publication, CI/CD and tool/context-efficiency requirements.

Use `.claude/CLAUDE.md` only as the Claude-specific adapter. Do not duplicate the repository rules here.

When a task touches frontend HTML/CSS, accessibility, responsive behavior, themes, i18n, print/PDF, SEO/crawlers, sitemap/social metadata or frontend performance, load `docs/agent-frontend-standards.md` before editing. Load only the matching skill(s) for the current task.

Node/npm commands and versions are authoritative in `package.json`; the current application architecture is Next.js 16 / React 19 / TypeScript / next-intl.
