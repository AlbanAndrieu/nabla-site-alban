"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type {
	HomelabDiagnosticsSnapshot,
	HomelabExposureEvidence,
} from "@/lib/homelabDiagnostics";
import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
} from "@/lib/homelabHealth";
import {
	affectedDependents,
	explainHealth,
	incidentDependencyPath,
	type HealthCause,
	type ServiceImpact,
} from "@/lib/homelabImpact";
import {
	fetchHomelabDiagnosticsOnce,
	fetchHomelabHealthOnce,
	fetchServiceTopologyOnce,
} from "@/lib/homelabTroubleshootingClient";
import type { ServiceTopology } from "@/lib/serviceTopology";
import useAnchoredDetails from "./useAnchoredDetails";

function stateClass(state?: string | null): string {
	if (state === "ok" || state === "match") return "text-success";
	if (state === "fail" || state === "mismatch") return "text-danger";
	if (state === "warn" || state === "incomplete") return "text-warning";
	return "text-muted";
}

function ageLabel(age?: number | null): string {
	if (typeof age !== "number") return "unknown";
	if (age < 60) return `${age}s`;
	if (age < 3600) return `${Math.round(age / 60)}m`;
	return `${Math.round(age / 3600)}h`;
}

function causeLabel(cause: HealthCause, french: boolean): string {
	switch (cause.code) {
		case "application_error":
			return french
				? `Erreur applicative détectée${cause.detail ? ` : ${cause.detail}` : ""}`
				: `Application error detected${cause.detail ? `: ${cause.detail}` : ""}`;
		case "local_failure":
			return french
				? `La preuve locale du service est en échec${cause.detail ? ` : ${cause.detail}` : ""}`
				: `Local service evidence is failing${cause.detail ? `: ${cause.detail}` : ""}`;
		case "dependency_failure":
			return french
				? `État effectif dégradé par une dépendance requise en échec : ${(cause.targets ?? []).join(" · ")}`
				: `Effective state is degraded by a failed required dependency: ${(cause.targets ?? []).join(" · ")}`;
		case "dependency_unknown":
			return french
				? `État effectif dégradé car une dépendance requise est dégradée, inconnue ou obsolète : ${(cause.targets ?? []).join(" · ")}`
				: `Effective state is degraded because a required dependency is degraded, unknown, or stale: ${(cause.targets ?? []).join(" · ")}`;
		case "stale_observation":
			return french
				? "La preuve du service est obsolète ; elle ne doit pas suffire à rendre une dépendance verte."
				: "Service evidence is stale; it must not be sufficient to make a dependency green.";
		case "runtime_degraded":
			return french
				? `L’état runtime TrueNAS est transitionnel ou dégradé${cause.detail ? ` : ${cause.detail}` : ""}`
				: `TrueNAS runtime state is transitional or degraded${cause.detail ? `: ${cause.detail}` : ""}`;
		case "healthy":
			return french
				? "Les preuves locales et les dépendances requises actuellement observées sont saines."
				: "Current local evidence and required dependencies are healthy.";
		case "unknown":
			return french
				? "Les preuves actuelles ne suffisent pas à expliquer un état sain ou en échec."
				: "Current evidence is insufficient to explain a healthy or failed state.";
	}
}

function exposureSummary(
	exposure: HomelabExposureEvidence,
	french: boolean,
): string {
	const declared = exposure.declared.edge_mode ?? "unspecified";
	const tunnel = exposure.observed.cloudflare_tunnel_observed ? "tunnel observed" : "no tunnel observed";
	const access = exposure.observed.cloudflare_access_observed
		? `Access ${exposure.observed.cloudflare_access_public ? "public/bypass" : "protected"}`
		: "Access not observed";
	return french
		? `déclaré ${declared} · ${tunnel} · ${access}`
		: `declared ${declared} · ${tunnel} · ${access}`;
}

