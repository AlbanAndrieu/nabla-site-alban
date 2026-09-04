# Copilot instructions — legacy static assets

Follow `/AGENTS.md` first. The primary application is Next.js on Vercel; `public/` contains static assets and a shrinking set of legacy HTML documents kept only while migration/parity contracts require them.

- Do not introduce a second deployment runtime for `public/`.
- Wrangler/Cloudflare Workers deployment configuration is intentionally absent.
- Use `npm run start:python` only when a static-only local server is specifically useful.
- Preserve `public/404.html` as the protected global 404 rendering source required by `AGENTS.md`.
- Preserve legacy D3 v3 assets only for HTML documents that still consume them; do not re-add the npm `d3` package without a current application consumer.
- Reuse shared CSS/theme conventions, semantic landmarks, keyboard accessibility and responsive behavior.
- For any page being migrated to Next.js, prove route/content/SEO/accessibility parity before deleting the legacy source.
