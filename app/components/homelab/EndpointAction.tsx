"use client";

import { useTranslations } from "next-intl";
import type { HomelabHealthEntry } from "@/lib/homelabHealth";
import {
	cloudflareIndicatorColor,
	hasCloudflareEvidence,
	homelabHealthColor,
	homelabHealthTextColor,
	isHttpsEndpoint,
	tlsIndicatorColor,
} from "@/lib/homelabHealthPresentation";
import styles from "./EndpointAction.module.css";
import {
	endpointEvidenceItems,
	hasAuthoritativeEvidence,
	type ProbeDetail,
	snapshotAgeSeconds,
	snapshotHealth,
	tunnelIndicatorState,
} from "./endpointHealth";
import {
	ENDPOINT_HEALTH_CLASS,
	type EndpointHealthState,
} from "./homelabGridPresentation";
import ServiceTroubleshootingEvidence from "./ServiceTroubleshootingEvidence";
import { useEndpointProbe, useHydrated } from "./useEndpointProbe";

type HealthState = EndpointHealthState;

type Props = {
	url?: string;
	enabled: boolean;
	external: boolean;
	tunnelSecure: boolean;
	label: string;
	initialHealth?: HomelabHealthEntry;
	snapshotCheckedAt?: string;
	truenasDown?: boolean;
};

