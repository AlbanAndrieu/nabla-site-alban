import type { FastApiHealthBoardSnapshot } from "./fastApiHealthBoard";
import { parseHomelabDiagnostics } from "./homelabDiagnostics";
import { parseHomelabHealthSnapshot } from "./homelabHealth";
import {
	parseCloudflareCache,
	parseControlPlaneDiagnostics,
	parseEdgeEvidenceSkips,
	parsePfSenseIngressPolicy,
} from "./homelabObservabilityControlPlane";
import { parseDeepDiagnostics } from "./homelabObservabilityDeepDiagnostics";
import { parsePlatformMetrics } from "./homelabObservabilityPlatformMetrics";
import type { HomelabObservabilitySnapshot } from "./homelabObservabilityTypes";
import { parseHomelabOperationalEvidence } from "./homelabOperationalEvidence";
import { parseRuntimeTopology } from "./runtimeTopology";

export { withObservabilityFallbacks } from "./homelabObservabilityFallbacks";
export * from "./homelabObservabilityTypes";

export function parseHomelabObservability(
	board: FastApiHealthBoardSnapshot,
): HomelabObservabilitySnapshot {
	const operational = parseHomelabOperationalEvidence(board);
	const healthSnapshot = parseHomelabHealthSnapshot(board.homelab);
	const runtimeTopology = parseRuntimeTopology(board.runtime);
	const diagnostics =
		typeof board.homelab === "object" &&
		board.homelab !== null &&
		!Array.isArray(board.homelab)
			? parseHomelabDiagnostics(board.homelab)
			: null;

	return {
		...operational,
		healthSnapshot,
		runtimeTopology,
		deepDiagnostics: parseDeepDiagnostics(board.healthz),
		diagnostics,
		cloudflareCache: parseCloudflareCache(board.homelab),
		platformMetrics: parsePlatformMetrics(board.platform_metrics),
		pfsenseIngressPolicy: parsePfSenseIngressPolicy(board.healthz),
		edgeEvidenceSkips: parseEdgeEvidenceSkips(board.sickz),
		controlPlaneDiagnostics: parseControlPlaneDiagnostics(board.homelab),
		sources: {
			board: "health-board",
			runtime: runtimeTopology ? "health-board" : "unavailable",
			diagnostics: diagnostics ? "health-board" : "unavailable",
		},
	};
}
