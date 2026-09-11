"use client";

import { useLocale } from "next-intl";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import { readHomelabOperatorDiagnostics } from "@/lib/homelabOperatorDiagnostics";

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

function Rows({ rows }: Readonly<{ rows: Row[] }>) {
	if (rows.length === 0) return null;
	return (
		<dl className="row g-1 mb-3" data-operator-diagnostic-section="truenas-api">
			{rows.map((row) => (
				<div className="col-12 col-lg-6" key={row.label}>
					<dt className="d-inline">{row.label}: </dt>
					<dd className="d-inline text-break">{row.value}</dd>
				</div>
			))}
		</dl>
	);
}

export default function HomelabTrueNasProbeDiagnostics({ snapshot }: Props) {
	const french = useLocale() === "fr";
	const diagnostics = readHomelabOperatorDiagnostics(snapshot);
	const api = diagnostics.trueNasApi;
	const transport = diagnostics.trueNasTransport;
	const rows: Row[] = [];

	add(rows, french ? "Joignable" : "Reachable", api?.reachable);
	add(rows, "Phase", api?.phase);
	add(rows, "Stage", api?.stage);
	add(rows, french ? "Latence" : "Latency", api?.elapsedMs, " ms");
	add(rows, "Exception", api?.exceptionType);
	add(rows, "Error", api?.error);
	add(rows, "Retry after", api?.retryAfterSeconds, "s");
	add(rows, "Last success", api?.lastSuccessAt);
	add(rows, "Cache layer", api?.cacheLayer);
	add(rows, "Cache age", api?.cacheAgeSeconds, "s");
	add(rows, "Cached", api?.cached);
	add(rows, "Stale", api?.stale);
	add(rows, "Refresh in progress", api?.refreshInProgress);
	add(rows, "Redis available", api?.redisAvailable);
	add(rows, "Circuit provider", api?.circuitBreaker?.provider);
	add(rows, "Circuit breaker", api?.circuitBreaker?.state);
	add(rows, "Circuit failures", api?.circuitBreaker?.failures);
	add(rows, "Circuit retry", api?.circuitBreaker?.retryAfterSeconds, "s");
	add(rows, "Circuit shared Redis", api?.circuitBreaker?.redisShared);
	add(rows, "Origin suppressed", api?.circuitBreaker?.originSuppressed);
	add(rows, "Username env", api?.usernameVariable);
	add(rows, "API-key env", api?.apiKeyVariable);
	if (api?.shadowedUsernameVariables.length) {
		rows.push({
			label: "Shadowed username env",
			value: api.shadowedUsernameVariables.join(", "),
		});
	}
	if (api?.shadowedApiKeyVariables.length) {
		rows.push({
			label: "Shadowed API-key env",
			value: api.shadowedApiKeyVariables.join(", "),
		});
	}
	add(rows, "Runtime error", diagnostics.trueNasRuntimeError);

	if (rows.length === 0 && !transport) return null;
	return (
		<>
			{rows.length > 0 ? <h4 className="h6">TrueNAS API</h4> : null}
			<Rows rows={rows} />
			{transport ? (
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
			) : null}
		</>
	);
}
