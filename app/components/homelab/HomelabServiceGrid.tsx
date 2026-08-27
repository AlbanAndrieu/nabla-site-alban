"use client";

import { useTranslations } from "next-intl";
import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
	HomelabHealthState,
} from "@/lib/homelabHealth";
import { reconcileHomelabHealth } from "@/lib/homelabHealthReconciliation";
import { homelabHealthColor } from "@/lib/homelabHealthPresentation";
import {
	type HomelabService,
	type HomelabServicesCatalog,
	homelabServiceEndpointUrl,
	homelabServiceId,
} from "@/lib/homelabServices";
import EndpointAction from "./EndpointAction";

type Props = {
	catalog: HomelabServicesCatalog;
	snapshot: HomelabHealthSnapshot | null;
};

type HealthIndex = {
	byId: Map<string, HomelabHealthEntry>;
	byUrl: Map<string, HomelabHealthEntry>;
	byName: Map<string, HomelabHealthEntry>;
};

const INTERNAL_HEALTH_CLASS: Record<HomelabHealthState, string> = {
	ok: "btn-outline-success",
	warn: "btn-outline-warning",
	fail: "btn-outline-danger",
	unknown: "btn-outline-secondary",
};

function serviceIconPath(iconSrc?: string): string {
	if (!iconSrc) return "/assets/selfh-icons/generic-app.svg";
	if (/^https?:\/\//i.test(iconSrc)) return iconSrc;
	return `/${iconSrc}`;
}

function normalizedName(value: string): string {
	return value.trim().toLowerCase();
}

function healthIndex(snapshot: HomelabHealthSnapshot | null): HealthIndex {
	const byId = new Map<string, HomelabHealthEntry>();
	const byUrl = new Map<string, HomelabHealthEntry>();
	const byName = new Map<string, HomelabHealthEntry>();
	for (const entry of snapshot?.services ?? []) {
		if (entry.id) byId.set(entry.id, entry);
		byName.set(normalizedName(entry.name), entry);
		try {
			const url = new URL(entry.url);
			url.hash = "";
			byUrl.set(url.href, entry);
		} catch {
			// The same-origin proxy validates FastAPI payloads; ignore malformed extras defensively.
		}
	}
	return { byId, byUrl, byName };
}

function lookupHealth(
	index: HealthIndex,
	service: HomelabService,
	url: string,
): HomelabHealthEntry | undefined {
	const stableId = homelabServiceId(service);
	const byId = index.byId.get(stableId);
	if (byId) return byId;

	try {
		const normalized = new URL(url);
		normalized.hash = "";
		const byUrl = index.byUrl.get(normalized.href);
		if (byUrl) return byUrl;
	} catch {
		// Continue with the name fallback below.
	}

	return index.byName.get(normalizedName(service.name));
}

function serviceHealthEvidence(
	index: HealthIndex,
	service: HomelabService,
	url: string,
	snapshot: HomelabHealthSnapshot | null,
): HomelabHealthEntry | undefined {
	const generic = lookupHealth(index, service, url);
	if (homelabServiceId(service) !== "truenas" || !snapshot?.truenas?.public) {
		return generic;
	}

	const publicHealth = snapshot.truenas.public;
	return {
		...generic,
		...publicHealth,
		id: generic?.id ?? publicHealth.id ?? "truenas",
		name: generic?.name ?? publicHealth.name,
		url: publicHealth.url,
		state: snapshot.truenas.state,
		direct_state: publicHealth.state,
		internal_state:
			generic?.internal_state ?? snapshot.truenas.internal?.state ?? null,
	};
}

function reconciledHealth(
	entry: HomelabHealthEntry | undefined,
	service: HomelabService,
	schemaVersion?: number,
): HomelabHealthEntry | undefined {
	if (!entry) return undefined;
	// Schema v4 is already reconciled server-side from HTTP, TrueNAS runtime,
	// internal probes and Cloudflare evidence. Do not turn FastAPI `warn` into a
	// misleading green state by applying a second, different browser policy.
	if ((schemaVersion ?? 0) >= 4) return entry;

	const reconciliation = reconcileHomelabHealth(entry, {
		external: service.external === true,
		tunnelExpected: service.tunnelSecure === true,
	});
	return { ...entry, state: reconciliation.state };
}

function runtimeHealthState(state?: string | null): HomelabHealthState | null {
	const normalized = state?.trim().toUpperCase();
	if (!normalized) return null;
	if (["ACTIVE", "HEALTHY", "RUNNING", "STARTED", "UP"].includes(normalized)) {
		return "ok";
	}
	if (["CRASHED", "DOWN", "ERROR", "FAILED", "STOPPED"].includes(normalized)) {
		return "fail";
	}
	return "warn";
}

function internalPresentationState(
	entry: HomelabHealthEntry | undefined,
): HomelabHealthState {
	return (
		entry?.internal_state ??
		runtimeHealthState(entry?.runtime_state) ??
		entry?.state ??
		"unknown"
	);
}

export default function HomelabServiceGrid({ catalog, snapshot }: Props) {
	const t = useTranslations("homelab");
	const services: HomelabService[] = catalog.services;
	const serviceHealth = healthIndex(snapshot);
	const truenasPublic = snapshot?.truenas?.public;
	const truenasInternal = snapshot?.truenas?.internal;
	const truenasPublicUp =
		truenasPublic?.reachable === true && truenasPublic.state !== "fail";
	const truenasDown = !truenasPublicUp && snapshot?.truenas?.state === "fail";
	const truenasWarning =
		!truenasPublicUp && snapshot?.truenas?.state === "warn";

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
					{t("truenas.publicProbe", {
						state: truenasPublic?.state ?? "unknown",
					})}
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
					const endpointEnabled = svc.endpointEnabled !== false;
					const initialHealth = reconciledHealth(
						serviceHealthEvidence(serviceHealth, svc, endpointUrl, snapshot),
						svc,
						snapshot?.schema_version,
					);
					const dependsOnTrueNas =
						svc.internalHost === "172.17.0.24" ||
						initialHealth?.runtime_app != null;
					const internalState = internalPresentationState(initialHealth);
					const internalColor = homelabHealthColor(internalState);

					return (
						<div
							className="col-md-4 p-3"
							key={`${homelabServiceId(svc)}:${endpointUrl}`}
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
									<p className="card-text text-muted small mb-0">
										{svc.description}
									</p>
									<div
										style={{
											marginTop: 18,
											display: "flex",
											flexDirection: "column",
											gap: 8,
										}}
									>
										<EndpointAction
											url={endpointUrl}
											enabled={endpointEnabled}
											external={isExternal}
											tunnelSecure={svc.tunnelSecure === true}
											label={t("endpoint.external")}
											initialHealth={initialHealth}
											snapshotCheckedAt={snapshot?.checked_at}
											truenasDown={truenasDown && dependsOnTrueNas}
										/>
										{hasInternal && (
											<a
												href={`${svc.internalSecure ? "https" : "http"}://${svc.internalHost}:${svc.internalPort}`}
												className={`btn ${INTERNAL_HEALTH_CLASS[internalState]} btn-sm d-block`}
												target="_blank"
												rel="noopener noreferrer"
												style={{ color: internalColor, borderColor: internalColor }}
												data-health-state={internalState}
												title={`FastAPI/TrueNAS: ${internalState}`}
											>
												{svc.internalSecure && (
													<i
														className="fas fa-lock"
														style={{ color: internalColor, marginRight: 5 }}
														title={t("truenas.internalTlsTitle")}
														aria-label={t("truenas.internalTlsAria")}
													/>
												)}
												{t("endpoint.internal")} ({svc.internalHost}:
												{svc.internalPort})
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
