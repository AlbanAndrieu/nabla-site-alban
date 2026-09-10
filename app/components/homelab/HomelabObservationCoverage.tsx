"use client";

import { useLocale } from "next-intl";
import type {
	HomelabHealthSnapshot,
	HomelabProbeEvidenceSummary,
	HomelabRollingProbeEvidence,
} from "@/lib/homelabHealth";
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

function probeCacheIcon(source: "origin" | "memory" | undefined): string {
	if (source === "memory") return "🧊";
	if (source === "origin") return "🟢";
	return "◌";
}

function healthBoardIcon(state: "pending" | "fresh" | "stale"): string {
	if (state === "fresh") return "●";
	if (state === "stale") return "◐";
	return "◌";
}

function healthBoardRefreshLabel(french: boolean, refreshing: boolean): string {
	if (!refreshing) return "";
	return french ? " · refresh en cours" : " · refresh in progress";
}

function percent(numerator: number, denominator: number): number | null {
	if (denominator <= 0) return null;
	return Math.round((numerator / denominator) * 1000) / 10;
}

function healthyRollingEvidence(
	rows: Array<HomelabRollingProbeEvidence & { state: string }>,
): number {
	return rows.filter(
		(row) =>
			(row.probe_source === "origin" || row.probe_source === "memory") &&
			row.probe_stale !== true &&
			row.state === "ok",
	).length;
}

