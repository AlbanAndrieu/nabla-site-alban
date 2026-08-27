"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { HomelabHealthEntry } from "@/lib/homelabHealth";
import {
	cloudflareIndicatorColor,
	hasCloudflareEvidence,
	homelabHealthColor,
	isHttpsEndpoint,
	tlsIndicatorColor,
} from "@/lib/homelabHealthPresentation";
import styles from "./EndpointAction.module.css";

type HealthState = "pending" | "ok" | "warn" | "fail" | "unknown";
type TunnelIndicatorState = "healthy" | "missing" | "degraded" | "unknown";

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

type ProbeDetail =
	| { kind: "checking" }
	| { kind: "notConfigured" }
	| { kind: "invalidUrl" }
	| { kind: "protocol"; protocol: string }
	| { kind: "http"; status: number }
	| { kind: "timeout" }
	| { kind: "favicon" }
	| { kind: "unreadable" };

const HEALTH_CLASS: Record<HealthState, string> = {
	pending: "btn-outline-primary",
	ok: "btn-outline-success",
	warn: "btn-outline-warning",
	fail: "btn-outline-danger",
	unknown: "btn-outline-secondary",
};

function classifyHttpStatus(status: number): HealthState {
	if (status >= 200 && status <= 399) return "ok";
	if ([401, 403, 407, 429].includes(status)) return "warn";
	return "fail";
}

function snapshotHealth(entry: HomelabHealthEntry): HealthState {
	if (entry.application_error) return "fail";
	return entry.state;
}

function hasAuthoritativeEvidence(entry?: HomelabHealthEntry): boolean {
	if (!entry) return false;
	return Boolean(
		entry.application_error ||
			entry.direct_state != null ||
			entry.internal_state != null ||
			entry.runtime_state != null ||
			entry.tunnel_status?.trim() ||
			entry.http_status > 0 ||
			entry.state !== "unknown",
	);
}

function tunnelIndicatorState(
	tunnelSecure: boolean,
	entry?: HomelabHealthEntry,
): TunnelIndicatorState {
	if (!tunnelSecure || !entry) return "unknown";
	const normalized = entry.tunnel_status?.trim().toLowerCase();
	if (!normalized) return "missing";
	if (["healthy", "active", "up", "ok"].includes(normalized)) return "healthy";
	return "degraded";
}

function snapshotAgeSeconds(checkedAt?: string): number | null {
	if (!checkedAt) return null;
	const timestamp = Date.parse(checkedAt);
	if (!Number.isFinite(timestamp)) return null;
	return Math.max(0, Math.round((Date.now() - timestamp) / 1000));
}

function probeImage(url: string, signal: AbortSignal): Promise<boolean> {
	return new Promise((resolve) => {
		const image = new Image();
		let settled = false;
		const done = (result: boolean) => {
			if (settled) return;
			settled = true;
			image.onload = null;
			image.onerror = null;
			resolve(result);
		};
		image.onload = () => done(true);
		image.onerror = () => done(false);
		signal.addEventListener("abort", () => done(false), { once: true });
		image.src = url;
	});
}

