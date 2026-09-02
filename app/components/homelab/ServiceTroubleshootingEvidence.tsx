"use client";

import { useLocale } from "next-intl";
import type { HomelabHealthEntry } from "@/lib/homelabHealth";

function stateClass(state?: string | null): string {
	if (state === "ok") return "text-success";
	if (state === "fail") return "text-danger";
	if (state === "warn") return "text-warning";
	return "text-muted";
}

function ageLabel(age?: number | null): string {
	if (typeof age !== "number") return "unknown";
	if (age < 60) return `${age}s`;
	if (age < 3600) return `${Math.round(age / 60)}m`;
	return `${Math.round(age / 3600)}h`;
}

export default function ServiceTroubleshootingEvidence({
	entry,
}: Readonly<{ entry: HomelabHealthEntry }>) {
	const french = useLocale() === "fr";
	const dependencyEvidence = entry.dependency_evidence ?? [];
	const cycle = entry.dependency_cycle ?? [];

	return (
		<details className="text-start mt-2" data-service-troubleshooting-evidence>
			<summary className="small fw-semibold">
				<i className="fas fa-stethoscope" aria-hidden="true" />{" "}
				{french ? "Preuves de troubleshooting" : "Troubleshooting evidence"}
			</summary>
			<div className="small mt-2 p-2 border rounded">
				<ul className="mb-2 ps-3">
					<li>
						{french ? "État local / effectif" : "Local / effective state"}: {" "}
						<span className={stateClass(entry.local_state ?? entry.state)}>{entry.local_state ?? entry.state}</span>
						{" → "}
						<span className={stateClass(entry.effective_state ?? entry.state)}>{entry.effective_state ?? entry.state}</span>
					</li>
					<li>
						{french ? "Observation" : "Observation"}: {ageLabel(entry.observation_age_seconds)}
						{entry.observation_stale ? <span className="text-warning"> · stale</span> : null}
					</li>
					{entry.http_status > 0 ? <li>HTTP {entry.http_status}{typeof entry.latency_ms === "number" ? ` · ${entry.latency_ms} ms` : ""}{entry.tls_trusted === true ? " · TLS trusted" : entry.tls_trusted === false ? " · TLS invalid" : ""}</li> : null}
					{entry.direct_state ? <li>direct: <span className={stateClass(entry.direct_state)}>{entry.direct_state}</span></li> : null}
					{entry.internal_state ? <li>internal: <span className={stateClass(entry.internal_state)}>{entry.internal_state}</span></li> : null}
					{entry.runtime_state ? <li>TrueNAS app: {entry.runtime_state}{entry.runtime_app ? ` (${entry.runtime_app})` : ""}{entry.runtime_reachable === false ? " · runtime unreachable" : ""}</li> : null}
					{entry.tunnel_status || entry.tunnel_name ? <li>Cloudflare: {entry.tunnel_status ?? "observed"}{entry.tunnel_name ? ` (${entry.tunnel_name})` : ""}</li> : null}
					{entry.application_error ? <li className="text-danger">application: {entry.application_error}</li> : null}
					{entry.error ? <li className="text-warning">transport: {entry.error}</li> : null}
				</ul>

				{cycle.length > 0 ? (
					<div className="alert alert-warning py-1 px-2 mb-2" data-dependency-cycle>
						<strong>{french ? "Cycle de dépendance requis" : "Required dependency cycle"}:</strong>{" "}
						{cycle.join(" → ")}
					</div>
				) : null}

				{dependencyEvidence.length > 0 ? (
					<div data-dependency-evidence-details>
						<strong>{french ? "Dépendances requises" : "Required dependencies"}</strong>
						<ul className="mb-0 mt-1 ps-3">
							{dependencyEvidence.map((evidence) => (
								<li key={`${evidence.target}:${evidence.relation_type}`}>
									{evidence.target_name ?? evidence.target} · {evidence.relation_type} · {" "}
									<span className={stateClass(evidence.target_state)}>{evidence.target_state}</span>
									{evidence.target_effective_state && evidence.target_effective_state !== evidence.target_state ? ` (raw ${evidence.target_effective_state})` : ""}
									{typeof evidence.target_observation_age_seconds === "number" ? ` · ${ageLabel(evidence.target_observation_age_seconds)}` : ""}
									{evidence.target_observation_stale ? " · stale" : ""}
									{evidence.description ? ` — ${evidence.description}` : ""}
									{evidence.evidence.length > 0 ? <span className="d-block text-muted">{french ? "source" : "source"}: {evidence.evidence.join(" · ")}</span> : null}
								</li>
							))}
						</ul>
					</div>
				) : null}
			</div>
		</details>
	);
}
