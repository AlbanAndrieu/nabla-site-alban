"use client";

import { useTranslations } from "next-intl";
import type { HomelabHealthEntry, HomelabHealthSnapshot } from "@/lib/homelabHealth";
import { reconcileHomelabHealth } from "@/lib/homelabHealthReconciliation";
import {
	homelabServiceEndpointUrl,
	type HomelabService,
	type HomelabServicesCatalog,
} from "@/lib/homelabServices";
import EndpointAction from "./EndpointAction";

type Props = {
	catalog: HomelabServicesCatalog;
	snapshot: HomelabHealthSnapshot | null;
};

type HealthIndex = {
	byId: Map<string, HomelabHealthEntry>;
	byUrl: Map<string, HomelabHealthEntry>;
};

function serviceIconPath(iconSrc?: string): string {
	if (!iconSrc) return "/assets/selfh-icons/generic-app.svg";
	if (/^https?:\/\//i.test(iconSrc)) return iconSrc;
	return `/${iconSrc}`;
}

function healthIndex(snapshot: HomelabHealthSnapshot | null): HealthIndex {
	const byId = new Map<string, HomelabHealthEntry>();
	const byUrl = new Map<string, HomelabHealthEntry>();
	for (const entry of snapshot?.services ?? []) {
		if (entry.id) byId.set(entry.id, entry);
		try {
			const url = new URL(entry.url);
			url.hash = "";
			byUrl.set(url.href, entry);
		} catch {
			// The same-origin proxy validates FastAPI payloads; ignore malformed extras defensively.
		}
	}
	return { byId, byUrl };
}

function lookupHealth(
	index: HealthIndex,
	service: HomelabService,
	url: string,
): HomelabHealthEntry | undefined {
	if (service.id) {
		const byId = index.byId.get(service.id);
		if (byId) return byId;
	}
	try {
		const normalized = new URL(url);
		normalized.hash = "";
		return index.byUrl.get(normalized.href);
	} catch {
		return undefined;
	}
}

function reconciledHealth(entry?: HomelabHealthEntry): HomelabHealthEntry | undefined {
	if (!entry) return undefined;
	const reconciliation = reconcileHomelabHealth(entry);
	return { ...entry, state: reconciliation.state };
}

export default function HomelabServiceGrid({ catalog, snapshot }: Props) {
	const t = useTranslations("homelab");
	const services: HomelabService[] = catalog.services;
	const serviceHealth = healthIndex(snapshot);
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
					const endpointUrl = homelabServiceEndpointUrl(svc);
					// Exposure policy and navigation are independent. Only an explicit
					// endpointEnabled=false disables the link.
					const endpointEnabled = svc.endpointEnabled !== false;
					const initialHealth = reconciledHealth(
						lookupHealth(serviceHealth, svc, endpointUrl),
					);

					return (
						<div
							className="col-md-4 p-3"
							key={`${svc.id ?? svc.name}:${endpointUrl}`}
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
											url={endpointUrl}
											enabled={endpointEnabled}
											external={isExternal}
											tunnelSecure={svc.tunnelSecure === true}
											label={t("endpoint.external")}
											initialHealth={initialHealth}
											snapshotCheckedAt={snapshot?.checked_at}
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
