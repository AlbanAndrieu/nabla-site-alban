import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/homelab-health/route";
import {
	HOMELAB_HEALTH_DEFAULT_API_URL,
	homelabHealthForUrl,
	loadHomelabHealthSnapshot,
	normalizeHomelabHealthUrl,
	parseHomelabHealthSnapshot,
} from "../lib/homelabHealth";

const ORIGINAL_API_URL = process.env.HOMELAB_HEALTH_API_URL;
const ORIGINAL_FETCH = globalThis.fetch;

const VALID_SNAPSHOT = {
	schema_version: 2,
	checked_at: "2026-08-23T00:00:00Z",
	truenas: {
		state: "fail",
		public: {
			name: "TrueNAS",
			url: "https://truenas.albandrieu.com:7000/",
			reachable: false,
			http_status: 0,
			state: "fail",
			tls_trusted: null,
		},
		internal: null,
		internal_probe_enabled: false,
	},
	services: [
		{
			name: "Langfuse",
			url: "https://langfuse.albandrieu.com/",
			reachable: true,
			http_status: 200,
			state: "ok",
			tls_trusted: true,
			latency_ms: 42,
			tunnel_status: "healthy",
			tunnel_name: "homelab",
		},
	],
	internal_probes_enabled: false,
	internal_services: [],
};

function setApiUrl(value: string | undefined) {
	if (value === undefined) {
		delete process.env.HOMELAB_HEALTH_API_URL;
	} else {
		process.env.HOMELAB_HEALTH_API_URL = value;
	}
}

test.afterEach(() => {
	setApiUrl(ORIGINAL_API_URL);
	globalThis.fetch = ORIGINAL_FETCH;
});

test("homelab health parser accepts legacy and complete service-health contracts", () => {
	assert.deepEqual(parseHomelabHealthSnapshot(VALID_SNAPSHOT), VALID_SNAPSHOT);
	assert.deepEqual(
		parseHomelabHealthSnapshot({ ...VALID_SNAPSHOT, services: [] }),
		{ ...VALID_SNAPSHOT, services: [] },
	);
	assert.equal(
		parseHomelabHealthSnapshot({
			...VALID_SNAPSHOT,
			truenas: { ...VALID_SNAPSHOT.truenas, state: "unknown" },
		}),
		null,
	);
	const unknownServiceSnapshot = {
		...VALID_SNAPSHOT,
		schema_version: 4,
		services: [
			{
				...VALID_SNAPSHOT.services[0],
				id: "prometheus",
				name: "Prometheus",
				url: "https://prometheus.albandrieu.com/",
				url_derived: true,
				reachable: false,
				http_status: 0,
				state: "unknown",
			},
		],
	};
	assert.deepEqual(
		parseHomelabHealthSnapshot(unknownServiceSnapshot),
		unknownServiceSnapshot,
	);
	assert.equal(
		parseHomelabHealthSnapshot({
			...VALID_SNAPSHOT,
			services: [{ ...VALID_SNAPSHOT.services[0], http_status: "200" }],
		}),
		null,
	);
});

test("homelab health URL lookup normalizes root trailing slashes", () => {
	const snapshot = parseHomelabHealthSnapshot(VALID_SNAPSHOT);
	assert.ok(snapshot);
	assert.equal(
		normalizeHomelabHealthUrl("https://langfuse.albandrieu.com"),
		"https://langfuse.albandrieu.com/",
	);
	assert.equal(
		homelabHealthForUrl(snapshot, "https://langfuse.albandrieu.com")?.state,
		"ok",
	);
	assert.equal(
		homelabHealthForUrl(snapshot, "https://langfuse.albandrieu.com")
			?.tunnel_status,
		"healthy",
	);
});

test("homelab health prefers the FastAPI snapshot", async () => {
	setApiUrl(undefined);
	let requestedUrl = "";
	globalThis.fetch = (async (input) => {
		requestedUrl = String(input);
		return Response.json(VALID_SNAPSHOT);
	}) as typeof fetch;

	const result = await loadHomelabHealthSnapshot();

	assert.equal(requestedUrl, HOMELAB_HEALTH_DEFAULT_API_URL);
	assert.equal(result.source, "fastapi");
	assert.equal(result.snapshot?.services[0].name, "Langfuse");
	assert.equal(result.snapshot?.truenas?.state, "fail");
});

test("homelab health returns unavailable so endpoint-level fallback can run", async () => {
	setApiUrl("https://health.example.test/homelab");
	globalThis.fetch = (async () =>
		new Response("unavailable", { status: 503 })) as typeof fetch;

	const result = await loadHomelabHealthSnapshot();

	assert.equal(result.source, "unavailable");
	assert.equal(result.snapshot, null);
	assert.equal(result.primaryUrl, "https://health.example.test/homelab");
});

test("homelab health proxy exposes the FastAPI snapshot and cache policy", async () => {
	setApiUrl("https://health.example.test/homelab");
	globalThis.fetch = (async () =>
		Response.json(VALID_SNAPSHOT)) as typeof fetch;

	const response = await GET();
	const body = await response.json();

	assert.equal(response.status, 200);
	assert.equal(response.headers.get("x-homelab-health-source"), "fastapi");
	assert.equal(
		response.headers.get("x-homelab-health-primary"),
		"https://health.example.test/homelab",
	);
	assert.match(response.headers.get("cache-control") ?? "", /s-maxage=15/);
	assert.equal(body.services[0].http_status, 200);
	assert.equal(body.truenas.state, "fail");
});

test("homelab health proxy returns 503 when FastAPI is unavailable", async () => {
	setApiUrl("https://health.example.test/homelab");
	globalThis.fetch = (async () =>
		new Response("unavailable", { status: 503 })) as typeof fetch;

	const response = await GET();

	assert.equal(response.status, 503);
	assert.equal(response.headers.get("cache-control"), "no-store");
	assert.equal(response.headers.get("x-homelab-health-source"), "unavailable");
});
