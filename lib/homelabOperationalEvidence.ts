import type { FastApiHealthBoardSnapshot } from "./fastApiHealthBoard";
import { parseOperationalComponents } from "./homelabOperationalComponents";
import { parseProviderCredentials } from "./homelabOperationalCredentials";
import { isRecord, optionalNumber, optionalString } from "./homelabOperationalEvidenceParsing";
import type { HomelabOperationalEvidence } from "./homelabOperationalEvidenceTypes";
import {
	deriveTroubleshootingFocus,
	parseFreshnessEvidence,
} from "./homelabOperationalFreshness";
import { parseExposurePorts } from "./homelabOperationalExposure";
import { parsePfSensePosture } from "./homelabOperationalPfSense";

export type {
	DependencyCycleEvidence,
	ExposurePortEvidence,
	HomelabOperationalEvidence,
	OperationalComponentEvidence,
	OperationalHealthState,
	PfSenseIngressEvidence,
	PfSensePostureEvidence,
	PfSenseSecurityFilterEvidence,
	ProviderCredentialEvidence,
	StaleServiceEvidence,
	TroubleshootingFocus,
} from "./homelabOperationalEvidenceTypes";

export function parseHomelabOperationalEvidence(
	board: FastApiHealthBoardSnapshot,
): HomelabOperationalEvidence {
	const homelab = isRecord(board.homelab) ? board.homelab : {};
	const components = parseOperationalComponents(homelab);
	const pfsense = parsePfSensePosture(homelab);
	const { staleServices, dependencyCycles } = parseFreshnessEvidence(homelab);
	return {
		board: {
			state: board.state,
			refreshing: board.refreshing,
			...(typeof board.age_seconds === "number"
				? { ageSeconds: board.age_seconds }
				: {}),
			generatedAt: board.generated_at,
			...(board.error !== undefined ? { error: board.error } : {}),
		},
		...(optionalString(homelab.components_status)
			? { componentsStatus: optionalString(homelab.components_status) }
			: {}),
		components,
		pfsense,
		exposurePorts: parseExposurePorts(board.sickz),
		providerCredentials: parseProviderCredentials(homelab),
		...(optionalNumber(homelab.refresh_elapsed_ms) !== undefined
			? { refreshElapsedMs: optionalNumber(homelab.refresh_elapsed_ms) }
			: {}),
		staleServices,
		dependencyCycles,
		troubleshootingFocus: deriveTroubleshootingFocus(
			components,
			pfsense,
			staleServices,
			dependencyCycles,
			board,
		),
	};
}
