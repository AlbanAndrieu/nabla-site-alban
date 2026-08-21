# GitHub Copilot adapter

Use the repository-wide instructions in `AGENTS.md` as the canonical source of truth.

For specialized tasks, discover and load only the relevant skill from `.agents/skills/*/SKILL.md`.

Copilot-specific rules:
- Do not duplicate repository standards here; update `AGENTS.md` instead.
- Prefer existing Next.js/React/TypeScript patterns over introducing parallel implementations.
- Preserve accessibility, responsive/mobile-first behavior, next-intl i18n, SEO metadata, theme behavior, and tests when relevant.
- Follow the validation workflow and push gates defined in `AGENTS.md`.
