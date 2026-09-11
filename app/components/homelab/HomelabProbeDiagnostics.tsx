"use client";

import { useLocale } from "next-intl";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import { readHomelabOperatorDiagnostics } from "@/lib/homelabOperatorDiagnostics";
import {
	type HomelabProbeMetricRow,
	probeCoordinatorMetricRows,
	probeScopeMetricRows,
} from "@/lib/homelabProbeMetrics";

type Props = { snapshot: HomelabHealthSnapshot | null };
type Row = HomelabProbeMetricRow;

function present(value: unknown): string | undefined {
	if (typeof value === "string" && value.trim()) return value.trim();
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	if (typeof value === "boolean") return value ? "true" : "false";
	return undefined;
}

function rowsList(rows: Row[], key: string) {
	if (rows.length === 0) return null;
	return (
		<dl className="row g-1 mb-3" data-operator-diagnostic-section={key}>
			{rows.map((row) => (
				<div className="col-12 col-lg-6" key={`${key}:${row.label}`}>
					<dt className="d-inline">{row.label}: </dt>
					<dd className="d-inline text-break">{row.value}</dd>
				</div>
			))}
		</dl>
	);
}

function add(rows: Row[], label: string, value: unknown, suffix = "") {
	const formatted = present(value);
	if (formatted !== undefined)
		rows.push({ label, value: `${formatted}${suffix}` });
}

function performanceRows(
	phases: Record<string, number>,
	fixed?: boolean,
	count?: number,
): Row[] {
	const total = phases.total;
	const rows = Object.entries(phases).map(([label, value]) => ({
		label,
		value:
			label !== "total" && typeof total === "number" && total > 0
				? `${value} ms · ${((value / total) * 100).toFixed(1)}% of total`
				: `${value} ms`,
	}));
	const ranked = Object.entries(phases)
		.filter(([key]) => key !== "total")
		.sort((left, right) => right[1] - left[1]);
	if (ranked[0])
		rows.push({
			label: "slowest_phase",
			value: `${ranked[0][0]} · ${ranked[0][1]} ms`,
		});
	add(rows, "fixed_cardinality", fixed);
	add(rows, "phase_count", count);
	return rows;
}

