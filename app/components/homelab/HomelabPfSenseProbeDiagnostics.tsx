"use client";

import { useLocale } from "next-intl";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";

type Props = { snapshot: HomelabHealthSnapshot };
type Row = { label: string; value: string };

function present(value: unknown): string | undefined {
	if (typeof value === "string" && value.trim()) return value.trim();
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	if (typeof value === "boolean") return value ? "true" : "false";
	return undefined;
}

function add(rows: Row[], label: string, value: unknown, suffix = "") {
	const formatted = present(value);
	if (formatted !== undefined)
		rows.push({ label, value: `${formatted}${suffix}` });
}

export default function HomelabPfSenseProbeDiagnostics({ snapshot }: Props) {
	const french = useLocale() === "fr";
	const pfsense = snapshot.pfsense?.dns;
	const operator = pfsense?.operator;
	if (!pfsense) return null;
	const rows: Row[] = [];
	add(rows, "Configured", pfsense.configured);
	add(rows, "Reachable", pfsense.reachable);
	add(rows, "Policy", pfsense.policy_state);
	add(rows, "Reason", pfsense.reason);
	add(rows, "API evidence", operator?.api_evidence_state);
	if (operator?.endpoint_count !== undefined) {
		rows.push({
			label: french ? "Endpoints API réussis" : "Successful API endpoints",
			value: `${operator.successful_endpoint_count ?? 0} / ${operator.endpoint_count}`,
		});
	}
	add(rows, "Services observed", operator?.services_observed);
	add(rows, "Running services", operator?.service_summary?.running);
	add(rows, "Stopped services", operator?.service_summary?.stopped);
	add(rows, "Unknown services", operator?.service_summary?.unknown);
	add(rows, "Total services", operator?.service_summary?.total);
	add(rows, "Stale", operator?.stale);
	add(rows, "Last good available", operator?.last_good_available);
	add(rows, "Refresh stage", operator?.refresh_error_stage);
	add(rows, "Refresh error", operator?.refresh_error);
	add(rows, "Cache layer", operator?.cache?.cache_layer);
	add(rows, "Cache age", operator?.cache?.cache_age_seconds, "s");
	add(rows, "Cache hit", operator?.cache?.cached);
	add(rows, "Cache stale", operator?.cache?.stale);
	add(rows, "Cache refreshing", operator?.cache?.refresh_in_progress);
	add(rows, "Cache Redis", operator?.cache?.redis_available);

	return (
		<>
			<h4 className="h6">pfSense observer</h4>
			<dl className="row g-1 mb-3" data-operator-diagnostic-section="pfsense">
				{rows.map((row) => (
					<div className="col-12 col-lg-6" key={row.label}>
						<dt className="d-inline">{row.label}: </dt>
						<dd className="d-inline text-break">{row.value}</dd>
					</div>
				))}
			</dl>
			{operator?.endpoint_status ? (
				<ul className="small" data-pfsense-endpoint-status>
					{Object.entries(operator.endpoint_status).map(([name, evidence]) => (
						<li key={name}>
							{name}: {evidence.observed ? "observed" : "failed"}
							{evidence.error ? ` · ${evidence.error}` : ""}
						</li>
					))}
				</ul>
			) : null}
		</>
	);
}
