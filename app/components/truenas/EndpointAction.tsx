"use client";

import { useEffect, useState } from "react";
import type { HomelabHealthEntry } from "../../../lib/homelabHealth";

type HealthState = "pending" | "ok" | "warn" | "fail" | "unknown";

type Props = {
	url?: string;
	enabled: boolean;
	external: boolean;
	label: string;
	initialHealth?: HomelabHealthEntry;
	truenasDown?: boolean;
};

const HEALTH_CLASS: Record<HealthState, string> = {
	pending: "btn-outline-primary",
	ok: "btn-outline-success",
	warn: "btn-outline-warning",
	fail: "btn-outline-danger",
	unknown: "btn-outline-secondary",
};

function classifyHttpStatus(status: number, tlsError = false): HealthState {
	if (tlsError) return "fail";
	if (status >= 200 && status <= 399) return "ok";
	if ([401, 403, 407, 429].includes(status)) return "warn";
	return "fail";
}

function isHttpsUrl(url?: string): boolean {
	if (!url) return false;
	try {
		return new URL(url).protocol === "https:";
	} catch {
		return false;
	}
}

function tlsColor(trusted: boolean | null | undefined): string {
	if (trusted === true) return "limegreen";
	if (trusted === false) return "red";
	return "gray";
}

function tunnelColor(status: string | null | undefined): string {
	const normalized = status?.trim().toLowerCase();
	if (["healthy", "active", "up", "ok"].includes(normalized ?? "")) {
		return "limegreen";
	}
	if (["degraded", "warning", "warn"].includes(normalized ?? "")) {
		return "gold";
	}
	if (["down", "inactive", "failed", "fail"].includes(normalized ?? "")) {
		return "red";
	}
	return "gray";
}

function fastApiHealthDetail(entry: HomelabHealthEntry): string {
	const status = entry.http_status || "network error";
	const latency =
		typeof entry.latency_ms === "number" ? `, ${entry.latency_ms} ms` : "";
	const tls = entry.tls_trusted === false ? ", TLS error" : "";
	const tunnel = entry.tunnel_status
		? `, tunnel ${entry.tunnel_status}${entry.tunnel_name ? ` (${entry.tunnel_name})` : ""}`
		: "";
	const error = entry.error ? ` — ${entry.error}` : "";
	return `FastAPI health snapshot: HTTP ${status}${tls}${tunnel}${latency}${error}`;
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

async function probeBrowserEndpoint(
	url: string,
	signal: AbortSignal,
): Promise<{ state: HealthState; detail: string }> {
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
			detail: `Browser endpoint probe: HTTP ${response.status}`,
		};
	} catch {
		if (signal.aborted) {
			return { state: "fail", detail: "Browser endpoint probe timed out" };
		}
	}

	const origin = new URL(url).origin.replace(/\/$/, "");
	for (const path of ["/favicon.ico", "/favicon.png", "/apple-touch-icon.png"]) {
		if (await probeImage(`${origin}${path}?_np=${Date.now()}`, signal)) {
			return {
				state: "ok",
				detail: "Endpoint responded from this browser (favicon probe)",
			};
		}
		if (signal.aborted) {
			return { state: "fail", detail: "Browser endpoint probe timed out" };
		}
	}
	return {
		state: "fail",
		detail: "Endpoint did not return a readable HTTP response or common favicon",
	};
}

