import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/homelab-health/route";
import {
	HOMELAB_HEALTH_DEFAULT_API_URL,
	HOMELAB_PROBES_DEFAULT_API_URL,
	homelabHealthForUrl,
	loadHomelabHealthSnapshot,
	loadHomelabProbeSnapshot,
	normalizeHomelabHealthUrl,
	parseHomelabHealthSnapshot,
} from "../lib/homelabHealth";

const ORIGINAL_API_URL = process.env.HOMELAB_HEALTH_API_URL;
const ORIGINAL_PROBES_API_URL = process.env.HOMELAB_PROBES_API_URL;
const ORIGINAL_BOARD_API_URL = process.env.HOMELAB_HEALTH_BOARD_API_URL;
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
	probe_summary: {
		public: {
			scope: "public",
			enabled: true,
			scheduled: 1,
			completed: 1,
			timed_out: 0,
			budget_seconds: 4,
			per_probe_timeout_seconds: 5,
			max_concurrency: 4,
			elapsed_ms: 42,
			states: { ok: 1, warn: 0, fail: 0 },
		},
		internal: {
			scope: "internal",
			enabled: false,
			scheduled: 0,
			completed: 0,
			timed_out: 0,
			budget_seconds: 4,
			per_probe_timeout_seconds: 5,
			max_concurrency: 4,
			elapsed_ms: 0,
			states: { ok: 0, warn: 0, fail: 0 },
		},
		catalog_service_count: 72,
	},
};

function setProbesApiUrl(value: string | undefined) {
	if (value === undefined) {
		delete process.env.HOMELAB_PROBES_API_URL;
	} else {
		process.env.HOMELAB_PROBES_API_URL = value;
	}
}

function setApiUrl(value: string | undefined) {
	if (value === undefined) {
		delete process.env.HOMELAB_HEALTH_API_URL;
	} else {
		process.env.HOMELAB_HEALTH_API_URL = value;
	}
}

function setBoardApiUrl(value: string | undefined) {
	if (value === undefined) {
		delete process.env.HOMELAB_HEALTH_BOARD_API_URL;
	} else {
		process.env.HOMELAB_HEALTH_BOARD_API_URL = value;
	}
}

test.afterEach(() => {
	setApiUrl(ORIGINAL_API_URL);
	setProbesApiUrl(ORIGINAL_PROBES_API_URL);
	setBoardApiUrl(ORIGINAL_BOARD_API_URL);
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
});

test("homelab health parser accepts sampled probe/cache/reconciliation metadata from FastAPI schema 6", () => {
	const future = {
		...VALID_SNAPSHOT,
		schema_version: 6,
		probe_summary: {
			public: {
				...VALID_SNAPSHOT.probe_summary.public,
				eligible: 71,
				sampled: 12,
				scheduled: 12,
				rotating_sample: true,
				per_probe_timeout_seconds: 3,
			},
			internal: {
				...VALID_SNAPSHOT.probe_summary.internal,
				enabled: true,
				eligible: 71,
				sampled: 12,
				scheduled: 12,
				completed: 12,
				rotating_sample: true,
				per_probe_timeout_seconds: 1,
			},
			catalog_service_count: 72,
			sampling: {
				strategy: "priority-plus-rotating-window",
				cache_ttl_seconds: 30,
			},
		},
		probe_cache: {
			source: "memory",
			age_seconds: 12.4,
			ttl_seconds: 30,
			stale: false,
		},
		reconciliation: {
			provider_reads_reused: true,
			truenas_runtime_source: "health_api",
		},
	};

	const parsed = parseHomelabHealthSnapshot(future);
	assert.ok(parsed);
	assert.equal(parsed.probe_summary?.internal?.eligible, 71);
	assert.equal(parsed.probe_summary?.internal?.sampled, 12);
	assert.equal(parsed.probe_summary?.internal?.rotating_sample, true);
	assert.equal(parsed.probe_summary?.internal?.per_probe_timeout_seconds, 1);
	assert.equal(
		parsed.probe_summary?.sampling?.strategy,
		"priority-plus-rotating-window",
	);
	assert.equal(parsed.probe_cache?.source, "memory");
	assert.equal(parsed.probe_cache?.age_seconds, 12.4);
	assert.equal(parsed.reconciliation?.provider_reads_reused, true);
	assert.equal(parsed.reconciliation?.truenas_runtime_source, "health_api");
});

