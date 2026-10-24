import assert from "node:assert/strict";
import test from "node:test";
import { renderIconModule } from "../scripts/sync-homelab-icons.mjs";

const catalog = {
  version: 1,
  icons: { traefik: "🚦" },
  webAssets: { traefik: "traefik.svg", "fastapi-sample": "python-original.svg" },
};

test("sync generator uses deterministic upstream order and emits no browser CDN", () => {
  const output = renderIconModule(catalog);
  assert.match(output, /GENERATED from nabla-compose/);
  assert.ok(output.indexOf('"fastapi-sample"') < output.indexOf('"traefik"'));
  assert.match(output, /"traefik": "traefik.svg"/);
  assert.doesNotMatch(output, /https?:\/\//);
});

test("sync generator rejects missing or unsafe assets", () => {
  assert.throws(() => renderIconModule({ ...catalog, webAssets: { traefik: "missing-logo.svg" } }), /missing local icon/);
  assert.throws(() => renderIconModule({ ...catalog, webAssets: { traefik: "../secret.svg" } }), /Invalid or missing local icon/);
  assert.throws(() => renderIconModule({ ...catalog, webAssets: { "": "traefik.svg" } }), /Invalid or missing local icon/);
  assert.throws(() => renderIconModule({ ...catalog, webAssets: {} }), /No service icon/);
  assert.throws(() => renderIconModule({ ...catalog, version: 2 }), /Expected nabla-compose/);
});