export default function ServiceTroubleshootingEvidence({
	entry,
}: Readonly<{ entry: HomelabHealthEntry }>) {
	const french = useLocale() === "fr";
	const [diagnostics, setDiagnostics] = useState<HomelabDiagnosticsSnapshot | null>(null);
	const [health, setHealth] = useState<HomelabHealthSnapshot | null>(null);
	const [topology, setTopology] = useState<ServiceTopology | null>(null);
	const dependencyEvidence = entry.dependency_evidence ?? [];
	const cycle = entry.dependency_cycle ?? [];
	const serviceId = entry.id ?? entry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
	const detailsId = `service-${serviceId}`;
	const anchoredDetails = useAnchoredDetails(detailsId);

	useEffect(() => {
		let active = true;
		void Promise.all([
			fetchHomelabDiagnosticsOnce(),
			fetchHomelabHealthOnce(),
			fetchServiceTopologyOnce(),
		]).then(([nextDiagnostics, nextHealth, nextTopology]) => {
			if (!active) return;
			setDiagnostics(nextDiagnostics);
			setHealth(nextHealth);
			setTopology(nextTopology);
		});
		return () => {
			active = false;
		};
	}, []);

	const causes = useMemo(() => explainHealth(entry), [entry]);
	const impacts: ServiceImpact[] = useMemo(
		() => (topology && entry.id ? affectedDependents(topology, entry.id) : []),
		[topology, entry.id],
	);
	const incidentPath = useMemo(
		() => incidentDependencyPath(entry, health?.services ?? [entry]),
		[entry, health],
	);
	const healthNames = useMemo(
		() =>
			new Map(
				(health?.services ?? []).flatMap((item) =>
					item.id ? [[item.id, item.name] as const] : [],
				),
			),
		[health],
	);
	const exposure = entry.id ? diagnostics?.exposure_by_service[entry.id] : undefined;
	const directImpacts = impacts.filter((impact) => impact.distance === 1);
	const indirectImpacts = impacts.filter((impact) => impact.distance > 1);

	return (
		<details
			id={detailsId}
			className="text-start mt-2"
			data-service-troubleshooting-evidence
			open={anchoredDetails.open}
			onToggle={(event) => anchoredDetails.setOpen(event.currentTarget.open)}
		>
			<summary className="small fw-semibold">
				<i className="fas fa-stethoscope" aria-hidden="true" />{" "}
				{french ? "Preuves de troubleshooting" : "Troubleshooting evidence"}
			</summary>
			<div className="small mt-2 p-2 border rounded">
				<div className="d-flex justify-content-between gap-2 align-items-start flex-wrap mb-2">
					<strong>{french ? "Pourquoi cet état ?" : "Why this status?"}</strong>
					<a href={`#${detailsId}`} className="small">
						#{serviceId}
					</a>
				</div>
				<ul className="mb-3 ps-3" data-status-explanation>
					{causes.map((cause, index) => (
						<li key={`${cause.code}:${index}`} className={stateClass(cause.state)}>
							{causeLabel(cause, french)}
						</li>
					))}
				</ul>

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

				{exposure ? (
					<div className="mb-3" data-service-exposure-evidence>
						<strong>{french ? "Exposition déclarée vs observée" : "Declared vs observed exposure"}</strong>
						<p className={`mb-1 mt-1 ${stateClass(exposure.state)}`}>
							{exposure.state}: {exposureSummary(exposure, french)}
						</p>
						{exposure.reasons.length > 0 ? (
							<ul className="mb-0 ps-3">
								{exposure.reasons.map((reason) => <li key={reason}>{reason}</li>)}
							</ul>
						) : null}
					</div>
				) : null}

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
									<a href={`#service-${evidence.target}`}>{evidence.target_name ?? evidence.target}</a> · {evidence.relation_type} · {" "}
									<span className={stateClass(evidence.target_state)}>{evidence.target_state}</span>
									{evidence.target_effective_state && evidence.target_effective_state !== evidence.target_state ? ` (raw ${evidence.target_effective_state})` : ""}
									{typeof evidence.target_observation_age_seconds === "number" ? ` · ${ageLabel(evidence.target_observation_age_seconds)}` : ""}
									{evidence.target_observation_stale ? " · stale" : ""}
									{evidence.description ? ` — ${evidence.description}` : ""}
									{evidence.evidence.length > 0 ? <span className="d-block text-muted">source: {evidence.evidence.join(" · ")}</span> : null}
								</li>
							))}
						</ul>
					</div>
				) : null}

				{incidentPath.length > 1 ? (
					<div className="mt-3" data-incident-dependency-path>
						<strong>{french ? "Chemin probable de l’incident" : "Probable incident dependency path"}:</strong>{" "}
						{incidentPath.map((id, index) => (
							<span key={`${id}:${index}`}>
								{index > 0 ? " → " : ""}
								<a href={`#service-${id}`}>{healthNames.get(id) ?? id}</a>
							</span>
						))}
						<p className="text-muted mb-0 mt-1">
							{french ? "Chemin dérivé des blocked_by observés ; il indique une piste de cause racine, pas une causalité absolue." : "Derived from observed blocked_by evidence; this is a root-cause lead, not proof of absolute causality."}
						</p>
					</div>
				) : null}

				{impacts.length > 0 ? (
					<details className="mt-3" data-affected-dependents>
						<summary className="fw-semibold">
							{french ? "Afficher les services potentiellement impactés" : "Show potentially affected dependents"} ({impacts.length})
						</summary>
						<div className="mt-2">
							{directImpacts.length > 0 ? (
								<>
									<strong>{french ? "Dépendants directs" : "Direct dependents"}</strong>
									<ul className="ps-3">
										{directImpacts.map((impact) => <li key={impact.id}><a href={`#service-${impact.id}`}>{impact.name}</a></li>)}
									</ul>
								</>
							) : null}
							{indirectImpacts.length > 0 ? (
								<>
									<strong>{french ? "Dépendants indirects" : "Indirect dependents"}</strong>
									<ul className="mb-0 ps-3">
										{indirectImpacts.map((impact) => <li key={impact.id}><a href={`#service-${impact.id}`}>{impact.name}</a> · {impact.distance} hops</li>)}
									</ul>
								</>
							) : null}
							<p className="text-muted mb-0 mt-1">
								{french ? "Impact structurel calculé depuis les relations requises de la topologie ; cela ne signifie pas que tous ces services sont actuellement en panne." : "Structural blast radius from required topology relations; this does not mean every listed service is currently failing."}
							</p>
						</div>
					</details>
				) : null}
			</div>
		</details>
	);
}
