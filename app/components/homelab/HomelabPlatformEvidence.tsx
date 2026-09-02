"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import type { HomelabDiagnosticsSnapshot } from "@/lib/homelabDiagnostics";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import type { RuntimeTopologySnapshot } from "@/lib/runtimeTopology";
import {
	fetchHomelabDiagnosticsOnce,
	fetchRuntimeTopologyOnce,
} from "@/lib/homelabTroubleshootingClient";

function stateClass(state?: string): string {
	const normalized = state?.toLowerCase();
	if (["ok", "clear", "running", "in_path", "observed", "match"].includes(normalized ?? "")) {
		return "text-success";
	}
	if (["fail", "blocked", "stopped", "mismatch"].includes(normalized ?? "")) {
		return "text-danger";
	}
	if (
		[
			"warn",
			"telemetry_unavailable",
			"telemetry_stale",
			"attribution_unavailable",
			"incomplete",
		].includes(normalized ?? "")
	) {
		return "text-warning";
	}
	return "text-muted";
}

function dateLabel(value: string | undefined, french: boolean): string {
	if (!value) return french ? "inconnue" : "unknown";
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime())
		? value
		: parsed.toLocaleString(french ? "fr-FR" : "en-GB");
}

function yesNo(value: boolean | undefined, french: boolean): string {
	if (value === undefined) return french ? "inconnu" : "unknown";
	return value ? (french ? "oui" : "yes") : (french ? "non" : "no");
}

