import assert from "node:assert/strict";
import test from "node:test";
import { homelabIconFallback } from "../lib/homelabIconFallback.ts";

test("fallback is deterministic for stable Backstage identities", () => {
  assert.deepEqual(homelabIconFallback("defectdojo-api", "DefectDojo API"), homelabIconFallback("defectdojo-api", "DefectDojo API"));
});

test("multi-word names use recognisable initials", () => {
  assert.equal(homelabIconFallback("homeassistant", "Home Assistant").label, "HA");
  assert.equal(homelabIconFallback("dependency-track", "Dependency Track").label, "DT");
});

test("single-word brands remain non-empty and bounded", () => {
  assert.equal(homelabIconFallback("grafana", "Grafana").label, "GRA");
  assert.equal(homelabIconFallback("some", "").label, "SOM");
  assert.equal(homelabIconFallback("", "").label, "?");
});

test("fallback colors vary by service ID and are CSS-safe", () => {
  const a = homelabIconFallback("grafana", "Grafana");
  const b = homelabIconFallback("traefik", "Grafana");
  assert.notEqual(a.backgroundColor, b.backgroundColor);
  assert.match(a.backgroundColor, /^hsl\([0-9]{1,3} 48% 28%\)$/);
});

test("untrusted service names never become markup or external URLs", () => {
  const fallback = homelabIconFallback("service", '<img src="https://evil.example" onerror="alert(1)">');
  assert.match(fallback.label, /^[\p{L}\p{N}?]{1,3}$/u);
  assert.equal(fallback.backgroundColor.includes("evil"), false);
});

test("Unicode names are bounded without breaking surrogate pairs", () => {
  const result = homelabIconFallback("custom", "Énergie Réseau");
  assert.equal(result.label, "ÉR");
  assert.ok(Array.from(result.label).length <= 3);
});
