import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../scripts/diagnose-homelab-429.mjs", import.meta.url), "utf8");

test("triage makes one Site and one FastAPI GET without redirects or retries", () => {
  assert.match(source, /\/api\/homelab-access\?diagnose=1/);
  assert.match(source, /https:\/\/fastapi-sample\.fastapicloud\.dev\/livez/);
  assert.match(source, /redirect: "manual"/);
  assert.doesNotMatch(source, /x-forwarded-for|x-real-ip|set-cookie|response\.text\(/i);
  assert.match(source, /if \(site === 429\)/);
});
test("trace of diagnostic cannot pass Site JWT to FastAPI", () => {
  assert.match(source, /auditHeadersForUrl\(url, origin.origin, jwt/);
  assert.match(source, /const fastapi = await observe\("FASTAPI_LIVEZ",/);
  assert.match(source, /process.exitCode = 4/);
});