export default function HomelabPlatformEvidence({
	snapshot,
}: Readonly<{ snapshot: HomelabHealthSnapshot | null }>) {
	const french = useLocale() === "fr";
	const [diagnostics, setDiagnostics] = useState<HomelabDiagnosticsSnapshot | null>(null);
	const [runtimeTopology, setRuntimeTopology] = useState<RuntimeTopologySnapshot | null>(null);

	useEffect(() => {
		let active = true;
		void Promise.all([
			fetchHomelabDiagnosticsOnce(),
			fetchRuntimeTopologyOnce(),
		]).then(([nextDiagnostics, nextRuntimeTopology]) => {
			if (!active) return;
			setDiagnostics(nextDiagnostics);
			setRuntimeTopology(nextRuntimeTopology);
		});
		return () => {
			active = false;
		};
	}, []);

	if (!snapshot) return null;

	const dns = snapshot.pfsense?.dns;
	const legacyIngress = dns?.ingress_block;
	const ingress = diagnostics?.pfsense_ingress;
	const securityFilters = dns?.security_filters ?? [];
	const checkedLabel = dateLabel(snapshot.checked_at, french);
	const truenasApi = diagnostics?.truenas_api;
	const cloudflare = diagnostics?.cloudflare;

	return (
		<details className="mt-3" data-homelab-platform-evidence>
			<summary className="fw-semibold">
				<i className="fas fa-stethoscope" aria-hidden="true" />{" "}
				{french ? "Preuves de diagnostic de la plateforme" : "Platform troubleshooting evidence"}
			</summary>
			<div className="card mt-2 border-secondary bg-transparent">
				<div className="card-body text-start small">
					<div className="row g-3">
						<div className="col-12 col-lg-4">
							<strong>{french ? "Instantané FastAPI" : "FastAPI snapshot"}</strong>
							<ul className="mb-0 mt-2">
								<li>{french ? "Observé" : "Observed"}: {checkedLabel}</li>
								{typeof snapshot.refresh_elapsed_ms === "number" ? (
									<li>{french ? "Durée du refresh backend" : "Backend refresh duration"}: {snapshot.refresh_elapsed_ms} ms</li>
								) : null}
								<li>TrueNAS runtime: {snapshot.truenas_runtime_reachable === true ? "reachable" : snapshot.truenas_runtime_reachable === false ? "unreachable" : "unknown"}</li>
								<li>{french ? "Snapshot runtime obsolète" : "Runtime snapshot stale"}: {yesNo(snapshot.truenas_runtime_stale, french)}</li>
							</ul>
						</div>

						<div className="col-12 col-lg-4" data-fastapi-runtime-topology>
							<strong>{french ? "Runtimes FastAPI Cloud observés" : "Observed FastAPI Cloud runtimes"}</strong>
							{runtimeTopology ? (
								<>
									<ul className="mb-0 mt-2">
										<li>{french ? "Runtimes actifs observés" : "Observed active runtimes"}: {runtimeTopology.observed_instance_count}</li>
										<li>{french ? "Agrégation" : "Aggregation"}: {runtimeTopology.aggregation ?? "unknown"}{runtimeTopology.degraded ? " · degraded" : ""}</li>
										<li>{french ? "IP egress actives" : "Active egress IPs"}: {runtimeTopology.active_egress_ips.join(" · ") || "none observed"}</li>
										<li>{french ? "IP egress vues sur 24 h" : "Egress IPs seen in 24h"}: {runtimeTopology.recent_egress_ips.join(" · ") || "none observed"}</li>
									</ul>
									<p className="text-muted mb-0 mt-2">
										{runtimeTopology.count_semantics}
									</p>
								</>
							) : (
								<p className="text-muted mt-2 mb-0">
									{french ? "La topologie des runtimes n’est pas disponible actuellement." : "Runtime topology is currently unavailable."}
								</p>
							)}
						</div>

						<div className="col-12 col-lg-4" data-truenas-api-diagnostics>
							<strong>{french ? "Transport / API TrueNAS" : "TrueNAS transport / API"}</strong>
							{truenasApi ? (
								<ul className="mb-0 mt-2">
									<li className={truenasApi.reachable ? "text-success" : "text-warning"}>
										{truenasApi.reachable ? "reachable" : "unreachable"}
										{truenasApi.phase || truenasApi.stage ? ` · ${truenasApi.phase ?? "?"}/${truenasApi.stage ?? "?"}` : ""}
									</li>
									{typeof truenasApi.elapsed_ms === "number" ? <li>probe: {truenasApi.elapsed_ms} ms</li> : null}
									{truenasApi.cached !== undefined ? <li>cache: {truenasApi.cached ? "cached" : "fresh"}{typeof truenasApi.cache_age_seconds === "number" ? ` · ${truenasApi.cache_age_seconds}s` : ""}{truenasApi.stale ? " · stale" : ""}</li> : null}
									{truenasApi.last_success_at ? <li>{french ? "Dernier succès" : "Last success"}: {dateLabel(truenasApi.last_success_at, french)}</li> : null}
									{truenasApi.error ? <li className="text-warning">{truenasApi.exception_type ? `${truenasApi.exception_type}: ` : ""}{truenasApi.error}</li> : null}
									{typeof truenasApi.retry_after_seconds === "number" ? <li>{french ? "Nouvelle sonde après" : "Retry window"}: {truenasApi.retry_after_seconds}s</li> : null}
								</ul>
							) : (
								<p className="text-muted mt-2 mb-0">{french ? "Métadonnées de transport indisponibles." : "Transport metadata unavailable."}</p>
							)}
						</div>
					</div>

					<div className="row g-3 mt-1">
						<div className="col-12 col-lg-6" data-cloudflare-diagnostics>
							<strong>Cloudflare</strong>
							<ul className="mb-0 mt-2">
								<li>{french ? "Observation configurée" : "Observation configured"}: {yesNo(cloudflare?.configured ?? snapshot.cloudflare_configured, french)}</li>
								<li>{french ? "Tunnels observés" : "Observed tunnels"}: {cloudflare?.tunnels_observed ?? snapshot.cloudflare_tunnels_observed ?? "unknown"}</li>
								{cloudflare ? <li>Tunnel observer: <span className={stateClass(cloudflare.tunnel_observer_state)}>{cloudflare.tunnel_observer_state ?? "unknown"}</span>{cloudflare.tunnel_error ? ` (${cloudflare.tunnel_error})` : ""}</li> : null}
								{cloudflare ? <li>Access observer: <span className={stateClass(cloudflare.access_observer_state)}>{cloudflare.access_observer_state ?? "unknown"}</span> · {cloudflare.access_applications_observed ?? 0} apps{cloudflare.access_error ? ` (${cloudflare.access_error})` : ""}</li> : null}
							</ul>
							<p className="text-muted mb-0 mt-2">
								{french
									? "Le diagnostic d’exposition compare la déclaration nabla-compose avec les Tunnels et politiques Access observés, sans modifier l’état de santé fonctionnel du service."
									: "Exposure diagnostics compare nabla-compose declarations with observed Tunnels and Access policies without changing functional service health."}
							</p>
						</div>

						<div className="col-12 col-lg-6">
							<strong>pfSense / DNS</strong>
							{dns ? (
								<ul className="mb-0 mt-2">
									<li className={stateClass(dns.policy_state)}>{dns.policy_state}: {dns.reason}</li>
									{dns.error_stage ? <li>{french ? "Étape en erreur" : "Failure stage"}: {dns.error_stage}{dns.error ? ` (${dns.error})` : ""}</li> : null}
									{dns.upstream ? <li>{french ? "Indépendant de TrueNAS" : "Independent from TrueNAS"}: {dns.upstream.independent_from_truenas === true ? "yes" : dns.upstream.independent_from_truenas === false ? "no" : "unverified"}</li> : null}
								</ul>
							) : (
								<p className="text-muted mt-2 mb-0">{french ? "Aucune posture pfSense disponible." : "No pfSense posture evidence available."}</p>
							)}
						</div>
					</div>

					{securityFilters.length > 0 ? (
						<div className="mt-3" data-pfsense-security-filters>
							<strong>{french ? "Filtres de sécurité observés" : "Observed security filters"}</strong>
							<div className="d-flex flex-wrap gap-2 mt-2">
								{securityFilters.map((filter) => (
									<span key={filter.id} className={`badge border ${stateClass(filter.state)}`} title={filter.detail}>
										{filter.label}: {filter.state}
									</span>
								))}
							</div>
						</div>
					) : null}

					{ingress || legacyIngress ? (
						<div className="mt-3" data-pfsense-ingress-evidence>
							<strong>{french ? "Attribution Snort / PF" : "Snort / PF attribution"}</strong>
							<p className={`mb-1 mt-2 ${stateClass(ingress?.state ?? legacyIngress?.state)}`}>
								{ingress?.state ?? legacyIngress?.state}: {ingress?.evidence ?? legacyIngress?.evidence}
							</p>
							<ul className="mb-0">
								<li>telemetry: {(ingress?.telemetry_available ?? legacyIngress?.telemetry_available) ? "available" : "unavailable"}; attribution: {(ingress?.attribution_available ?? legacyIngress?.attribution_available) ? "available" : "unavailable"}</li>
								{ingress?.path ? <li>path: {ingress.path}</li> : null}
								{typeof ingress?.attempts === "number" ? <li>attempts: {ingress.attempts}{typeof ingress.elapsed_ms === "number" ? ` · ${ingress.elapsed_ms} ms` : ""}</li> : null}
								{ingress?.failure_stage || ingress?.error_kind ? <li className="text-warning">failure: {ingress.failure_stage ?? "unknown"} / {ingress.error_kind ?? "unknown"}{ingress.exception_type ? ` (${ingress.exception_type})` : ""}</li> : null}
								{ingress?.cached !== undefined ? <li>cache: {ingress.cached ? "cached" : "fresh"}{typeof ingress.cache_age_seconds === "number" ? ` · ${ingress.cache_age_seconds}s` : ""}{ingress.stale ? " · stale" : ""}</li> : null}
								{ingress?.last_success_at ? <li>{french ? "Dernier succès télémétrie" : "Telemetry last success"}: {dateLabel(ingress.last_success_at, french)}</li> : null}
								{ingress?.state === "telemetry_stale" ? <li className="text-warning">{french ? "La table snort2c connue est conservée, mais aucun verdict blocked/clear courant n’est déduit de données obsolètes." : "The last-known snort2c table is retained, but no current blocked/clear verdict is derived from stale data."}</li> : null}
								{(ingress?.control_path ?? legacyIngress?.control_path) ? (
									<li className={(ingress?.control_path?.blind_spot ?? legacyIngress?.control_path?.blind_spot) ? "text-warning" : undefined}>
										control path: {ingress?.control_path?.mode ?? legacyIngress?.control_path?.mode}{(ingress?.control_path?.blind_spot ?? legacyIngress?.control_path?.blind_spot) ? " · blind spot" : ""} — {ingress?.control_path?.detail ?? legacyIngress?.control_path?.detail}
									</li>
								) : null}
							</ul>
						</div>
					) : null}
				</div>
			</div>
		</details>
	);
}
