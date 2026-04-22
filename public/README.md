# Public web root

This directory is the **static site root** for the project: HTML, CSS, client scripts, and assets served by Vercel, Cloudflare, or a local static file server (`public/` is the document root).

## Layout

Typical layout:

```
public/
├── index.html, *.html
├── theme.css, …
├── assets/
├── cv/
└── …
```

Add new pages and static assets here unless they belong to a separate app (for example `my-app/` for Next.js).
