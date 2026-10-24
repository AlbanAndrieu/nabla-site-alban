import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { HOMELAB_CATALOG_ICON_FILES, homelabCatalogIconSrc, homelabServiceIconSrc } from "../lib/homelabCatalogIcons.ts";

// The COMPLETE inventory coverage test belongs to the nabla-compose catalog.
// Do not duplicate a snapshot of service IDs inside this repository.
test("every generated icon alias resolves to a real bundled asset", () => {
  assert.ok(Object.keys(HOMELAB_CATALOG_ICON_FILES).length > 0);
  for (const [id, filename] of Object.entries(HOMELAB_CATALOG_ICON_FILES)) {
    assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.match(filename, /^[a-zA-Z0-9._-]+\.(svg|png|jpg)$/);
    const path = homelabCatalogIconSrc(id);
    assert.equal(path, "assets/selfh-icons/" + filename);
    assert.equal(existsSync(new URL("../public/" + path, import.meta.url)), true, id + " -> " + path);
  }
});

test("subcomponents use the official family mapping without generic fallbacks", () => {
  assert.equal(homelabCatalogIconSrc("defectdojo-api"), homelabCatalogIconSrc("defectdojo"));
  assert.equal(homelabCatalogIconSrc("openrag-parser"), homelabCatalogIconSrc("openrag"));
  assert.equal(homelabCatalogIconSrc("opensearch-exporter"), "assets/selfh-icons/opensearch.svg");
  assert.equal(homelabCatalogIconSrc("op-connect-sync"), "assets/selfh-icons/opconnect.svg");
  assert.equal(homelabCatalogIconSrc("fastapi-sample"), "assets/selfh-icons/python-original.svg");
});

test("FastAPI cannot override the canonical local icon with a remote or stale URL", () => {
  assert.equal(homelabServiceIconSrc("traefik", "assets/selfh-icons/traefik.png"), "assets/selfh-icons/traefik.svg");
  assert.equal(homelabServiceIconSrc("joplin", "assets/selfh-icons/joplin.png"), "assets/selfh-icons/joplin.svg");
  assert.equal(homelabServiceIconSrc("unknown-service", "https://evil.example/logo.svg"), "assets/selfh-icons/generic-app.svg");
  assert.equal(homelabServiceIconSrc("unknown-service", "assets/selfh-icons/grafana.png"), "assets/selfh-icons/generic-app.svg");
});
