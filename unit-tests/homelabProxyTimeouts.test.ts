import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("homelab status proxy allows the same cold-probe window as health diagnostics", async () => {
	const statusSource = await readFile(
		new URL("../lib/homelabStatus.ts", import.meta.url),
		"utf8",
	);
	const healthSource = await readFile(
		new URL("../lib/homelabHealth.ts", import.meta.url),
		"utf8",
	);

	assert.match(statusSource, /const PRIMARY_TIMEOUT_MS = 8_000;/);
	assert.match(healthSource, /const PRIMARY_TIMEOUT_MS = 8_000;/);
	assert.doesNotMatch(statusSource, /const PRIMARY_TIMEOUT_MS = 2500;/);
});
