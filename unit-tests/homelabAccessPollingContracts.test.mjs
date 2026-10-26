import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../app/components/homelab/useHomelabAccess.ts", import.meta.url), "utf8");

test("access UI rechecks server after visibility/focus and on interval", () => {
	assert.match(source, /window\.setInterval\(\(\) => refresh\(\), ACCESS_RECHECK_MS\)/);
	assert.match(source, /document\.addEventListener\("visibilitychange", onVisibilityChange\)/);
	assert.match(source, /window\.addEventListener\("focus", onVisibilityOrFocus\)/);
	assert.match(source, /accessProbe\.check\(onFocus\)/);
	assert.match(source, /window\.clearInterval\(interval\)/);
	assert.match(source, /document\.removeEventListener\("visibilitychange", onVisibilityChange\)/);
	assert.match(source, /window\.removeEventListener\("focus", onVisibilityOrFocus\)/);
});

test("access UI hides OWNER while checking and only revokes public cache for explicit denial", () => {
	assert.match(source, /if \(accessProbe\.shouldRecheck\(onFocus\)\) setState\("pending"\)/);
	assert.match(source, /if \\(access === "denied"\\) clearPublishedCacheOnExplicitDenial\\(\\)/);
	assert.match(source, /\\[401, 403, 404\\]\\.includes\\(response\\.status\\)/);
	assert.match(source, /signal: AbortSignal\\.timeout\\(5_000\\)/);
	assert.doesNotMatch(source, /if \\(access === "denied"\\) \\{\\s*try \\{/);
	assert.match(source, /clearPublicHomelabBrowserCache\(window\.localStorage\)/);
	assert.match(source, /if \(!active\) return/);
	assert.match(source, /cache: "no-store"/);
	assert.match(source, /credentials: "same-origin"/);
});
