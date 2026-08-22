"use client";

import { useEffect, useState } from "react";

type HealthState = "pending" | "ok" | "warn" | "fail" | "unknown";

type Props = {
	url?: string;
	secure?: boolean;
	external: boolean;
	label: string;
};

const HEALTH_CLASS: Record<HealthState, string> = {
	pending: "btn-outline-primary",
	ok: "btn-outline-success",
	warn: "btn-outline-warning",
	fail: "btn-outline-danger",
	unknown: "btn-outline-secondary",
};

const LOCK_COLOR: Record<HealthState, string> = {
	pending: "gray",
	ok: "limegreen",
	warn: "gold",
	fail: "red",
	unknown: "gray",
};

function classifyPublicEndpoint(payload: {
	status?: number;
	tlsError?: boolean;
}): HealthState {
	if (payload.tlsError === true) return "fail";
	const status = typeof payload.status === "number" ? payload.status : 0;
	if (status >= 200 && status <= 399) return "ok";
	if ([401, 403, 404, 429].includes(status)) return "warn";
	return status === 0 ? "unknown" : "fail";
}

async function probeImage(url: string, signal: AbortSignal): Promise<boolean> {
	return await new Promise((resolve) => {
		const image = new Image();
		const done = (result: boolean) => {
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
): Promise<boolean> {
	try {
		await fetch(url, {
			method: "GET",
			mode: "no-cors",
			cache: "no-store",
			signal,
		});
		return true;
	} catch {
		if (signal.aborted) return false;
	}

	const origin = new URL(url).origin.replace(/\/$/, "");
	for (const path of ["/favicon.ico", "/favicon.png", "/apple-touch-icon.png"]) {
		if (await probeImage(`${origin}${path}?_np=${Date.now()}`, signal)) {
			return true;
		}
		if (signal.aborted) return false;
	}
	return false;
}

export default function EndpointAction({ url, secure, external, label }: Props) {
	const [health, setHealth] = useState<HealthState>(url ? "pending" : "unknown");
	const [detail, setDetail] = useState(
		url ? "Checking endpoint…" : "No endpoint configured",
	);

	useEffect(() => {
		if (!url) {
			setHealth("unknown");
			setDetail("No endpoint configured");
			return;
		}

		let parsed: URL;
		try {
			parsed = new URL(url);
		} catch {
			setHealth("fail");
			setDetail("Invalid endpoint URL");
			return;
		}

		if (!['http:', 'https:'].includes(parsed.protocol)) {
			setHealth("unknown");
			setDetail(`${parsed.protocol} endpoint is not HTTP-probed`);
			return;
		}

		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), 6500);
		setHealth("pending");
		setDetail(external ? "Checking public endpoint…" : "Checking private endpoint from this browser…");

		void (async () => {
			try {
				if (external) {
					const response = await fetch(
						`/api/homelab-tunnel-check?url=${encodeURIComponent(url)}`,
						{ cache: "no-store", signal: controller.signal },
					);
					if (!response.ok) {
						setHealth("unknown");
						setDetail(`Endpoint check API returned HTTP ${response.status}`);
						return;
					}
					const payload = (await response.json()) as {
						status?: number;
						tlsError?: boolean;
					};
					const next = classifyPublicEndpoint(payload);
					setHealth(next);
					setDetail(
						`Public endpoint probe: HTTP ${payload.status ?? "?"}${payload.tlsError ? ", TLS error" : ""}`,
					);
					return;
				}

				const reachable = await probePrivateEndpoint(url, controller.signal);
				setHealth(reachable ? "ok" : "fail");
				setDetail(
					reachable
						? "Private endpoint reachable from this browser; HTTPS/TLS accepted when applicable"
						: "Private endpoint unreachable from this browser, blocked, or TLS was rejected",
				);
			} catch {
				if (!controller.signal.aborted) {
					setHealth("unknown");
					setDetail("Endpoint health check failed");
				}
			} finally {
				window.clearTimeout(timeout);
			}
		})();

		return () => {
			window.clearTimeout(timeout);
			controller.abort();
		};
	}, [external, url]);

	if (!url) {
		return (
			<span
				className="btn btn-outline-secondary btn-sm d-block disabled"
				aria-disabled="true"
				title={detail}
			>
				<i className="fas fa-link" aria-hidden="true" /> {label}
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
			{secure === true && url.startsWith("https://") && (
				<i
					className="fas fa-lock"
					style={{ color: LOCK_COLOR[health], marginLeft: 5 }}
					aria-label={`HTTPS endpoint health: ${health}`}
				/>
			)}
		</a>
	);
}
