import assert from "node:assert/strict";
import test from "node:test";
import {
	cloudflareStatusIsUnconfirmed,
	cloudflareUnconfirmedReason,
	parseCloudflareControlPlaneStatus,
} from "../lib/cloudflareStatus";
import type { HomelabHealthEntry } from "../lib/homelabHealth";
import { homelabServiceSignals } from "../lib/homelabServiceSignals";

test("Cloudflare empty tunnel inventory remains unknown while preserving API evidence", () => {
	const status = parseCloudflareControlPlaneStatus({
		components: {
			cloudflare: {
				state: "unknown",
				reachable: null,
				api_reachable: true,
				http_status: 200,
				status_confirmed: false,
				error_kind: "empty_inventory",
				warning: "Cloudflare global status could not be confirmed",
				last_known_reachable: true,
			},
		},
	});

	assert.equal(status.apiReachable, true);
	assert.equal(status.httpStatus, 200);
	assert.equal(status.statusConfirmed, false);
	assert.equal(status.lastKnownReachable, true);
	assert.equal(cloudflareStatusIsUnconfirmed(status), true);
	assert.match(cloudflareUnconfirmedReason(status, false), /token scope/);
});

test("confirmed Cloudflare failure is not mislabeled as uncertainty", () => {
	const status = parseCloudflareControlPlaneStatus({
		components: {
			cloudflare: {
				state: "fail",
				reachable: false,
				status_confirmed: true,
			},
		},
	});
	assert.equal(cloudflareStatusIsUnconfirmed(status), false);
});

test("service signal model separates public, dependency, Cloudflare, TLS and probe state", () => {
	const entry: HomelabHealthEntry = {
		id: "example",
		name: "Example",
		url: "https://example.albandrieu.com/",
		reachable: true,
		http_status: 200,
		state: "warn",
		local_state: "ok",
		effective_state: "warn",
		direct_state: "ok",
		internal_state: "ok",
		runtime_state: "RUNNING",
		runtime_reachable: true,
		required_dependencies: ["postgres", "redis"],
		dependency_state: "warn",
		degraded_by: ["redis"],
		cloudflare_status_confirmed: false,
		tunnel_status: "healthy",
		tls_trusted: true,
		probe_source: "memory",
		probe_age_seconds: 42,
		probe_interval_seconds: 120,
		next_probe_in_seconds: 78,
	};
	const signals = new Map(
		homelabServiceSignals(entry).map((signal) => [signal.id, signal]),
	);

	assert.equal(signals.get("public")?.state, "ok");
	assert.equal(signals.get("internal")?.state, "ok");
	assert.equal(signals.get("runtime")?.state, "ok");
	assert.equal(signals.get("dependencies")?.state, "warn");
	assert.match(signals.get("dependencies")?.detail ?? "", /degraded: redis/);
	assert.equal(signals.get("cloudflare")?.state, "unknown");
	assert.equal(signals.get("tls")?.state, "ok");
	assert.equal(signals.get("probe")?.state, "warn");
});
