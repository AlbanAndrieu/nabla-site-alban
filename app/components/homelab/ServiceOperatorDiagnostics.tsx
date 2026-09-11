"use client";

import { useLocale } from "next-intl";
import type { HomelabHealthEntry } from "@/lib/homelabHealth";

type Props = {
	entry?: HomelabHealthEntry;
};

type UnknownRecord = Record<string, unknown>;
type DiagnosticRow = { label: string; value: string };

function scalar(raw: UnknownRecord, key: string): string | undefined {
	const value = raw[key];
	if (typeof value === "string" && value.trim()) return value.trim();
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	if (typeof value === "boolean") return value ? "true" : "false";
	return undefined;
}

function seconds(value: string | undefined): string | undefined {
	return value === undefined ? undefined : `${value}s`;
}

function status(value: string | undefined): string | undefined {
	return value === undefined ? undefined : `HTTP ${value}`;
}

function add(
	rows: DiagnosticRow[],
	label: string,
	value: string | undefined,
): void {
	if (value !== undefined) rows.push({ label, value });
}

export default function ServiceOperatorDiagnostics({ entry }: Props) {
	const french = useLocale() === "fr";
	if (!entry) return null;
	const raw = entry as unknown as UnknownRecord;
	const rows: DiagnosticRow[] = [];

	add(rows, french ? "URL sondée" : "Probed URL", scalar(raw, "url"));
	add(rows, french ? "HTTP" : "HTTP", status(scalar(raw, "http_status")));
	add(rows, "TLS trusted", scalar(raw, "tls_trusted"));
	add(
		rows,
		french ? "Latence" : "Latency",
		scalar(raw, "latency_ms") ? `${scalar(raw, "latency_ms")} ms` : undefined,
	);
	add(rows, french ? "Observé à" : "Observed at", scalar(raw, "observed_at"));
	add(
		rows,
		french ? "Âge observation" : "Observation age",
		seconds(scalar(raw, "observation_age_seconds")),
	);
	add(
		rows,
		french ? "Observation stale" : "Observation stale",
		scalar(raw, "observation_stale"),
	);

	for (const prefix of ["direct", "internal"] as const) {
		const title = prefix === "direct" ? "Direct" : "Internal";
		add(rows, `${title} probe source`, scalar(raw, `${prefix}_probe_source`));
		add(
			rows,
			`${title} probe observed`,
			scalar(raw, `${prefix}_probe_observed_at`),
		);
		add(
			rows,
			`${title} probe age`,
			seconds(scalar(raw, `${prefix}_probe_age_seconds`)),
		);
		add(
			rows,
			`${title} refresh error`,
			scalar(raw, `${prefix}_probe_refresh_error`),
		);
	}
	add(rows, "Rolling probe source", scalar(raw, "probe_source"));
	add(rows, "Rolling probe age", seconds(scalar(raw, "probe_age_seconds")));
	add(
		rows,
		"Rolling stale after",
		seconds(scalar(raw, "probe_stale_after_seconds")),
	);
	add(
		rows,
		"Next rolling probe",
		seconds(scalar(raw, "next_probe_in_seconds")),
	);
	add(rows, "Probe timed out", scalar(raw, "timed_out"));
	add(rows, "Probe error kind", scalar(raw, "error_kind"));
	add(rows, "Probe refresh error", scalar(raw, "probe_refresh_error"));

	add(rows, "Runtime app", scalar(raw, "runtime_app"));
	add(rows, "Runtime state", scalar(raw, "runtime_state"));
	add(rows, "Runtime reachable", scalar(raw, "runtime_reachable"));
	add(rows, "Runtime missing", scalar(raw, "runtime_missing"));
	add(rows, "Runtime stale", scalar(raw, "runtime_stale"));
	add(rows, "Tunnel", scalar(raw, "tunnel_name"));
	add(rows, "Tunnel state", scalar(raw, "tunnel_status"));
	add(rows, "Tunnel stale", scalar(raw, "tunnel_stale"));
	add(rows, "Cloudflare confirmed", scalar(raw, "cloudflare_status_confirmed"));
	add(rows, "Cloudflare warning", scalar(raw, "cloudflare_warning"));

	add(
		rows,
		"HTTP auth mode",
		scalar(raw, "public_probe_auth_mode") ??
			scalar(raw, "http_probe_auth_mode"),
	);
	add(rows, "Anonymous HTTP", status(scalar(raw, "anonymous_http_status")));
	add(rows, "Edge HTTP evidence", scalar(raw, "cloudflare_http_evidence"));
	add(rows, "Access signal", scalar(raw, "cloudflare_access_signal"));
	add(rows, "Default deny", scalar(raw, "cloudflare_default_deny"));
	add(
		rows,
		"Service token configured",
		scalar(raw, "cloudflare_service_token_configured"),
	);
	add(
		rows,
		"Service auth attempted",
		scalar(raw, "cloudflare_service_auth_attempted"),
	);
	add(
		rows,
		"Service token passed",
		scalar(raw, "cloudflare_service_token_access_passed"),
	);
	add(
		rows,
		"Service-token HTTP",
		status(scalar(raw, "cloudflare_service_token_http_status")),
	);
	add(
		rows,
		"Service-token signal",
		scalar(raw, "cloudflare_service_token_access_signal"),
	);
	add(
		rows,
		"Service-token error",
		scalar(raw, "cloudflare_service_token_error_kind"),
	);
	add(rows, "HTTP evidence skipped", scalar(raw, "http_evidence_skipped"));
	add(rows, "HTTP skip reason", scalar(raw, "http_evidence_skip_reason"));

	add(rows, french ? "Erreur réseau" : "Network error", scalar(raw, "error"));
	add(
		rows,
		french ? "Erreur applicative" : "Application error",
		scalar(raw, "application_error"),
	);
	if (rows.length === 0) return null;

	return (
		<details
			className="text-start small mt-3"
			data-service-operator-diagnostics
		>
			<summary className="fw-semibold">
				<i className="fas fa-stethoscope" aria-hidden="true" />{" "}
				{french ? "Diagnostic opérateur" : "Operator diagnostics"} (
				{rows.length})
			</summary>
			<dl className="row g-1 mt-2 mb-0">
				{rows.map((row, index) => (
					<div className="col-12" key={`${row.label}:${index}`}>
						<dt className="d-inline">{row.label}: </dt>
						<dd className="d-inline text-break">{row.value}</dd>
					</div>
				))}
			</dl>
		</details>
	);
}
