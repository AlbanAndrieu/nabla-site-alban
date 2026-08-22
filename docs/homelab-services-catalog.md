# Homelab services catalog migration

The homelab services catalog is being moved from this website repository to `fastapi-sample`.

## Transition architecture

The website currently keeps `public/homelab-services.json` as the independent fallback source while trying FastAPI first.

Primary source:

- `https://fastapi-sample.fastapicloud.dev/api/homelab-services`
- override with the server-side `HOMELAB_SERVICES_API_URL` environment variable when needed

Fallback source:

- repository file `public/homelab-services.json`

The primary request has a short timeout and the returned payload is validated before use. HTTP errors, timeouts, invalid JSON, an empty service list, or malformed service entries cause an immediate fallback to the repository catalog.

The same JSON contract is expected from FastAPI:

```json
{
  "version": 1,
  "services": [
    {
      "name": "Example",
      "tunnelUrl": "https://example.albandrieu.com",
      "external": true
    }
  ]
}
```

Additional service fields remain forward-compatible; every service must at least contain a non-empty `name`.

## Website integration

- `lib/homelabServices.ts` owns source selection, timeout, validation, and fallback.
- the App Router TrueNAS grid uses that loader directly on the server.
- `GET /api/homelab-services` exposes the same selected catalog to browser-side/legacy consumers without requiring cross-origin CORS access to FastAPI.
- response header `X-Homelab-Services-Source` is `fastapi` or `local-fallback`, which makes the active source observable.

`/homelab-services.json` intentionally remains a real static file during the migration. Do not rewrite it to FastAPI yet: the current `fastapi-sample` homelab catalog code still reads that URL, so keeping it independent avoids a FastAPI → website → FastAPI dependency loop.

## Final migration

Before deleting `public/homelab-services.json` from this repository:

1. Move the catalog data into `fastapi-sample` and expose `GET /api/homelab-services` without reading it back from this website.
2. Update the existing FastAPI `homelab_catalog.py` health/sick checks to consume the new local FastAPI catalog source rather than `https://www.albanandrieu.com/homelab-services.json`.
3. Verify the website returns `X-Homelab-Services-Source: fastapi` in normal operation.
4. Exercise the failure path and confirm the site still renders from the repository fallback.
5. Only then remove the repository JSON and replace the temporary fallback with the chosen long-term resilience strategy (for example last-known-good cache or bundled generated artifact).
