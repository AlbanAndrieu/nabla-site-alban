import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("architecture operational evidence exposes observed TrueNAS WebSocket transport without a second poll owner", async () => {
	const [transport, operational] = await Promise.all([
		readFile(
			"app/components/homelab/HomelabOperationalTrueNasTransport.tsx",
			"utf8",
		),
		readFile("app/components/homelab/HomelabOperationalEvidence.tsx", "utf8"),
	]);

	assert.match(transport, /readHomelabOperatorDiagnostics/);
	assert.match(
		transport,
		/data-observed-truenas-api-transport="websocket-jsonrpc"/,
	);
	assert.match(transport, /transport\.websocketUri/);
	assert.doesNotMatch(transport, /fetch\(/);
	assert.match(operational, /HomelabOperationalTrueNasTransport/);
	assert.match(
		operational,
		/<HomelabOperationalTrueNasTransport evidence=\{evidence\} \/>/,
	);
});
