import type { HomelabDiagnosticsSnapshot } from "./homelabDiagnostics";
import type { HomelabObservabilitySnapshot } from "./homelabObservabilityTypes";
import type { RuntimeTopologySnapshot } from "./runtimeTopology";

export function withObservabilityFallbacks(
	snapshot: HomelabObservabilitySnapshot,
	fallbacks: {
		runtimeTopology?: RuntimeTopologySnapshot | null;
		diagnostics?: HomelabDiagnosticsSnapshot | null;
	},
): HomelabObservabilitySnapshot {
	const runtimeTopology =
		snapshot.runtimeTopology ?? fallbacks.runtimeTopology ?? null;
	const diagnostics = snapshot.diagnostics ?? fallbacks.diagnostics ?? null;
	return {
		...snapshot,
		runtimeTopology,
		diagnostics,
		sources: {
			...snapshot.sources,
			runtime: snapshot.runtimeTopology
				? "health-board"
				: runtimeTopology
					? "fallback"
					: "unavailable",
			diagnostics: snapshot.diagnostics
				? "health-board"
				: diagnostics
					? "fallback"
					: "unavailable",
		},
	};
}
