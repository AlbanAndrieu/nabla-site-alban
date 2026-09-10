import assert from "node:assert/strict";
import test from "node:test";
import { parseFastApiHealthBoard } from "../lib/fastApiHealthBoard";
import { parseHomelabOperationalEvidence } from "../lib/homelabOperationalEvidence";

test("unconfirmed Cloudflare control-plane evidence does not become a failure", () => {
	const board = parseFastApiHealthBoard({
		schema_version: 1,
		state: "fresh",
		refreshing: false,
		generated_at: "2026-09-10T17:21:12Z",
		age_seconds: 2,
		error: null,
		runtime: null,
		healthz: {},
		homelab: {
			components_status: "healthy",
			components: {
				truenas: { reachable: true, state: "ok" },
				pfsense: { reachable: true, state: "ok" },
				cloudflare: {
					reachable: null,
					state: "unknown",
					status_confirmed: false,
					severity: "warning",
					effective_state: "warn",
					warning:
						"⚠️ Cloudflare global status could not be confirmed; control-plane data is unavailable, stale, or the probe timed out.",
					last_known_reachable: true,
				},
			},
			services: [],
		},
	});
	assert.ok(board);

	const evidence = parseHomelabOperationalEvidence(board);
	const cloudflare = evidence.components.find(
		(component) => component.id === "cloudflare",
	);
	assert.ok(cloudflare);
	assert.equal(cloudflare.state, "unknown");
	assert.equal(cloudflare.reachable, null);
	assert.notEqual(evidence.troubleshootingFocus, "cloudflare");
	assert.equal(evidence.componentsStatus, "healthy");
});
