"use client";

import { useTranslations } from "next-intl";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";

type Props = {
	snapshot: HomelabHealthSnapshot | null;
	healthUnavailable: boolean;
	healthHttpStatus?: number | null;
	ownerBoundary?: boolean;
	readOnly?: boolean;
};

/**
 * One page-level runtime alert, kept outside collapsible service groups.
 * Never expose OWNER hosts or observations after revocation or in SERVICE.
 */
export default function HomelabRuntimeWarnings({
	snapshot: rawSnapshot,
	healthUnavailable,
	healthHttpStatus = null,
	ownerBoundary = false,
	readOnly = false,
}: Readonly<Props>) {
	const t = useTranslations("homelab");
	if (readOnly) return null;
	const snapshot = ownerBoundary ? null : rawSnapshot;
	const truenasPublic = snapshot?.truenas?.public;
	const truenasInternal = snapshot?.truenas?.internal;
	const truenasApi = snapshot?.truenas?.api;
	const truenasPublicUp =
		truenasPublic?.reachable === true && truenasPublic.state !== "fail";
	const truenasDown = !truenasPublicUp && snapshot?.truenas?.state === "fail";
	const truenasWarning = !truenasPublicUp && snapshot?.truenas?.state === "warn";
	const truenasRuntimeUnavailable =
		healthUnavailable ||
		truenasApi?.reachable === false ||
		snapshot?.truenas_runtime_reachable === false;
	const truenasRuntimeStale = snapshot?.truenas_runtime_stale === true;
	const runtimeWarningDetails: string[] = [];
	if (healthUnavailable) {
		runtimeWarningDetails.push(
			ownerBoundary
				? t("truenas.ownerBoundary")
				: t("truenas.liveSnapshotUnavailable", {
						status:
							healthHttpStatus === null
								? t("truenas.networkError")
								: `HTTP ${healthHttpStatus}`,
					}),
		);
	}
	if (truenasApi?.reachable === false) {
		runtimeWarningDetails.push(
			t("truenas.apiUnavailable", {
				error: truenasApi.error?.trim() || t("truenas.noErrorDetail"),
			}),
		);
	}
	if (snapshot?.truenas_runtime_reachable === false) {
		runtimeWarningDetails.push(t("truenas.runtimeUnavailable"));
	}
	if (truenasRuntimeStale) {
		runtimeWarningDetails.push(t("truenas.runtimeStale"));
	}

	return (
		<>
			{(truenasDown || truenasWarning) && (
				<div className={`alert ${truenasDown ? "alert-danger" : "alert-warning"}`} role="alert">
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
			{(truenasRuntimeUnavailable || truenasRuntimeStale) && (
				<div className="alert alert-warning" role="alert" data-truenas-runtime-warning>
					<strong>
						<i className="fas fa-triangle-exclamation" aria-hidden="true" />{" "}
						{t("truenas.runtimeDataUnavailable")}
					</strong>
					{" — "}
					{runtimeWarningDetails.join(" ")} {t("truenas.runtimeDependencyNote")}
				</div>
			)}
		</>
	);
}