export default function EndpointAction({
	url,
	enabled,
	external,
	tunnelSecure,
	label,
	initialHealth,
	snapshotCheckedAt,
	truenasDown = false,
}: Props) {
	const t = useTranslations("homelab.endpoint");
	const hydrated = useHydrated();
	const configured = enabled && Boolean(url);
	const https = isHttpsEndpoint(url);
	const authoritativeSnapshot = hasAuthoritativeEvidence(initialHealth);
	const supplementWithPrivateProbe =
		configured && !external && !authoritativeSnapshot;
	const { privateHealth, privateDetail } = useEndpointProbe(
		url,
		configured,
		supplementWithPrivateProbe,
	);

	const translateProbeDetail = (detail: ProbeDetail): string => {
		switch (detail.kind) {
			case "checking":
				return t("checkingPrivate");
			case "notConfigured":
				return t("notConfigured");
			case "invalidUrl":
				return t("invalidUrl");
			case "protocol":
				return t("protocolNotProbed", { protocol: detail.protocol });
			case "http":
				return t("browserProbeHttp", { status: detail.status });
			case "timeout":
				return t("browserProbeTimedOut");
			case "favicon":
				return t("browserProbeFavicon");
			case "unreadable":
				return t("browserProbeUnreadable");
		}
	};

	const fastApiHealthDetail = (entry: HomelabHealthEntry): string => {
		const status =
			entry.http_status > 0 ? String(entry.http_status) : "not probed";
		const latency =
			typeof entry.latency_ms === "number" ? `, ${entry.latency_ms} ms` : "";
		const tls = entry.tls_trusted === false ? `, ${t("tlsError")}` : "";
		const tunnel = entry.tunnel_status
			? `, ${t("tunnel")} ${entry.tunnel_status}${entry.tunnel_name ? ` (${entry.tunnel_name})` : ""}`
			: "";
		const runtime = entry.runtime_state
			? `, TrueNAS ${entry.runtime_state}${entry.runtime_app ? ` (${entry.runtime_app})` : ""}`
			: "";
		const internal = entry.internal_state
			? `, internal ${entry.internal_state}`
			: "";
		const applicationError = entry.application_error
			? ` — ${t("applicationError", { error: entry.application_error })}`
			: "";
		const error = entry.error ? ` — ${entry.error}` : "";
		return `${t("fastApiSnapshot", { status })}${tls}${tunnel}${runtime}${internal}${latency}${applicationError}${error}`;
	};

	const snapshotState = initialHealth
		? snapshotHealth(initialHealth)
		: undefined;
	const privateProbeIsAuthoritative =
		privateDetail.kind === "http" || privateDetail.kind === "favicon";
	const health: HealthState = truenasDown
		? "fail"
		: authoritativeSnapshot && snapshotState
			? snapshotState
			: supplementWithPrivateProbe && privateHealth === "pending"
				? "pending"
				: supplementWithPrivateProbe && privateProbeIsAuthoritative
					? privateHealth
					: (snapshotState ??
						(external
							? "unknown"
							: privateHealth === "fail"
								? "unknown"
								: privateHealth));
	const tlsTrusted = hydrated ? initialHealth?.tls_trusted : undefined;
	const browserDetail = translateProbeDetail(privateDetail);
	const apiDetail = initialHealth ? fastApiHealthDetail(initialHealth) : "";
	const detail = !configured
		? url
			? t("inventoryOnly")
			: t("noUrl")
		: truenasDown
			? t("dependencyDown")
			: authoritativeSnapshot && initialHealth
				? apiDetail
				: supplementWithPrivateProbe
					? `${browserDetail}${apiDetail ? `; ${apiDetail}` : ""}`
					: initialHealth
						? apiDetail
						: external
							? t("publicSnapshotUnavailable")
							: browserDetail;
	const tunnelState = tunnelIndicatorState(tunnelSecure, initialHealth);
	const tunnelTitle =
		tunnelState === "healthy"
			? t("tunnelConfigured", {
					status: initialHealth?.tunnel_status ?? "healthy",
					name: initialHealth?.tunnel_name ?? "Cloudflare",
				})
			: tunnelState === "missing"
				? t("tunnelMissing")
				: tunnelState === "degraded"
					? t("tunnelDegraded", {
							status: initialHealth?.tunnel_status ?? "unknown",
						})
					: t("tunnelUnknown");
	const applicationError = hydrated
		? initialHealth?.application_error
		: undefined;
	const applicationErrorTitle = applicationError
		? t("applicationError", { error: applicationError })
		: "";
	const healthColor = homelabHealthTextColor(health);
	const showCloudflare =
		hydrated && tunnelSecure && hasCloudflareEvidence(initialHealth);
	const ageSeconds = hydrated ? snapshotAgeSeconds(snapshotCheckedAt) : null;
	const evidence = endpointEvidenceItems(initialHealth, showCloudflare);
	const evidenceLabel =
		evidence.length > 0
			? t("evidence", { evidence: evidence.join(" · ") })
			: t("evidenceUnavailable");
	const ageLabel =
		ageSeconds === null
			? t("snapshotAgeUnknown")
			: t("snapshotAge", { seconds: ageSeconds });

	if (!url || !enabled) {
		return (
			<span
				className="btn btn-outline-secondary btn-sm d-block disabled"
				aria-disabled="true"
				title={detail}
				data-endpoint-url={url}
				style={{ color: homelabHealthColor("unknown") }}
			>
				<i className="fas fa-link" aria-hidden="true" /> {label}{" "}
				{hydrated && https && (
					<i
						className="fas fa-lock"
						style={{ color: tlsIndicatorColor(undefined), marginLeft: 5 }}
						role="img"
						aria-label={t("httpsUnknown")}
					/>
				)}
			</span>
		);
	}

	return (
		<>
			<a
				href={url}
				className={`btn ${ENDPOINT_HEALTH_CLASS[health]} btn-sm d-block`}
				target="_blank"
				rel="noopener noreferrer"
				title={`${external ? t("publicKind") : t("privateKind")} — ${detail}`}
				style={{ color: healthColor, borderColor: healthColor }}
				data-health-state={health}
			>
				<i className="fas fa-link" aria-hidden="true" /> {label}{" "}
				{health === "pending" && (
					<span className={styles.pending} aria-live="polite">
						{t("pending")}
					</span>
				)}
				{hydrated && https && (
					<i
						className="fas fa-lock"
						style={{ color: tlsIndicatorColor(tlsTrusted), marginLeft: 5 }}
						title={
							tlsTrusted === false
								? t("httpsInvalid")
								: tlsTrusted === true
									? t("httpsTrusted")
									: t("httpsUnknown")
						}
						role="img"
						aria-label={
							tlsTrusted === false
								? t("httpsInvalid")
								: tlsTrusted === true
									? t("httpsTrusted")
									: t("httpsUnknown")
						}
					/>
				)}
				{showCloudflare && (
					<i
						className="fas fa-cloud"
						style={{
							color: cloudflareIndicatorColor(initialHealth),
							marginLeft: 6,
						}}
						title={tunnelTitle}
						role="img"
						aria-label={tunnelTitle}
					/>
				)}
				{applicationError && (
					<>
						<i
							className="fas fa-skull-crossbones"
							style={{ color: homelabHealthColor("fail"), marginLeft: 6 }}
							title={applicationErrorTitle}
							role="img"
							aria-label={applicationErrorTitle}
						/>{" "}
						<span>{t("applicationErrorShort")}</span>
					</>
				)}
			</a>
			{initialHealth && (
				<>
					<small className="text-muted d-block" data-health-evidence>
						<i className="fas fa-wave-square" aria-hidden="true" />{" "}
						{evidenceLabel}
						{" · "}
						<i className="fas fa-clock" aria-hidden="true" /> {ageLabel}
					</small>
					<ServiceTroubleshootingEvidence entry={initialHealth} />
				</>
			)}
		</>
	);
}
