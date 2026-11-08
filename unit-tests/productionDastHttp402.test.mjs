import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
	new URL("../.github/workflows/master-dast.yml", import.meta.url),
	"utf8",
);

test("Vercel 402 blocks DAST before ZAP and keeps the security gate failed", () => {
	assert.match(workflow, /if \[\[ "\$status" == "402" \]\]; then/);
	assert.match(workflow, /DAST_BLOCKER=vercel-http-402/);
	assert.match(workflow, /VERCEL_DAST_HTTP_402/);
	assert.match(
		workflow,
		/if \[\[ "\$DAST_BLOCKER" == "vercel-http-402" \]\]; then\s+STATE=failure/,
	);
	assert.match(workflow, /DESCRIPTION='Production DAST blocked: Vercel HTTP 402'/);
	assert.match(workflow, /echo "::error::VERCEL_DAST_HTTP_402/);
	assert.match(workflow, /exit 1/);
	assert.match(workflow, /zap-baseline\.py/);
});
