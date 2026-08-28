# GitHub Copilot instructions

`/AGENTS.md` is the canonical source of repository rules. Follow it in full; do not duplicate or weaken its protected-branch, security, privacy, quality-gate, test, hook, publication, CI/CD, release or tool/context-efficiency requirements here.

Keep default context targeted. Do not recursively enumerate agent/vendor directories or preload all skills. Load only the files/ranges and matching skill(s) required by the current task.

Before changing frontend HTML/CSS, accessibility, responsive behavior, theme handling, i18n, print/PDF, SEO/crawler policy, sitemap/social metadata or frontend performance, read `docs/agent-frontend-standards.md`. Those detailed standards remain mandatory when applicable.

For Next.js work, read only the relevant installed guide under `node_modules/next/dist/docs/`. Node/npm commands and constraints are authoritative in `package.json`.
