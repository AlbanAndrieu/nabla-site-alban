"use client";

import { useLocale } from "next-intl";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import { readHomelabOperatorDiagnostics } from "@/lib/homelabOperatorDiagnostics";
import {
	type HomelabProbeMetricRow,
	probeCoordinatorMetricRows,
	probeScopeMetricRows,
} from "@/lib/homelabProbeMetrics";
import HomelabPfSenseProbeDiagnostics from "./HomelabPfSenseProbeDiagnostics";
import HomelabTrueNasProbeDiagnostics from "./HomelabTrueNasProbeDiagnostics";

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
	if (ranked[0]) {
		rows.push({
			label: "slowest_phase",
			value: `${ranked[0][0]} · ${ranked[0][1]} ms`,
		});
	}
	add(rows, "fixed_cardinality", fixed);
	add(rows, "phase_count", count);
	return rows;
}

export default function HomelabProbeDiagnostics({ snapshot }: Props) {
	const french = useLocale() === "fr";
	if (!snapshot) return null;
	const diagnostics = readHomelabOperatorDiagnostics(snapshot);
	const probe = diagnostics.probeRuntime;
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
			{runtimeRows.length > 0 ? <h4 className="h6">Probe runtime</h4> : null}
			{rowsList(runtimeRows, "probe-runtime")}
			{publicRows.length > 0 ? <h4 className="h6">Public probe batch</h4> : null}
			{rowsList(publicRows, "public-probes")}
			{internalRows.length > 0 ? <h4 className="h6">Internal probe batch</h4> : null}
			{rowsList(internalRows, "internal-probes")}
			{aggregateRows.length > 0 ? (
				<h4 className="h6">Aggregate performance</h4>
			) : null}
			{rowsList(aggregateRows, "aggregate-performance")}
			{diagnostics.evidencePriority.length > 0 ? (
				<p className="small" data-evidence-priority>
					<strong>Evidence priority:</strong>{" "}
					{diagnostics.evidencePriority.join(" → ")}
				</p>
			) : null}

			<HomelabTrueNasProbeDiagnostics snapshot={snapshot} />
			<HomelabPfSenseProbeDiagnostics snapshot={snapshot} />
		</details>
	);
}
