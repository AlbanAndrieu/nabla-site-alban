import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

test("ZAP hook uses one request/second and Site Alban hosts only", async () => {
  const hook = await read("scripts/security/zap-rate-limit-hook.py");
  for (const pattern of [/MAX_RPS = "1"/, /www\.albanandrieu\.com/, /add_rate_limit_rule/, /groupby="rule"/, /ZAP_THROTTLE_NOT_ENABLED/, /\.vercel\.app/]) {
    assert.match(hook, pattern);
  }
  assert.doesNotMatch(hook, /bababou/);
});

test("production and Preview ZAP are bounded, redacted and fail closed on WAF challenge", async () => {
  for (const file of [".github/workflows/master-dast.yml", ".github/workflows/zap-preview.yml"]) {
    const workflow = await read(file);
    for (const pattern of [/scripts\/security\/zap-rate-limit-hook\.py/, /--hook=\/zap\/wrk\/rate-limit-hook\.py/, /-m 2/, /-T 5/, /ZAP_WAF_PREFLIGHT_BLOCK/, /ZAP_WAF_RATE_LIMIT_OR_CHALLENGE/]) {
      assert.match(workflow, pattern);
    }
    assert.doesNotMatch(workflow, /cat "\$scan_dir\/console\.log"/);
    assert.doesNotMatch(workflow, /chmod (?:0777|777)/);
    assert.doesNotMatch(workflow, /uses:\s*zaproxy\/action-baseline/);
  }
});