export default function HomelabProbeDiagnostics({ snapshot }: Props) {
	const french = useLocale() === "fr";
	if (!snapshot) return null;
	const diagnostics = readHomelabOperatorDiagnostics(snapshot);
	const probe = diagnostics.probeRuntime;
	const api = diagnostics.trueNasApi;
	const transport = diagnostics.trueNasTransport;
	const pfsense = snapshot.pfsense?.dns;
	const pfsenseOperator = pfsense?.operator;
	const coordinatorRows = probeCoordinatorMetricRows(snapshot, french);
	const publicRows = probeScopeMetricRows(
		snapshot.probe_summary?.public,
		french,
	);
	const internalRows = probeScopeMetricRows(
		snapshot.probe_summary?.internal,
		french,
	);

	const runtimeRows: Row[] = [];
	add(runtimeRows, "Runtime", probe?.state);
	add(runtimeRows, french ? "Démarré" : "Started", probe?.startedAt);
	add(runtimeRows, "Uptime", probe?.uptimeSeconds, "s");
	add(
		runtimeRows,
		french ? "Couverture" : "Coverage",
		probe?.coveragePercent,
		"%",
	);
	if (
		probe?.knownProbeSlots !== undefined ||
		probe?.eligibleProbeSlots !== undefined
	) {
		runtimeRows.push({
			label: french ? "Slots connus / éligibles" : "Known / eligible slots",
			value: `${probe?.knownProbeSlots ?? "?"} / ${probe?.eligibleProbeSlots ?? "?"}`,
		});
	}
	add(
		runtimeRows,
		french ? "Cycle complet estimé" : "Estimated full cycle",
		probe?.estimatedFullCycleSeconds,
		"s",
	);

	const aggregateRows = performanceRows(
		diagnostics.performance?.phasesMs ?? {},
		diagnostics.performance?.fixedCardinality,
		diagnostics.performance?.phaseCount,
	);

	const apiRows: Row[] = [];
	add(apiRows, french ? "Joignable" : "Reachable", api?.reachable);
	add(apiRows, "Phase", api?.phase);
	add(apiRows, "Stage", api?.stage);
	add(apiRows, french ? "Latence" : "Latency", api?.elapsedMs, " ms");
	add(apiRows, "Exception", api?.exceptionType);
	add(apiRows, "Error", api?.error);
	add(apiRows, "Retry after", api?.retryAfterSeconds, "s");
	add(apiRows, "Last success", api?.lastSuccessAt);
	add(apiRows, "Cache layer", api?.cacheLayer);
	add(apiRows, "Cache age", api?.cacheAgeSeconds, "s");
	add(apiRows, "Cached", api?.cached);
	add(apiRows, "Stale", api?.stale);
	add(apiRows, "Refresh in progress", api?.refreshInProgress);
	add(apiRows, "Redis available", api?.redisAvailable);
	add(apiRows, "Circuit provider", api?.circuitBreaker?.provider);
	add(apiRows, "Circuit breaker", api?.circuitBreaker?.state);
	add(apiRows, "Circuit failures", api?.circuitBreaker?.failures);
	add(apiRows, "Circuit retry", api?.circuitBreaker?.retryAfterSeconds, "s");
	add(apiRows, "Circuit shared Redis", api?.circuitBreaker?.redisShared);
	add(apiRows, "Origin suppressed", api?.circuitBreaker?.originSuppressed);
	add(apiRows, "Username env", api?.usernameVariable);
	add(apiRows, "API-key env", api?.apiKeyVariable);
	if (api?.shadowedUsernameVariables.length) {
		apiRows.push({
			label: "Shadowed username env",
			value: api.shadowedUsernameVariables.join(", "),
		});
	}
	if (api?.shadowedApiKeyVariables.length) {
		apiRows.push({
			label: "Shadowed API-key env",
			value: api.shadowedApiKeyVariables.join(", "),
		});
	}
	add(apiRows, "Runtime error", diagnostics.trueNasRuntimeError);

	const pfsenseRows: Row[] = [];
	add(pfsenseRows, "Configured", pfsense?.configured);
	add(pfsenseRows, "Reachable", pfsense?.reachable);
	add(pfsenseRows, "Policy", pfsense?.policy_state);
	add(pfsenseRows, "Reason", pfsense?.reason);
	add(pfsenseRows, "API evidence", pfsenseOperator?.api_evidence_state);
	if (pfsenseOperator?.endpoint_count !== undefined) {
		pfsenseRows.push({
			label: french ? "Endpoints API réussis" : "Successful API endpoints",
			value: `${pfsenseOperator.successful_endpoint_count ?? 0} / ${pfsenseOperator.endpoint_count}`,
		});
	}
	add(pfsenseRows, "Services observed", pfsenseOperator?.services_observed);
	add(
		pfsenseRows,
		"Running services",
		pfsenseOperator?.service_summary?.running,
	);
	add(
		pfsenseRows,
		"Stopped services",
		pfsenseOperator?.service_summary?.stopped,
	);
	add(
		pfsenseRows,
		"Unknown services",
		pfsenseOperator?.service_summary?.unknown,
	);
	add(pfsenseRows, "Total services", pfsenseOperator?.service_summary?.total);
	add(pfsenseRows, "Stale", pfsenseOperator?.stale);
	add(pfsenseRows, "Last good available", pfsenseOperator?.last_good_available);
	add(pfsenseRows, "Refresh stage", pfsenseOperator?.refresh_error_stage);
	add(pfsenseRows, "Refresh error", pfsenseOperator?.refresh_error);
	add(pfsenseRows, "Cache layer", pfsenseOperator?.cache?.cache_layer);
	add(pfsenseRows, "Cache age", pfsenseOperator?.cache?.cache_age_seconds, "s");
	add(pfsenseRows, "Cache hit", pfsenseOperator?.cache?.cached);
	add(pfsenseRows, "Cache stale", pfsenseOperator?.cache?.stale);
	add(
		pfsenseRows,
		"Cache refreshing",
		pfsenseOperator?.cache?.refresh_in_progress,
	);
	add(pfsenseRows, "Cache Redis", pfsenseOperator?.cache?.redis_available);

	const hasEvidence =
		[
			coordinatorRows,
			runtimeRows,
			publicRows,
			internalRows,
			aggregateRows,
			apiRows,
			pfsenseRows,
		].some((rows) => rows.length > 0) || Boolean(transport?.stages.length);
	if (!hasEvidence) return null;

	return (
		<details
			className="card box-shadow p-3 mb-4"
			data-homelab-operator-diagnostics
		>
			<summary className="h5 mb-0">
				<i className="fas fa-chart-line" aria-hidden="true" />{" "}
				{french
					? "Métriques et diagnostic des sondes"
					: "Probe metrics and diagnostics"}
			</summary>
			<p className="small text-muted mt-3">
				{french
					? "Métriques FastAPI détaillées pour distinguer panne de service, sous-échantillonnage, cache, donnée stale, timeout et saturation du budget. L’état réconcilié reste l’autorité."
					: "Detailed FastAPI metrics distinguish service failures from sampling, cache, stale evidence, timeouts and probe-budget saturation. Reconciled health remains authoritative."}
			</p>

			<h4 className="h6">Coordinator / cache</h4>
			{rowsList(coordinatorRows, "coordinator")}
			{runtimeRows.length > 0 && <h4 className="h6">Probe runtime</h4>}
			{rowsList(runtimeRows, "probe-runtime")}
			{publicRows.length > 0 && <h4 className="h6">Public probe batch</h4>}
			{rowsList(publicRows, "public-probes")}
			{internalRows.length > 0 && <h4 className="h6">Internal probe batch</h4>}
			{rowsList(internalRows, "internal-probes")}
			{aggregateRows.length > 0 && (
				<h4 className="h6">Aggregate performance</h4>
			)}
			{rowsList(aggregateRows, "aggregate-performance")}
			{diagnostics.evidencePriority.length > 0 && (
				<p className="small" data-evidence-priority>
					<strong>Evidence priority:</strong>{" "}
					{diagnostics.evidencePriority.join(" → ")}
				</p>
			)}

			{apiRows.length > 0 && <h4 className="h6">TrueNAS API</h4>}
			{rowsList(apiRows, "truenas-api")}
			{transport && (
				<>
					<h4 className="h6">TrueNAS transport path</h4>
					<p className="small">
						{[transport.target, transport.pathMode, transport.websocketUri]
							.filter(Boolean)
							.join(" · ")}
						{transport.verifySsl !== undefined
							? ` · verify TLS=${transport.verifySsl}`
							: ""}
						{transport.timedOut ? " · timed out" : ""}
						{transport.errorKind ? ` · ${transport.errorKind}` : ""}
					</p>
					<ol className="small ps-4" data-truenas-diagnostic-stages>
						{transport.stages.map((stage) => (
							<li key={stage.id} data-stage-state={stage.state}>
								<strong>{stage.label}</strong> — {stage.state}
								{stage.elapsedMs !== undefined
									? ` · ${stage.elapsedMs} ms`
									: ""}
								{stage.httpStatus !== undefined
									? ` · HTTP ${stage.httpStatus}`
									: ""}
								{stage.tlsTrusted !== undefined
									? ` · TLS=${String(stage.tlsTrusted)}`
									: ""}
								{stage.resolved.length ? ` · ${stage.resolved.join(", ")}` : ""}
								{stage.detail ? (
									<span className="d-block text-muted">{stage.detail}</span>
								) : null}
								{stage.failureStage ? (
									<span className="d-block text-danger">
										failure: {stage.failureStage}
									</span>
								) : null}
							</li>
						))}
					</ol>
				</>
			)}

			{pfsenseRows.length > 0 && <h4 className="h6">pfSense observer</h4>}
			{rowsList(pfsenseRows, "pfsense")}
			{pfsenseOperator?.endpoint_status && (
				<ul className="small" data-pfsense-endpoint-status>
					{Object.entries(pfsenseOperator.endpoint_status).map(
						([name, evidence]) => (
							<li key={name}>
								{name}: {evidence.observed ? "observed" : "failed"}
								{evidence.error ? ` · ${evidence.error}` : ""}
							</li>
						),
					)}
				</ul>
			)}
		</details>
	);
}
