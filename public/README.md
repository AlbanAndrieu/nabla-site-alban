# Public assets and legacy pages

`public/` is the static asset directory of the repository-root **Next.js** application.

It contains CSS, browser scripts, images and a shrinking set of legacy HTML documents that remain available while their Next.js replacements are validated.

## Runtime contract

- Vercel Git Integration deploys the repository-root Next.js application.
- `public/` is served by Next.js/Vercel as static assets; it is **not** a separate deployment target.
- Wrangler/Cloudflare Workers deployment configuration is intentionally absent.
- `npm run start:python` is only a local static-asset/legacy-page diagnostic helper.
- `public/404.html` is the protected rendering source for the global 404 exception documented in `AGENTS.md`.

## Migration rule

New application pages belong under `app/`, not as new standalone HTML files in `public/`.

Do not remove an existing legacy page solely because a Next.js route exists. First prove the required content, behavior, visual, SEO/metadata, accessibility and route-test parity, subject to the explicit protected 404 exception.
