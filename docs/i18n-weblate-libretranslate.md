# Internationalization workflow (Next.js + next-intl + Weblate + LibreTranslate)

Default locale is English (`en`) and French (`fr`) is the first translated locale.

## Runtime i18n architecture

`next-intl` routing is defined in `i18n/routing.ts` with `locales: ["en", "fr"]`, `defaultLocale: "en"`, and `localePrefix: "as-needed"`. That means default English uses paths like `/checkout`, while French uses `/fr/checkout`.

`middleware.ts` applies locale negotiation to non-asset routes only (`/((?!api|_next|_vercel|.*\\..*).*)`).

`i18n/request.ts` loads `messages/<locale>.json` and falls back to English for unsupported locale values.

UI strings are stored in:

- `messages/en.json`
- `messages/fr.json`

## Localized `public/` HTML bridge

Locale-aware pages (`app/[locale]/page.tsx`, `app/[locale]/[slug]/page.tsx`, `app/[locale]/checkout/page.tsx`) load fragments through `lib/htmlFromPublic.ts`.

Resolution order for HTML sources:

1. `public/locales/fr/<page>.html` (for French only)
2. `public/<page>.html` fallback

`rewriteLegacyHtmlHrefs()` rewrites internal `.html` links to extensionless Next.js routes and prefixes French links with `/fr` when needed.

## Weblate integration

Use `messages/*.json` as source files in Weblate:

- source language: `en`
- target language: `fr`
- file mask: `messages/*.json`

Recommended component setup in Weblate:

- Add one JSON component pointing to `messages/en.json`.
- Configure French translation output as `messages/fr.json`.
- Enable commit synchronization back to this repository.

## LibreTranslate pre-translation

The repository includes `scripts/translate-with-libretranslate.mjs` to pre-fill French JSON from English.

Environment variables:

- `LIBRETRANSLATE_URL` (default: `https://libretranslate.com/translate`)
- `LIBRETRANSLATE_API_KEY` (optional)

Command:

- `npm run i18n:libretranslate`

Current behavior (verified against script implementation):

- Reads `messages/en.json`
- Flattens nested object keys
- Calls LibreTranslate once per leaf value
- Rewrites the full `messages/fr.json` file from translated English source

Important constraint: this script does not merge with existing French strings. Any manual French edits in `messages/fr.json` are overwritten on each run.

## Add more localized HTML pages

To localize a static page:

1. Keep source in `public/<page>.html`
2. Add French override in `public/locales/fr/<page>.html`
3. Keep structural markup and script wiring aligned with the source page

The app will automatically serve the French variant on `/fr/...` when the localized file exists.
