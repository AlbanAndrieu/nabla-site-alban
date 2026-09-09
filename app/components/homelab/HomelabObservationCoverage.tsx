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
	const probeState = probeStateLabel(french, snapshot?.internal_probes_enabled);
	const probeSummary = snapshot?.probe_summary;
	const internalSummary = probeSummary?.internal;
	const publicSummary = probeSummary?.public;
	const authoritativeCatalogCount =
		probeSummary?.catalog_service_count ?? catalogServiceCount;
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
					{authoritativeCatalogCount}{" "}
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
							data-internal-probe-count={
								internalSummary?.scheduled ?? coverage.internalProbes
							}
							data-internal-probes-enabled={
								snapshot?.internal_probes_enabled === undefined
									? "unknown"
									: String(snapshot.internal_probes_enabled)
							}
						>
							{french ? "sondes LAN/internes" : "LAN/internal probes"}:{" "}
							{internalSummary?.scheduled ?? coverage.internalProbes}{" "}
							{french ? "planifiées" : "scheduled"} ·{" "}
							{internalSummary?.completed ?? coverage.internalProbes}{" "}
							{french ? "terminées" : "completed"} ·{" "}
							{internalSummary?.timed_out ?? 0} deadline ({probeState})
						</span>
						{publicSummary ? (
							<span data-public-probe-count={publicSummary.scheduled ?? 0}>
								{french ? "sondes publiques" : "public probes"}:{" "}
								{publicSummary.scheduled ?? 0}{" "}
								{french ? "planifiées" : "scheduled"} ·{" "}
								{publicSummary.completed ?? 0}{" "}
								{french ? "terminées" : "completed"} ·{" "}
								{publicSummary.timed_out ?? 0} deadline
							</span>
						) : null}
						{internalSummary?.max_concurrency !== undefined ? (
							<span data-probe-fanout-policy>
								fan-out: concurrency {internalSummary.max_concurrency}
								{internalSummary.budget_seconds !== undefined
									? ` · budget ${internalSummary.budget_seconds}s`
									: ""}
								{internalSummary.per_probe_timeout_seconds !== undefined
									? ` · timeout ${internalSummary.per_probe_timeout_seconds}s/probe`
									: ""}
							</span>
						) : null}
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
