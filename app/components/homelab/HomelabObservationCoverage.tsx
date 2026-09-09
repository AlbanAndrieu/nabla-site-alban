"use client";

import { useLocale } from "next-intl";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import styles from "./HomelabServicesBlock.module.css";

type Props = {
	snapshot: HomelabHealthSnapshot | null;
	catalogServiceCount: number;
	topologyNodeCount: number;
	topologyRelationCount: number;
};

type Coverage = {
	serviceObservations: number;
	internalProbes: number;
	directEvidence: number;
	internalEvidence: number;
	runtimeEvidence: number;
	tunnelEvidence: number;
	dependencyEvidence: number;
};

function observationCoverage(snapshot: HomelabHealthSnapshot): Coverage {
	return {
		serviceObservations: snapshot.services.length,
		internalProbes: snapshot.internal_services?.length ?? 0,
		directEvidence: snapshot.services.filter(
			(entry) => entry.direct_state != null,
		).length,
		internalEvidence: snapshot.services.filter(
			(entry) => entry.internal_state != null,
		).length,
		runtimeEvidence: snapshot.services.filter(
			(entry) =>
				entry.runtime_state != null ||
				entry.runtime_app != null ||
				entry.runtime_reachable != null,
		).length,
		tunnelEvidence: snapshot.services.filter(
			(entry) => entry.tunnel_status != null || entry.tunnel_name != null,
		).length,
		dependencyEvidence: snapshot.services.filter(
			(entry) => (entry.dependency_evidence?.length ?? 0) > 0,
		).length,
	};
}

function probeStateLabel(
	french: boolean,
	enabled: boolean | undefined,
): string {
	if (enabled === undefined) return french ? "état inconnu" : "state unknown";
	if (enabled) return french ? "activées" : "enabled";
	return french ? "désactivées" : "disabled";
}

export default function HomelabObservationCoverage({
	snapshot,
	catalogServiceCount,
	topologyNodeCount,
	topologyRelationCount,
}: Readonly<Props>) {
	const french = useLocale() === "fr";
	const coverage = snapshot ? observationCoverage(snapshot) : null;
	const probeState = probeStateLabel(
		french,
		snapshot?.internal_probes_enabled,
	);
	const topologyLabel = french
		? `${topologyNodeCount} nœuds · ${topologyRelationCount} relations`
		: `${topologyNodeCount} nodes · ${topologyRelationCount} relations`;
	const evidenceLabel = coverage
		? [
				french ? "preuves" : "evidence",
				`direct ${coverage.directEvidence}`,
				`internal ${coverage.internalEvidence}`,
				`runtime ${coverage.runtimeEvidence}`,
				`Cloudflare ${coverage.tunnelEvidence}`,
				`dependencies ${coverage.dependencyEvidence}`,
			].join(" · ")
		: null;

	return (
		<div
			className={styles.statusLegend}
			role="note"
			aria-label={french ? "Couverture d’observation" : "Observation coverage"}
			data-homelab-observer-summary
		>
			<div className={styles.legendGroup}>
				<strong>
					{french ? "Couverture d’observation :" : "Observation coverage:"}
				</strong>
				<span>
					{catalogServiceCount}{" "}
					{french ? "services catalogue" : "catalog services"}
				</span>
				<span>{topologyLabel}</span>
				{coverage ? (
					<>
						<span>
							{coverage.serviceObservations}{" "}
							{french ? "services observés" : "services observed"}
						</span>
						<span
							data-internal-probe-count={coverage.internalProbes}
							data-internal-probes-enabled={
								snapshot?.internal_probes_enabled === undefined
									? "unknown"
									: String(snapshot.internal_probes_enabled)
							}
						>
							{coverage.internalProbes}{" "}
							{french ? "sondes LAN/internes" : "LAN/internal probes"} (
							{probeState})
						</span>
						<span>{evidenceLabel}</span>
						{typeof snapshot.cloudflare_tunnels_observed === "number" ? (
							<span>
								{snapshot.cloudflare_tunnels_observed}{" "}
								{french
									? "tunnels Cloudflare observés"
									: "Cloudflare tunnels observed"}
							</span>
						) : null}
						{typeof snapshot.refresh_elapsed_ms === "number" ? (
							<span>
								{french ? "refresh santé" : "health refresh"}{" "}
								{snapshot.refresh_elapsed_ms} ms
							</span>
						) : null}
					</>
				) : (
					<span>
						{french
							? "Couverture runtime indisponible sans snapshot de santé valide."
							: "Runtime coverage unavailable without a valid health snapshot."}
					</span>
				)}
			</div>
		</div>
	);
}
