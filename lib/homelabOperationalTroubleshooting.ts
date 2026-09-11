import type { FastApiHealthBoardSnapshot } from "./fastApiHealthBoard";
import type {
	DependencyCycleEvidence,
	OperationalComponentEvidence,
	PfSensePostureEvidence,
	StaleServiceEvidence,
	TroubleshootingFocus,
} from "./homelabOperationalEvidenceTypes";

export function deriveTroubleshootingFocus(
	components: OperationalComponentEvidence[],
	pfsense: PfSensePostureEvidence | null,
	staleServices: StaleServiceEvidence[],
	cycles: DependencyCycleEvidence[],
	board: FastApiHealthBoardSnapshot,
): TroubleshootingFocus {
	if (pfsense?.ingressBlock?.state === "blocked") return "pfsense_block";
	if (
		pfsense?.ingressBlock?.state === "telemetry_unavailable" &&
		pfsense.ingressBlock.controlPath?.blindSpot
	) {
		return "pfsense_blind_spot";
	}
	const byId = new Map(
		components.map((component) => [component.id, component]),
	);
	if (byId.get("pfsense")?.state === "fail") return "pfsense_control";
	if (byId.get("cloudflare")?.state === "fail") return "cloudflare";
	if (byId.get("truenas")?.state === "fail") return "truenas";
	if (board.state === "stale" || staleServices.length > 0)
		return "stale_evidence";
	if (cycles.length > 0) return "dependency_cycle";
	return "dependencies";
}