test("homelab health parser drops malformed service rows without discarding valid TrueNAS evidence", () => {
	const snapshot = {
		...VALID_SNAPSHOT,
		schema_version: 4,
		truenas: {
			...VALID_SNAPSHOT.truenas,
			state: "warn",
			public: {
				...VALID_SNAPSHOT.truenas.public,
				reachable: true,
				http_status: 200,
				state: "ok",
				tls_trusted: true,
			},
			api: {
				reachable: false,
				error: "HTTP 503 while TrueNAS is rebooting",
			},
		},
		truenas_runtime_reachable: false,
		truenas_runtime_stale: false,
		cloudflare_configured: true,
		cloudflare_tunnels_observed: 2,
		services: [
			{
				...VALID_SNAPSHOT.services[0],
				id: "garage",
				name: "Garage",
				url: "https://garage.int.albandrieu.com/",
				reachable: true,
				http_status: 503,
				state: "fail",
				direct_state: "fail",
				runtime_state: "STOPPED",
				runtime_app: "garage",
				runtime_reachable: true,
			},
			{
				id: "prometheus-albandrieu",
				name: "Prometheus - albandrieu",
				url: "https://prometheus - albandrieu.albandrieu.com/",
				reachable: false,
				http_status: 0,
				state: "unknown",
			},
		],
	};

	const parsed = parseHomelabHealthSnapshot(snapshot);
	assert.ok(parsed);
	assert.equal(parsed.truenas?.public?.state, "ok");
	assert.equal(parsed.truenas?.api?.reachable, false);
	assert.equal(parsed.truenas_runtime_reachable, false);
	assert.equal(parsed.services.length, 1);
	assert.equal(parsed.services[0].id, "garage");
	assert.equal(parsed.services[0].http_status, 503);
	assert.equal(parsed.services[0].runtime_state, "STOPPED");
});

test("homelab health parser filters malformed row field types rather than failing the whole snapshot", () => {
	const parsed = parseHomelabHealthSnapshot({
		...VALID_SNAPSHOT,
		services: [{ ...VALID_SNAPSHOT.services[0], http_status: "200" }],
	});
	assert.ok(parsed);
	assert.deepEqual(parsed.services, []);
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

test("bounded homelab probes use the dedicated FastAPI probe matrix", async () => {
	setProbesApiUrl(undefined);
	let requestedUrl = "";
	globalThis.fetch = (async (input) => {
		requestedUrl = String(input);
		return Response.json(VALID_SNAPSHOT);
	}) as typeof fetch;

	const result = await loadHomelabProbeSnapshot();

	assert.equal(requestedUrl, HOMELAB_PROBES_DEFAULT_API_URL);
	assert.equal(result.source, "fastapi-probes");
	assert.equal(result.snapshot?.probe_summary?.public?.scheduled, 1);
	assert.equal(result.snapshot?.probe_summary?.internal?.max_concurrency, 4);
	assert.equal(result.snapshot?.probe_summary?.catalog_service_count, 72);
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
	setProbesApiUrl("https://probes.example.test/homelab");
	globalThis.fetch = (async (input) => {
		if (String(input) === "https://probes.example.test/homelab") {
			return new Response("probe fallback unavailable", { status: 503 });
		}
		return Response.json(VALID_SNAPSHOT);
	}) as typeof fetch;

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

test("homelab health proxy propagates health-board freshness into the JSON contract", async () => {
	setBoardApiUrl("https://board.example.test/api");
	globalThis.fetch = (async (input) => {
		if (String(input) === "https://board.example.test/api") {
			return Response.json({
				schema_version: 1,
				state: "stale",
				refreshing: true,
				generated_at: "2026-09-09T14:21:06Z",
				age_seconds: 33.4,
				error: "health board refresh deadline exceeded",
				runtime: null,
				healthz: null,
				homelab: VALID_SNAPSHOT,
				platform_metrics: null,
				sickz: null,
			});
		}
		return new Response("unexpected fallback", { status: 503 });
	}) as typeof fetch;

	const response = await GET();
	const body = await response.json();

	assert.equal(response.status, 200);
	assert.equal(response.headers.get("x-homelab-health-source"), "fastapi-health-board");
	assert.equal(body.health_board.state, "stale");
	assert.equal(body.health_board.refreshing, true);
	assert.equal(body.health_board.age_seconds, 33.4);
	assert.equal(
		body.health_board.generated_at,
		"2026-09-09T14:21:06Z",
	);
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

test("homelab health proxy prefers bounded probes when the board is unavailable", async () => {
	setApiUrl("https://health.example.test/homelab");
	setProbesApiUrl("https://probes.example.test/homelab");
	globalThis.fetch = (async (input) => {
		const url = String(input);
		if (url === "https://probes.example.test/homelab") {
			return Response.json(VALID_SNAPSHOT);
		}
		return new Response("unavailable", { status: 503 });
	}) as typeof fetch;

	const response = await GET();
	const body = await response.json();

	assert.equal(response.status, 200);
	assert.equal(
		response.headers.get("x-homelab-health-source"),
		"fastapi-probes",
	);
	assert.equal(
		response.headers.get("x-homelab-health-primary"),
		"https://probes.example.test/homelab",
	);
	assert.equal(body.probe_summary.public.scheduled, 1);
});