function probeEvidenceLabel(
	french: boolean,
	evidence: HomelabProbeEvidenceSummary | undefined,
	eligible: number,
	healthy: number,
): string | null {
	if (!evidence || evidence.known === undefined) return null;
	const evidenceCoverage =
		typeof evidence.coverage_percent === "number"
			? evidence.coverage_percent
			: percent(evidence.known, eligible);
	const healthyCoverage = percent(healthy, eligible);
	const parts = [
		`${french ? "preuves" : "evidence"} ${evidence.known}/${eligible}${evidenceCoverage === null ? "" : ` (${evidenceCoverage}%)`}`,
		`${french ? "sains" : "healthy"} ${healthy}/${eligible}${healthyCoverage === null ? "" : ` (${healthyCoverage}%)`}`,
		`${evidence.fresh ?? 0} ${french ? "fraîches" : "fresh"}`,
		`${evidence.cached ?? 0} cache`,
	];
	if (typeof evidence.evidence_ttl_seconds === "number") {
		parts.push(`TTL ${evidence.evidence_ttl_seconds}s`);
	}
	if (typeof evidence.evidence_max_retention_seconds === "number") {
		parts.push(
			`${french ? "rétention max" : "max retention"} ${evidence.evidence_max_retention_seconds}s`,
		);
	}
	return parts.join(" · ");
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
	const internalSampled =
		internalSummary?.sampled ??
		internalSummary?.scheduled ??
		coverage?.internalProbes ??
		0;
	const internalEligible =
		internalSummary?.eligible ?? internalSummary?.scheduled ?? internalSampled;
	const publicSampled = publicSummary?.sampled ?? publicSummary?.scheduled ?? 0;
	const publicEligible =
		publicSummary?.eligible ?? publicSummary?.scheduled ?? publicSampled;
	const internalHealthy = healthyRollingEvidence(snapshot?.internal_services ?? []);
	const publicHealthy = healthyRollingEvidence(snapshot?.services ?? []);
	const internalEvidenceLabel = probeEvidenceLabel(
		french,
		internalSummary?.evidence,
		internalEligible,
		internalHealthy,
	);
	const publicEvidenceLabel = probeEvidenceLabel(
		french,
		publicSummary?.evidence,
		publicEligible,
		publicHealthy,
	);
	const rotatingSample =
		internalSummary?.rotating_sample === true ||
		publicSummary?.rotating_sample === true;
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
				{coverage && snapshot ? (
					<>
						<span>
							{coverage.serviceObservations}{" "}
							{french ? "services observés" : "services observed"}
						</span>
						<span
							data-internal-probe-count={internalSampled}
							data-internal-probe-eligible={internalEligible}
							data-internal-probes-enabled={
								snapshot?.internal_probes_enabled === undefined
									? "unknown"
									: String(snapshot.internal_probes_enabled)
							}
						>
							{french ? "sondes LAN/internes" : "LAN/internal probes"}:{" "}
							{internalSampled}/{internalEligible}{" "}
							{french ? "échantillonnées" : "sampled"} ·{" "}
							{internalSummary?.completed ?? coverage.internalProbes}{" "}
							{french ? "terminées" : "completed"} ·{" "}
							{internalSummary?.timed_out ?? 0} deadline ({probeState})
						</span>
						{internalEvidenceLabel ? (
							<span
								data-internal-probe-evidence
								data-internal-probe-healthy={internalHealthy}
								data-internal-probe-healthy-coverage={
									percent(internalHealthy, internalEligible) ?? "n/a"
								}
							>
								{french ? "couverture LAN" : "LAN coverage"}: {internalEvidenceLabel}
							</span>
						) : null}
						{publicSummary ? (
							<span
								data-public-probe-count={publicSampled}
								data-public-probe-eligible={publicEligible}
							>
								{french ? "sondes publiques" : "public probes"}: {publicSampled}
								/{publicEligible} {french ? "échantillonnées" : "sampled"} ·{" "}
								{publicSummary.completed ?? 0}{" "}
								{french ? "terminées" : "completed"} ·{" "}
								{publicSummary.timed_out ?? 0} deadline
							</span>
						) : null}
						{publicEvidenceLabel ? (
							<span
								data-public-probe-evidence
								data-public-probe-healthy={publicHealthy}
								data-public-probe-healthy-coverage={
									percent(publicHealthy, publicEligible) ?? "n/a"
								}
							>
								{french ? "couverture publique" : "public coverage"}: {publicEvidenceLabel}
							</span>
						) : null}
						{rotatingSample ? (
							<span data-probe-rotating-sample>
								↻{" "}
								{french
									? "échantillon rotatif, services prioritaires conservés"
									: "rotating sample, priority services retained"}
								{probeSummary?.sampling?.strategy
									? ` · ${probeSummary.sampling.strategy}`
									: ""}
							</span>
						) : null}
						{internalSummary?.max_concurrency !== undefined ? (
							<span data-probe-fanout-policy>
								fan-out: concurrency {internalSummary.max_concurrency}
								{internalSummary.budget_seconds !== undefined
									? ` · budget ${internalSummary.budget_seconds}s`
									: ""}
								{internalSummary.per_probe_timeout_seconds !== undefined
									? ` · LAN timeout ${internalSummary.per_probe_timeout_seconds}s`
									: ""}
								{publicSummary?.per_probe_timeout_seconds !== undefined
									? ` · public timeout ${publicSummary.per_probe_timeout_seconds}s`
									: ""}
							</span>
						) : null}
						{snapshot.probe_cache ? (
							<span data-probe-cache-freshness>
								{probeCacheIcon(snapshot.probe_cache.source)}{" "}
								{french ? "cache sondes" : "probe cache"}:{" "}
								{snapshot.probe_cache.source ?? "unknown"}
								{typeof snapshot.probe_cache.age_seconds === "number"
									? ` · ${Math.round(snapshot.probe_cache.age_seconds)}s old`
									: ""}
								{snapshot.probe_cache.stale === true ? " · stale" : ""}
							</span>
						) : null}
						{snapshot.health_board ? (
							<span data-health-board-freshness>
								{healthBoardIcon(snapshot.health_board.state)} health-board{" "}
								{snapshot.health_board.state}
								{typeof snapshot.health_board.age_seconds === "number"
									? ` · ${Math.round(snapshot.health_board.age_seconds)}s old`
									: ""}
								{healthBoardRefreshLabel(
									french,
									snapshot.health_board.refreshing,
								)}
							</span>
						) : null}
						{snapshot.reconciliation?.provider_reads_reused ? (
							<span data-reconciliation-provenance>
								♻ provider reads reused
								{snapshot.reconciliation.truenas_runtime_source
									? ` · TrueNAS ${snapshot.reconciliation.truenas_runtime_source}`
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
