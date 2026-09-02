"use client";

import { useLocale } from "next-intl";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";

function stateClass(state?: string): string {
	const normalized = state?.toLowerCase();
	if (["ok", "clear", "running", "in_path", "observed"].includes(normalized ?? "")) {
		return "text-success";
	}
	if (["fail", "blocked", "stopped"].includes(normalized ?? "")) return "text-danger";
	if (["warn", "telemetry_unavailable", "attribution_unavailable"].includes(normalized ?? "")) {
		return "text-warning";
	}
	return "text-muted";
}

export default function HomelabPlatformEvidence({
	snapshot,
}: Readonly<{ snapshot: HomelabHealthSnapshot | null }>) {
	const french = useLocale() === "fr";
	if (!snapshot) return null;

	const dns = snapshot.pfsense?.dns;
	const ingress = dns?.ingress_block;
	const securityFilters = dns?.security_filters ?? [];
	const checkedAt = new Date(snapshot.checked_at);
	const checkedLabel = Number.isNaN(checkedAt.getTime())
		? snapshot.checked_at
		: checkedAt.toLocaleString(french ? "fr-FR" : "en-GB");

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
								<li>{french ? "Snapshot runtime obsolète" : "Runtime snapshot stale"}: {snapshot.truenas_runtime_stale ? "yes" : "no"}</li>
							</ul>
						</div>

						<div className="col-12 col-lg-4">
							<strong>Cloudflare</strong>
							<ul className="mb-0 mt-2">
								<li>{french ? "Observation configurée" : "Observation configured"}: {snapshot.cloudflare_configured === true ? "yes" : snapshot.cloudflare_configured === false ? "no" : "unknown"}</li>
								<li>{french ? "Tunnels observés" : "Observed tunnels"}: {snapshot.cloudflare_tunnels_observed ?? "unknown"}</li>
							</ul>
							<p className="text-muted mb-0 mt-2">
								{french
									? "Les cartes de services affichent ensuite le nom et l’état du tunnel quand FastAPI peut corréler le hostname public avec Cloudflare."
									: "Service cards expose the tunnel name and state when FastAPI can correlate the public hostname with Cloudflare."}
							</p>
						</div>

						<div className="col-12 col-lg-4">
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

					{ingress ? (
						<div className="mt-3" data-pfsense-ingress-evidence>
							<strong>{french ? "Attribution Snort / PF" : "Snort / PF attribution"}</strong>
							<p className={`mb-1 mt-2 ${stateClass(ingress.state)}`}>
								{ingress.state}: {ingress.evidence}
							</p>
							<ul className="mb-0">
								<li>telemetry: {ingress.telemetry_available ? "available" : "unavailable"}; attribution: {ingress.attribution_available ? "available" : "unavailable"}</li>
								{ingress.source?.ip ? <li>source: {ingress.source.ip} — {ingress.source.role}</li> : null}
								{ingress.destination?.ip ? <li>destination: {ingress.destination.ip}{ingress.destination.port ? `:${ingress.destination.port}` : ""} — {ingress.destination.role}</li> : null}
								{ingress.control_path ? (
									<li className={ingress.control_path.blind_spot ? "text-warning" : undefined}>
										control path: {ingress.control_path.mode}{ingress.control_path.blind_spot ? " · blind spot" : ""} — {ingress.control_path.detail}
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
