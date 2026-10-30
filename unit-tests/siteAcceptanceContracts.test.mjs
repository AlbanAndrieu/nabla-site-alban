import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateBase, summarizeReport, run } from "../scripts/measure-site-lighthouse.mjs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("bilingual SEO covers YubiKey in sitemap and reciprocal hreflang", () => {
  const source = read("tests/seo-indexing.spec.ts");
  const route = "${canonicalOrigin}/security/yubikey";
  assert.ok(source.includes(route), "sitemap expectation must cover YubiKey");
  assert.match(source, /"security\/yubikey",/);
  assert.match(source, /localized SEO pages expose self-canonical and reciprocal/);
  assert.match(source, /security\/yubikey/);
  const axe = read("tests/accessibility-axe.spec.ts");
  assert.match(axe, /\["\/security\/yubikey", "\/fr\/security\/yubikey"\]/);
  assert.match(axe, /page\.locator\("\.react-flow"\)/);
  assert.match(axe, /wcag22aa/);
});

test("Lighthouse runner refuses unsafe and ambiguous origins", () => {
  assert.equal(validateBase("http://127.0.0.1:3000"), "http://127.0.0.1:3000");
  assert.equal(validateBase("https://www.albanandrieu.com"), "https://www.albanandrieu.com");
  for (const raw of ["", "http://example.com", "https://user:secret@example.com",
    "https://example.com/fr", "https://example.com/?token=foo", "file:///tmp/page"]) {
    assert.throws(() => validateBase(raw));
  }
});

test("Lighthouse result is fail-closed for missing audits, RCE gate and HTTP errors", () => {
  const url = "https://example.com/fr/security/yubikey";
  const success = {
    finalDisplayedUrl: url,
    categories: Object.fromEntries(["performance", "accessibility", "best-practices", "seo"].map(name => [name, { score: 0.94 }])),
    audits: { "largest-contentful-paint": { numericValue: 1900 }, "cumulative-layout-shift": { numericValue: 0.01 } },
  };
  const s = summarizeReport(success, url);
  assert.equal(s.status, "PASS");
  assert.equal(s.lcpMs, 1900);
  assert.equal(s.cls, 0.01);
  assert.equal(summarizeReport({ ...success, runtimeError: { code: "ERRORED_DOCUMENT_REQUEST" } }, url).status, "BLOCKED");
  assert.equal(summarizeReport({ ...success, finalDisplayedUrl: "https://elsewhere.com/" }, url).status, "BLOCKED");
  assert.equal(summarizeReport({ ...success, audits: { "http-status-code": { score: 0 } } }, url).status, "BLOCKED");
  assert.equal(summarizeReport({ ...success, categories: {} }, url).status, "BLOCKED");
  assert.equal(summarizeReport({ ...success, categories: { ...success.categories, performance: { score: 0.35 } } }, url).status, "FAIL");
});

test("Lighthouse missing binary and invalid mode never report PASS or install packages", () => {
  assert.equal(run(["unknown"], { BASE_URL: "https://example.com" }), 2);
  assert.equal(run(["core"], { BASE_URL: "https://example.com", LIGHTHOUSE_BIN: "/missing/lighthouse" }), 3);
  const source = read("scripts/measure-site-lighthouse.mjs");
  assert.doesNotMatch(source, /npm (?:install|ci)|npx|git push|--disable-web-security/);
  assert.match(source, /LH_NOT_RUN_MISSING_CLI/);
});
