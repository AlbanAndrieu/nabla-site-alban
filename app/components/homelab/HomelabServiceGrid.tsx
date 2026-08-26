"use client";

import { useTranslations } from "next-intl";
import type { HomelabHealthEntry, HomelabHealthSnapshot } from "@/lib/homelabHealth";
import type { HomelabService, HomelabServicesCatalog } from "@/lib/homelabServices";
import EndpointAction from "./EndpointAction";

type Props = {
	catalog: HomelabServicesCatalog;
	snapshot: HomelabHealthSnapshot | null;
};

function isInternalEndpointUrl(url?: string): boolean {
	if (!url) return false;
	try {
		return new URL(url).hostname.endsWith(".int.albandrieu.com");
	} catch {
		return false;
	}
}

function serviceIconPath(iconSrc?: string): string {
	if (!iconSrc) return "/assets/selfh-icons/generic-app.svg";
	if (/^https?:\/\//i.test(iconSrc)) return iconSrc;
	return `/${iconSrc}`;
}

function healthByUrl(snapshot: HomelabHealthSnapshot | null) {
	const map = new Map<string, HomelabHealthEntry>();
	for (const entry of snapshot?.services ?? []) {
		try {
			const url = new URL(entry.url);
			url.hash = "";
			map.set(url.href, entry);
		} catch {
			// FastAPI payload is validated by the same-origin proxy; ignore malformed extras defensively.
		}
	}
	return map;
}

function lookupHealth(
	map: Map<string, HomelabHealthEntry>,
	url?: string,
): HomelabHealthEntry | undefined {
	if (!url) return undefined;
	try {
		const normalized = new URL(url);
		normalized.hash = "";
		return map.get(normalized.href);
	} catch {
		return undefined;
	}
}

export default function HomelabServiceGrid({ catalog, snapshot }: Props) {
	const t = useTranslations("homelab");
	const services: HomelabService[] = catalog.services;
	const serviceHealth = healthByUrl(snapshot);
	const truenasPublic = snapshot?.truenas?.public;
	const truenasInternal = snapshot?.truenas?.internal;
	// A cloud runtime cannot normally reach the private 172.17.x.x address. If the
	// public TrueNAS endpoint is reachable, an internal-probe failure must not mark
	// the host itself as down.
	const truenasPublicUp =
		truenasPublic?.reachable === true && truenasPublic.state !== "fail";
	const truenasDown = !truenasPublicUp && snapshot?.truenas?.state === "fail";
	const truenasWarning = !truenasPublicUp && snapshot?.truenas?.state === "warn";

	return (
		<>
			{(truenasDown || truenasWarning) && (
				<div
					className={`alert ${truenasDown ? "alert-danger" : "alert-warning"}`}
					role="alert"
				>
					<strong>
						<i className="fas fa-triangle-exclamation" aria-hidden="true" />{" "}
						{truenasDown ? t("truenas.down") : t("truenas.degraded")}
					</strong>
					{" — "}
					{t("truenas.publicProbe", { state: truenasPublic?.state ?? "unknown" })}
					{truenasInternal
						? `; ${t("truenas.internalProbe", {
								host: truenasInternal.host,
								port: truenasInternal.port,
								state: truenasInternal.state,
							})}`
						: `; ${t("truenas.internalUnavailable")}`}
					. {t("truenas.dependencyNote")}
				</div>
			)}
			<div className="row service-grid">
				{services.map((svc) => {
					const hasInternal =
						typeof svc.internalHost === "string" && Boolean(svc.internalPort);
					const isExternal = svc.external === true;
					const endpointEnabled =
						svc.endpointEnabled ??
						(isExternal || isInternalEndpointUrl(svc.tunnelUrl));
					const initialHealth = lookupHealth(serviceHealth, svc.tunnelUrl);

					return (
						<div
							className="col-md-4 p-3"
							key={`${svc.name}:${svc.tunnelUrl ?? svc.internalHost ?? "local"}`}
						>
							<div className="card box-shadow h-100 service-card-ux">
								<img
									className="img-fluid d-block mx-auto p-4"
									src={serviceIconPath(svc.iconSrc)}
									width={80}
									height={80}
									alt={svc.name}
									loading="lazy"
									decoding="async"
									style={{ minHeight: 60, minWidth: 60, height: "auto" }}
								/>
								<div className="card-body text-center border-top border-secondary">
									<h3 className="h5 card-title mb-1">{svc.name}</h3>
									<p className="card-text text-muted small mb-0">{svc.description}</p>
									<div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
										<EndpointAction
											url={svc.tunnelUrl}
											enabled={endpointEnabled}
											external={isExternal}
											label={t("endpoint.external")}
											initialHealth={initialHealth}
											truenasDown={truenasDown}
										/>
										{hasInternal && (
											<a
												href={`${svc.internalSecure ? "https" : "http"}://${svc.internalHost}:${svc.internalPort}`}
												className="btn btn-outline-secondary btn-sm d-block"
												target="_blank"
												rel="noopener noreferrer"
											>
												{svc.internalSecure && (
													<i
														className="fas fa-lock"
														style={{ color: "gray", marginRight: 5 }}
														title={t("truenas.internalTlsTitle")}
														aria-label={t("truenas.internalTlsAria")}
													/>
												)}
												{t("endpoint.internal")} ({svc.internalHost}:{svc.internalPort})
											</a>
										)}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}
