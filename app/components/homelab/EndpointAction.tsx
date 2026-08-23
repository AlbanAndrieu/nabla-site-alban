"use client";

import { useEffect, useState } from "react";
import type { HomelabHealthEntry } from "@/lib/homelabHealth";

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

function classifyHttpStatus(status: number): HealthState {
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
	if (["healthy", "active", "up", "ok"].includes(normalized ?? "")) return "limegreen";
	if (["degraded", "warning", "warn"].includes(normalized ?? "")) return "gold";
	if (["down", "inactive", "failed", "fail"].includes(normalized ?? "")) return "red";
	return "gray";
}

function fastApiHealthDetail(entry: HomelabHealthEntry): string {
	const status = entry.http_status || "network error";
	const latency = typeof entry.latency_ms === "number" ? `, ${entry.latency_ms} ms` : "";
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

async function probePrivateEndpoint(
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
		if (signal.aborted) return { state: "fail", detail: "Browser endpoint probe timed out" };
	}

	const origin = new URL(url).origin.replace(/\/$/, "");
	for (const path of ["/favicon.ico", "/favicon.png", "/apple-touch-icon.png"]) {
		if (await probeImage(`${origin}${path}?_np=${Date.now()}`, signal)) {
			return { state: "ok", detail: "Endpoint responded from this browser (favicon probe)" };
		}
		if (signal.aborted) return { state: "fail", detail: "Browser endpoint probe timed out" };
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
	const [privateHealth, setPrivateHealth] = useState<HealthState>(
		configured && !external ? "pending" : "unknown",
	);
	const [privateDetail, setPrivateDetail] = useState(
		configured ? "Checking private endpoint from this browser…" : "Endpoint not configured for use",
	);

	useEffect(() => {
		if (external || !url || !enabled) return;

		let parsed: URL;
		try {
			parsed = new URL(url);
		} catch {
			setPrivateHealth("fail");
			setPrivateDetail("Invalid endpoint URL");
			return;
		}
		if (!["http:", "https:"].includes(parsed.protocol)) {
			setPrivateHealth("unknown");
			setPrivateDetail(`${parsed.protocol} endpoint is not HTTP-probed`);
			return;
		}

		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), 10_000);
		setPrivateHealth("pending");
		setPrivateDetail("Checking private endpoint from this browser…");
		void probePrivateEndpoint(url, controller.signal).then((result) => {
			if (!controller.signal.aborted) {
				setPrivateHealth(result.state);
				setPrivateDetail(result.detail);
			}
		});

		return () => {
			window.clearTimeout(timeout);
			controller.abort();
		};
	}, [enabled, external, url]);

	const health: HealthState = external
		? truenasDown
			? "fail"
			: (initialHealth?.state ?? "unknown")
		: privateHealth;
	const tlsTrusted = external ? initialHealth?.tls_trusted : undefined;
	const detail = !configured
		? url
			? "Endpoint URL retained for inventory but not configured for use"
			: "No endpoint URL configured"
		: external
			? truenasDown
				? "TrueNAS dependency is down; external service marked unavailable"
				: initialHealth
					? fastApiHealthDetail(initialHealth)
					: "Public health snapshot unavailable"
			: privateDetail;
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
