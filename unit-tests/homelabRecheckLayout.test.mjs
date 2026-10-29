import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
	readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("layout height is measured in memory only, never persisted or copied from OWNER markup", () => {
	const hook = read("app/components/homelab/useAuthorizedLayoutHold.ts");
	assert.match(hook, /getBoundingClientRect\(\)\.height/);
	assert.match(hook, /new ResizeObserver\(measure\)/);
	assert.match(hook, /setReservedHeight/);
	assert.doesNotMatch(
		hook,
		/localStorage|sessionStorage|innerHTML|textContent|fetch\(/,
	);
});

test("TrueNAS and Architecture use neutral height placeholders while authorization is pending", () => {
	const sources = [
		read("app/components/homelab/HomelabPrivateServices.tsx"),
		read("app/components/truenas/HomeLabPrivateNetwork.tsx"),
		read("app/[locale]/architecture/ArchitecturePrivateViews.tsx"),
	];
	for (const src of sources) {
		assert.match(src, /useAuthorizedLayoutHold\(/);
		assert.match(src, /access === "pending"/);
		assert.match(src, /data-homelab-access-rechecking\s+aria-hidden="true"/);
		assert.match(src, /minHeight: reservedHeight/);
		assert.match(src, /data-homelab-access-region/);
		assert.match(src, /data-homelab-private-view/);
	}
	assert.match(sources[0], /if \(access === "denied"\)/);
	assert.match(sources[1], /if \(access !== "trusted"\) return null/);
	assert.match(sources[2], /return access === "pending"/);
	assert.match(sources[2], /visible && status === "ready"/);
});

test("two-cycle browser regression is opt-in and does not bypass Access", () => {
	const source = read("tests/ops-homelab-recheck-layout.spec.ts");
	assert.match(source, /OPS_E2E_ENABLED !== "YES"/);
	assert.match(source, /for \(let cycle = 0; cycle < 2; cycle \+= 1\)/);
	assert.match(source, /route\.continue\(\)/);
	assert.doesNotMatch(
		source,
		/x-forwarded-for|x-vercel-protection-bypass|cf-access-client-secret/i,
	);
	assert.match(source, /toHaveCount\(0\)/);
});
