import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const card = read("app/components/homelab/HomelabServiceCard.tsx");
const KEYS = ["privateExposureTitle", "privateEndpointTitle", "exposureToFix", "derivedUrlCheck",
  "cloudflareRouteDrift", "lanProtocolUnconfirmed"];

test("TrueNAS endpoint warnings are translated, not hardcoded in French", () => {
  for (const key of KEYS) assert.ok(card.includes('t("endpoint.' + key + '")'), key);
  assert.doesNotMatch(card, /Accès Internet non souhaité|exposition à corriger|URL dérivée, à vérifier/);
  assert.match(card, /!readOnly && endpointEnabled && endpointUrl/);
  assert.match(card, /data-owner-lan-route-mismatch/);
});

test("FR and EN share the same endpoint warning keys", () => {
  const en = JSON.parse(read("messages/homelab/en.json")).homelab.endpoint;
  const fr = JSON.parse(read("messages/homelab/fr.json")).homelab.endpoint;
  assert.deepEqual(Object.keys(en).sort(), Object.keys(fr).sort());
  for (const key of KEYS) {
    assert.ok(en[key]?.length > 10, "en." + key);
    assert.ok(fr[key]?.length > 10, "fr." + key);
  }
});
