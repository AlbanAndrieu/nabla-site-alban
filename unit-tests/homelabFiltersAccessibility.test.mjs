import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const filters = read("app/components/homelab/HomelabServiceFilters.tsx");

test("Backstage V2 filters announce result count and retain accessible controls", () => {
  assert.match(filters, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(filters, /presentation\.filters\.resultCount/);
  for (const marker of ["data-homelab-health-select", "data-homelab-environment-filter", "data-homelab-service-search"]) {
    assert.ok(filters.includes(marker), marker);
  }
  assert.doesNotMatch(filters, /\bfrench\b/);
});

test("FR/EN filter labels share the same non-empty next-intl contract", () => {
  const en = JSON.parse(read("messages/homelab/en.json")).homelab.presentation.filters;
  const fr = JSON.parse(read("messages/homelab/fr.json")).homelab.presentation.filters;
  assert.deepEqual(Object.keys(en).sort(), Object.keys(fr).sort());
  for (const locale of [en, fr]) {
    for (const key of ["title", "refreshing", "probesUnverified", "healthAll", "environmentNonDev", "reset", "resultCount"]) {
      assert.ok(locale[key]?.length > 0, key);
    }
    assert.deepEqual(Object.keys(locale.chips).sort(), ["fail", "ok", "unknown", "warn"]);
    assert.deepEqual(Object.keys(locale.healthOptions).sort(), ["fail", "ok", "unknown", "warn"]);
    assert.match(locale.resultCount, /\{shown\}.*\{total\}/);
  }
});
