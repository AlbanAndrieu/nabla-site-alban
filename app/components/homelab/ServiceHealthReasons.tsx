"use client";

import { useLocale, useTranslations } from "next-intl";
import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
	HomelabHealthState,
} from "@/lib/homelabHealth";
import {
	type HomelabHealthReason,
	homelabHealthReasons,
} from "@/lib/homelabHealthPresentation";
import statusStyles from "./HomelabStatusSurface.module.css";
import styles from "./HomelabServicesBlock.module.css";
import ServiceOperatorDiagnostics from "./ServiceOperatorDiagnostics";
import ServiceOwnerEvidenceSummary from "./ServiceOwnerEvidenceSummary";
import ServiceProbeEvidence from "./ServiceProbeEvidence";
import ServiceSignalStrip from "./ServiceSignalStrip";

type Props = {
	entry?: HomelabHealthEntry;
	state: HomelabHealthState;
	tunnelExpected: boolean;
	cloudflareConfigured?: boolean;
	runtimeStale?: boolean;
	snapshot?: HomelabHealthSnapshot | null;
	ownerView?: boolean;
	healthUnavailable?: boolean;
};

type HealthReasonMessageKey =
	| "health.reasons.runtimeInventoryMismatch"
	| "health.reasons.runtimeDown"
	| "health.reasons.publicEndpointDown"
	| "health.reasons.internalEndpointDown"
	| "health.reasons.applicationError"
	| "health.reasons.tunnelMissing"
	| "health.reasons.tunnelDown"
	| "health.reasons.tunnelUnobserved"
	| "health.reasons.runtimeStale"
	| "health.reasons.tunnelStale"
	| "health.reasons.staleEvidence"
	| "health.reasons.probeUnconfirmed"
	| "health.reasons.accessProtectedUnverified";

function reasonKey(reason: HomelabHealthReason): HealthReasonMessageKey {
	switch (reason.kind) {
		case "runtime_inventory_mismatch":
			return "health.reasons.runtimeInventoryMismatch";
		case "runtime_down":
			return "health.reasons.runtimeDown";
		case "public_endpoint_down":
			return "health.reasons.publicEndpointDown";
		case "internal_endpoint_down":
			return "health.reasons.internalEndpointDown";
		case "application_error":
			return "health.reasons.applicationError";
		case "tunnel_missing":
			return "health.reasons.tunnelMissing";
		case "tunnel_down":
			return "health.reasons.tunnelDown";
		case "tunnel_unobserved":
			return "health.reasons.tunnelUnobserved";
		case "runtime_stale":
			return "health.reasons.runtimeStale";
		case "tunnel_stale":
			return "health.reasons.tunnelStale";
		case "stale_evidence":
			return "health.reasons.staleEvidence";
		case "access_protected_unverified":
			return "health.reasons.accessProtectedUnverified";
		case "probe_unconfirmed":
			return "health.reasons.probeUnconfirmed";
	}
}

export default function ServiceHealthReasons({
	entry,
	state,
	tunnelExpected,
	cloudflareConfigured,
	runtimeStale,
	snapshot,
	ownerView = false,
	healthUnavailable = false,
}: Props) {
	const t = useTranslations("homelab");
	const french = useLocale() === "fr";
	const signalStrip = <ServiceSignalStrip entry={entry} />;
	const probeEvidence = <ServiceProbeEvidence entry={entry} />;
	const ownerEvidence = ownerView ? snapshot ? (
		<ServiceOwnerEvidenceSummary
			entry={entry}
			snapshot={snapshot}
			unavailable={healthUnavailable}
		/>
	) : (
		<p className="small text-warning mt-2 mb-1" data-service-evidence-unavailable>
			{t("health.states.unknown")} · {french
				? "Docker, TLS, Cloudflare, Prometheus et sondes indisponibles"
				: "Docker, TLS, Cloudflare, Prometheus and probes unavailable"}
		</p>
	) : null;
	const operatorDiagnostics = (
		<ServiceOperatorDiagnostics entry={entry}>
			{ownerView ? <>{probeEvidence}{ownerEvidence}</> : null}
		</ServiceOperatorDiagnostics>
	);
	// Keep the diagnostics disclosure at one React position across status
	// transitions, so a fresh probe does not reset its expanded state.
	const hasHealthIssue = state === "fail" || state === "warn";
	const reasons = hasHealthIssue ? homelabHealthReasons(entry, {
		tunnelExpected,
		cloudflareConfigured,
		runtimeStale,
	}) : [];
	const severityClass =
		state === "fail" ? statusStyles.fail : statusStyles.warn;

	return (
		<>
			{ownerView ? (
				<div className={styles.serviceSignalSlot} data-owner-signal-slot>
					{signalStrip}
				</div>
			) : signalStrip}
			{hasHealthIssue ? (
				<div
					className={`${statusStyles.surface} ${severityClass} small text-start mt-3 mb-0`}
					data-health-reasons
					data-health-severity={state}
				>
					<strong>{t("health.reasonTitle")}</strong>
					{reasons.length > 0 ? (
						<ul className="mb-0 mt-1 ps-3">
							{reasons.map((reason, index) => (
								<li key={`${reason.kind}:${reason.detail ?? ""}:${index}`}>
									{reason.detail
										? t(reasonKey(reason), { detail: reason.detail })
										: t(reasonKey(reason))}
								</li>
							))}
						</ul>
					) : (
						<p className="mb-0 mt-1">
							{state === "fail"
								? t("health.reasons.genericFailure")
								: t("health.reasons.genericDegraded")}
						</p>
					)}
				</div>
			) : null}
			{operatorDiagnostics}
		</>
	);
}
