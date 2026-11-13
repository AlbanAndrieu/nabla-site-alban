import { parseHomelabCatalogV2 } from "./homelabCatalogV2";
import { projectHomelabCatalogV2 } from "./homelabCatalogV2Projection";
import {
	type HomelabDiagnosticsSnapshot,
	parseHomelabDiagnostics,
} from "./homelabDiagnostics";
import {
	type HomelabHealthSnapshot,
	parseHomelabHealthSnapshot,
} from "./homelabHealth";
import type { ServiceTopology } from "./serviceTopology";

let diagnosticsPromise: Promise<HomelabDiagnosticsSnapshot | null> | null =
	null;
let healthPromise: Promise<HomelabHealthSnapshot | null> | null = null;
let topologyPromise: Promise<ServiceTopology | null> | null = null;

async function fetchParsed<T>(
	url: string,
	parser: (value: unknown) => T | null,
): Promise<T | null> {
	try {
		const response = await fetch(url, { cache: "no-store" });
		if (!response.ok) return null;
		return parser(await response.json());
	} catch {
		return null;
	}
}

export function fetchHomelabDiagnosticsOnce(): Promise<HomelabDiagnosticsSnapshot | null> {
	diagnosticsPromise ??= fetchParsed(
		"/api/homelab-diagnostics",
		parseHomelabDiagnostics,
	);
	return diagnosticsPromise;
}

export function fetchHomelabHealthOnce(): Promise<HomelabHealthSnapshot | null> {
	healthPromise ??= fetchParsed(
		"/api/homelab-health",
		parseHomelabHealthSnapshot,
	);
	return healthPromise;
}

/** The graph is the Backstage v2 projection; there is no second topology source. */
export function fetchServiceTopologyOnce(): Promise<ServiceTopology | null> {
	topologyPromise ??= fetchParsed("/api/homelab-catalog-v2", (value) => {
		const catalog = parseHomelabCatalogV2(value);
		return catalog ? projectHomelabCatalogV2(catalog).topology : null;
	});
	return topologyPromise;
}
