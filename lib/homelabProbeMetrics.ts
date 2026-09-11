import type {
	HomelabHealthSnapshot,
	HomelabProbeScopeSummary,
} from "./homelabHealth";

export type HomelabProbeMetricRow = {
	label: string;
	value: string;
};

function finite(value: number | undefined): value is number {
	return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function percentage(numerator: number | undefined, denominator: number | undefined): string | null {
	if (!finite(numerator) || !finite(denominator) || denominator <= 0) return null;
	return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function push(
	rows: HomelabProbeMetricRow[],
	label: string,
	value: string | number | boolean | undefined | null,
	suffix = "",
) {
	if (value === undefined || value === null) return;
	rows.push({ label, value: `${String(value)}${suffix}` });
}

export function probeScopeMetricRows(
	scope: HomelabProbeScopeSummary | undefined,
	french: boolean,
): HomelabProbeMetricRow[] {
	if (!scope) return [];
	const rows: HomelabProbeMetricRow[] = [];
	push(rows, french ? "Activée" : "Enabled", scope.enabled);
	push(rows, french ? "Éligibles" : "Eligible", scope.eligible);
	push(rows, french ? "Échantillonnées" : "Sampled", scope.sampled);
	push(rows, french ? "Planifiées" : "Scheduled", scope.scheduled);
	push(rows, french ? "Terminées" : "Completed", scope.completed);
	push(rows, french ? "Timeouts" : "Timed out", scope.timed_out);
	push(rows, french ? "Échantillonnage rotatif" : "Rotating sample", scope.rotating_sample);
	push(rows, french ? "Budget" : "Budget", scope.budget_seconds, "s");
	push(
		rows,
		french ? "Timeout par sonde" : "Per-probe timeout",
		scope.per_probe_timeout_seconds,
		"s",
	);
	push(rows, french ? "Concurrence max" : "Max concurrency", scope.max_concurrency);
	push(rows, french ? "Durée du lot" : "Batch elapsed", scope.elapsed_ms, " ms");

	const sampleRatio = percentage(scope.sampled, scope.eligible);
	const completionRatio = percentage(scope.completed, scope.scheduled);
	const timeoutRatio = percentage(scope.timed_out, scope.scheduled);
	const budgetUtilization =
		finite(scope.elapsed_ms) && finite(scope.budget_seconds) && scope.budget_seconds > 0
			? `${((scope.elapsed_ms / (scope.budget_seconds * 1000)) * 100).toFixed(1)}%`
			: null;
	push(rows, french ? "Taux échantillonné" : "Sample ratio", sampleRatio);
	push(rows, french ? "Taux terminé" : "Completion ratio", completionRatio);
	push(rows, french ? "Taux timeout" : "Timeout ratio", timeoutRatio);
	push(rows, french ? "Budget consommé" : "Budget utilization", budgetUtilization);

	if (scope.states) {
		rows.push({
			label: french ? "États du lot" : "Batch states",
			value: `ok=${scope.states.ok ?? 0} · warn=${scope.states.warn ?? 0} · fail=${scope.states.fail ?? 0}`,
		});
	}

	const evidence = scope.evidence;
	if (evidence) {
		push(rows, french ? "Preuves connues" : "Known evidence", evidence.known);
		push(rows, french ? "Preuves fraîches" : "Fresh evidence", evidence.fresh);
		push(rows, french ? "Preuves en cache" : "Cached evidence", evidence.cached);
		push(rows, french ? "Couverture des preuves" : "Evidence coverage", evidence.coverage_percent, "%");
		push(rows, french ? "TTL des preuves" : "Evidence TTL", evidence.evidence_ttl_seconds, "s");
		push(
			rows,
			french ? "Rétention max" : "Max evidence retention",
			evidence.evidence_max_retention_seconds,
			"s",
		);
		push(rows, french ? "Part fraîche" : "Fresh ratio", percentage(evidence.fresh, evidence.known));
		push(rows, french ? "Part cache" : "Cached ratio", percentage(evidence.cached, evidence.known));
	}
	return rows;
}

export function probeCoordinatorMetricRows(
	snapshot: HomelabHealthSnapshot,
	french: boolean,
): HomelabProbeMetricRow[] {
	const rows: HomelabProbeMetricRow[] = [];
	push(rows, french ? "Snapshot" : "Snapshot", snapshot.checked_at);
	push(rows, french ? "Refresh agrégé" : "Aggregate refresh", snapshot.refresh_elapsed_ms, " ms");
	push(rows, french ? "Services catalogue" : "Catalog services", snapshot.probe_summary?.catalog_service_count);
	push(rows, french ? "Stratégie sampling" : "Sampling strategy", snapshot.probe_summary?.sampling?.strategy);
	push(rows, french ? "TTL cache sampling" : "Sampling cache TTL", snapshot.probe_summary?.sampling?.cache_ttl_seconds, "s");
	push(rows, french ? "Source cache" : "Probe cache source", snapshot.probe_cache?.source);
	push(rows, french ? "Âge cache" : "Probe cache age", snapshot.probe_cache?.age_seconds, "s");
	push(rows, french ? "TTL cache" : "Probe cache TTL", snapshot.probe_cache?.ttl_seconds, "s");
	push(rows, french ? "Cache stale" : "Probe cache stale", snapshot.probe_cache?.stale);
	push(rows, french ? "Health-board" : "Health board", snapshot.health_board?.state);
	push(rows, french ? "Health-board refresh" : "Health board refreshing", snapshot.health_board?.refreshing);
	push(rows, french ? "Health-board généré" : "Health board generated", snapshot.health_board?.generated_at);
	push(rows, french ? "Âge health-board" : "Health board age", snapshot.health_board?.age_seconds, "s");
	push(rows, "Retry after", snapshot.health_board?.retry_after_seconds, "s");
	push(rows, french ? "Erreur health-board" : "Health board error", snapshot.health_board?.error);
	push(rows, french ? "Lectures provider réutilisées" : "Provider reads reused", snapshot.reconciliation?.provider_reads_reused);
	push(rows, french ? "Source runtime TrueNAS" : "TrueNAS runtime source", snapshot.reconciliation?.truenas_runtime_source);
	return rows;
}