async function probePrivateEndpoint(
	url: string,
	signal: AbortSignal,
): Promise<{ state: HealthState; detail: ProbeDetail }> {
	try {
		let response = await fetch(url, {
			method: "HEAD",
			mode: "cors",
			cache: "no-store",
			signal,
		});
		if (response.status === 405 || response.status === 501) {
			response = await fetch(url, {
				method: "GET",
				mode: "cors",
				cache: "no-store",
				signal,
			});
		}
		return {
			state: classifyHttpStatus(response.status),
			detail: { kind: "http", status: response.status },
		};
	} catch {
		if (signal.aborted) return { state: "fail", detail: { kind: "timeout" } };
	}

	const origin = new URL(url).origin.replace(/\/$/, "");
	for (const path of ["/favicon.ico", "/favicon.png", "/apple-touch-icon.png"]) {
		if (await probeImage(`${origin}${path}?_np=${Date.now()}`, signal)) {
			return { state: "ok", detail: { kind: "favicon" } };
		}
		if (signal.aborted) return { state: "fail", detail: { kind: "timeout" } };
	}
	return { state: "fail", detail: { kind: "unreadable" } };
}

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
	const configured = enabled && Boolean(url);
	const https = isHttpsEndpoint(url);
	const authoritativeSnapshot = hasAuthoritativeEvidence(initialHealth);
	const supplementWithPrivateProbe =
		configured && !external && !authoritativeSnapshot;
	const [privateHealth, setPrivateHealth] = useState<HealthState>(
		supplementWithPrivateProbe ? "pending" : "unknown",
	);
	const [privateDetail, setPrivateDetail] = useState<ProbeDetail>(
		configured ? { kind: "checking" } : { kind: "notConfigured" },
	);

	useEffect(() => {
		if (!supplementWithPrivateProbe || !url) return;

		let parsed: URL;
		try {
			parsed = new URL(url);
		} catch {
			setPrivateHealth("fail");
			setPrivateDetail({ kind: "invalidUrl" });
			return;
		}
		if (!["http:", "https:"].includes(parsed.protocol)) {
			setPrivateHealth("unknown");
			setPrivateDetail({ kind: "protocol", protocol: parsed.protocol });
			return;
		}

		let disposed = false;
		const controller = new AbortController();
		const timeout = window.setTimeout(() => {
			controller.abort();
			if (!disposed) {
				setPrivateHealth("fail");
				setPrivateDetail({ kind: "timeout" });
			}
		}, 10_000);
		setPrivateHealth("pending");
		setPrivateDetail({ kind: "checking" });
		void probePrivateEndpoint(url, controller.signal).then((result) => {
			if (!disposed) {
				window.clearTimeout(timeout);
				setPrivateHealth(result.state);
				setPrivateDetail(result.detail);
			}
		});

		return () => {
			disposed = true;
			window.clearTimeout(timeout);
			controller.abort();
		};
	}, [supplementWithPrivateProbe, url]);

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
		const status = entry.http_status > 0 ? String(entry.http_status) : "not probed";
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

	const snapshotState = initialHealth ? snapshotHealth(initialHealth) : undefined;
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
	const tlsTrusted = initialHealth?.tls_trusted;
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
	const applicationError = initialHealth?.application_error;
	const applicationErrorTitle = applicationError
		? t("applicationError", { error: applicationError })
		: "";
	const healthColor = homelabHealthColor(health);
	const showCloudflare = tunnelSecure && hasCloudflareEvidence(initialHealth);
	const ageSeconds = snapshotAgeSeconds(snapshotCheckedAt);
	const evidence = [
		typeof initialHealth?.http_status === "number" && initialHealth.http_status > 0
			? `HTTP ${initialHealth.http_status}`
			: null,
		initialHealth?.direct_state ? `direct ${initialHealth.direct_state}` : null,
		initialHealth?.runtime_state ? `TrueNAS ${initialHealth.runtime_state}` : null,
		initialHealth?.internal_state ? `internal ${initialHealth.internal_state}` : null,
		showCloudflare && initialHealth?.tunnel_status
			? `Cloudflare ${initialHealth.tunnel_status}`
			: null,
	].filter((item): item is string => Boolean(item));
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
				{https && (
					<i
						className="fas fa-lock"
						style={{ color: tlsIndicatorColor(undefined), marginLeft: 5 }}
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
				className={`btn ${HEALTH_CLASS[health]} btn-sm d-block`}
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
				{https && (
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
						aria-label={tunnelTitle}
					/>
				)}
				{applicationError && (
					<>
						<i
							className="fas fa-skull-crossbones"
							style={{ color: homelabHealthColor("fail"), marginLeft: 6 }}
							title={applicationErrorTitle}
							aria-label={applicationErrorTitle}
						/>{" "}
						<span>{t("applicationErrorShort")}</span>
					</>
				)}
			</a>
			{initialHealth && (
				<small className="text-muted d-block" data-health-evidence>
					<i className="fas fa-wave-square" aria-hidden="true" />{" "}
					{evidenceLabel}
					{" · "}
					<i className="fas fa-clock" aria-hidden="true" /> {ageLabel}
				</small>
			)}
		</>
	);
}