export default function EndpointAction({
	url,
	enabled,
	external,
	label,
	initialHealth,
	truenasDown = false,
}: Props) {
	const configured = enabled && Boolean(url);
	const https = isHttpsUrl(url);
	const snapshotHealth = external ? initialHealth : undefined;
	const initialState = truenasDown && external
		? "fail"
		: (snapshotHealth?.state ?? (configured ? "pending" : "unknown"));
	const [health, setHealth] = useState<HealthState>(initialState);
	const [tlsTrusted, setTlsTrusted] = useState<boolean | null | undefined>(
		snapshotHealth?.tls_trusted,
	);
	const [detail, setDetail] = useState(
		truenasDown && external
			? "TrueNAS dependency is down; external service marked unavailable"
			: snapshotHealth
				? fastApiHealthDetail(snapshotHealth)
				: configured
					? "Checking endpoint…"
					: "Endpoint not configured for use",
	);

	useEffect(() => {
		if (!url || !enabled) {
			setHealth("unknown");
			setTlsTrusted(undefined);
			setDetail(
				url
					? "Endpoint URL retained for inventory but not configured for use"
					: "No endpoint URL configured",
			);
			return;
		}

		if (truenasDown && external) {
			setHealth("fail");
			setTlsTrusted(initialHealth?.tls_trusted);
			setDetail("TrueNAS dependency is down; external service marked unavailable");
			return;
		}

		let parsed: URL;
		try {
			parsed = new URL(url);
		} catch {
			setHealth("fail");
			setTlsTrusted(undefined);
			setDetail("Invalid endpoint URL");
			return;
		}

		if (!["http:", "https:"].includes(parsed.protocol)) {
			setHealth("unknown");
			setTlsTrusted(undefined);
			setDetail(`${parsed.protocol} endpoint is not HTTP-probed`);
			return;
		}

		if (external && initialHealth) {
			setHealth(initialHealth.state);
			setTlsTrusted(initialHealth.tls_trusted);
			setDetail(fastApiHealthDetail(initialHealth));
			return;
		}

		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), 10_000);
		setHealth("pending");
		setTlsTrusted(undefined);
		setDetail(
			external
				? "Checking public endpoint…"
				: "Checking private endpoint from this browser…",
		);

		void (async () => {
			try {
				if (external) {
					const response = await fetch(
						`/api/homelab-tunnel-check?url=${encodeURIComponent(url)}`,
						{ cache: "no-store", signal: controller.signal },
					);
					if (!response.ok) {
						const fallback = await probeBrowserEndpoint(url, controller.signal);
						if (controller.signal.aborted) return;
						setHealth(fallback.state);
						setDetail(
							`Endpoint check API returned HTTP ${response.status}; ${fallback.detail}`,
						);
						return;
					}
					const payload = (await response.json()) as {
						status?: number;
						tlsError?: boolean;
					};
					const status =
						typeof payload.status === "number" ? payload.status : 0;
					const next = classifyHttpStatus(status, payload.tlsError === true);
					setHealth(next);
					setTlsTrusted(payload.tlsError === true ? false : status > 0 ? true : undefined);
					setDetail(
						`Public endpoint probe: HTTP ${status || "network error"}${payload.tlsError ? ", TLS error" : ""}`,
					);
					return;
				}

				const result = await probeBrowserEndpoint(url, controller.signal);
				if (controller.signal.aborted) return;
				setHealth(result.state);
				setDetail(result.detail);
			} catch {
				if (!controller.signal.aborted) {
					const fallback = await probeBrowserEndpoint(url, controller.signal);
					if (controller.signal.aborted) return;
					setHealth(fallback.state);
					setDetail(`Endpoint health check failed; ${fallback.detail}`);
				}
			} finally {
				window.clearTimeout(timeout);
			}
		})();

		return () => {
			window.clearTimeout(timeout);
			controller.abort();
		};
	}, [enabled, external, initialHealth, truenasDown, url]);

	const tunnelStatus = external ? initialHealth?.tunnel_status : undefined;
	const tunnelTitle = tunnelStatus
		? `Cloudflare tunnel: ${tunnelStatus}${initialHealth?.tunnel_name ? ` (${initialHealth.tunnel_name})` : ""}`
		: "Cloudflare tunnel status not observed yet";

	if (!url || !enabled) {
		return (
			<span
				className="btn btn-outline-secondary btn-sm d-block disabled"
				aria-disabled="true"
				title={detail}
				data-endpoint-url={url}
			>
				<i className="fas fa-link" aria-hidden="true" /> {label}{" "}
				{https && (
					<i
						className="fas fa-lock"
						style={{ color: "gray", marginLeft: 5 }}
						aria-label="HTTPS certificate status unknown"
					/>
				)}
			</span>
		);
	}

	return (
		<a
			href={url}
			className={`btn ${HEALTH_CLASS[health]} btn-sm d-block`}
			target="_blank"
			rel="noopener noreferrer"
			title={`${external ? "Public" : "Internal/private"} endpoint — ${detail}`}
		>
			<i className="fas fa-link" aria-hidden="true" /> {label}{" "}
			{https && (
				<i
					className="fas fa-lock"
					style={{ color: tlsColor(tlsTrusted), marginLeft: 5 }}
					aria-label={
						tlsTrusted === false
							? "HTTPS certificate invalid"
							: tlsTrusted === true
								? "HTTPS certificate trusted"
								: "HTTPS certificate status unknown"
					}
				/>
			)}
			{external && (
				<i
					className="fas fa-cloud"
					style={{ color: tunnelColor(tunnelStatus), marginLeft: 6 }}
					title={tunnelTitle}
					aria-label={tunnelTitle}
				/>
			)}
		</a>
	);
}
