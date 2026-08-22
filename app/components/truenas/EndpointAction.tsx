"use client";

import { useEffect, useState } from "react";

type HealthState = "pending" | "ok" | "warn" | "fail" | "unknown";

type Props = {
	url?: string;
	secure?: boolean;
	enabled: boolean;
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

function classifyHttpStatus(status: number, tlsError = false): HealthState {
	if (tlsError) return "fail";
	if (status >= 200 && status <= 399) return "ok";
	if ([401, 403, 407, 429].includes(status)) return "warn";
	return "fail";
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
			detail: `Private endpoint probe: HTTP ${response.status}`,
		};
	} catch {
		if (signal.aborted) {
			return { state: "fail", detail: "Private endpoint probe timed out" };
		}
	}

	const origin = new URL(url).origin.replace(/\/$/, "");
	for (const path of ["/favicon.ico", "/favicon.png", "/apple-touch-icon.png"]) {
		if (await probeImage(`${origin}${path}?_np=${Date.now()}`, signal)) {
			return {
				state: "ok",
				detail: "Private endpoint responded from this browser (favicon probe)",
			};
		}
		if (signal.aborted) {
			return { state: "fail", detail: "Private endpoint probe timed out" };
		}
	}
	return {
		state: "fail",
		detail:
			"Private endpoint did not return a readable HTTP response or common favicon",
	};
}

export default function EndpointAction({
	url,
	secure,
	enabled,
	external,
	label,
}: Props) {
	const configured = enabled && Boolean(url);
	const [health, setHealth] = useState<HealthState>(
		configured ? "pending" : "unknown",
	);
	const [detail, setDetail] = useState(
		configured ? "Checking endpoint…" : "Endpoint not configured for use",
	);

	useEffect(() => {
		if (!url || !enabled) {
			setHealth("unknown");
			setDetail(
				url
					? "Endpoint URL retained for inventory but not configured for use"
					: "No endpoint URL configured",
			);
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

		if (!["http:", "https:"].includes(parsed.protocol)) {
			setHealth("unknown");
			setDetail(`${parsed.protocol} endpoint is not HTTP-probed`);
			return;
		}

		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), 10_000);
		setHealth("pending");
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
						setHealth("unknown");
						setDetail(`Endpoint check API returned HTTP ${response.status}`);
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
					setDetail(
						`Public endpoint probe: HTTP ${status || "network error"}${payload.tlsError ? ", TLS error" : ""}`,
					);
					return;
				}

				const result = await probePrivateEndpoint(url, controller.signal);
				if (controller.signal.aborted) return;
				setHealth(result.state);
				setDetail(result.detail);
			} catch {
				if (!controller.signal.aborted) {
					setHealth("fail");
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
	}, [enabled, external, url]);

	if (!url || !enabled) {
		return (
			<span
				className="btn btn-outline-secondary btn-sm d-block disabled"
				aria-disabled="true"
				title={detail}
				data-endpoint-url={url}
			>
				<i className="fas fa-link" aria-hidden="true" /> {label}{" "}
				<i
					className="fas fa-lock"
					style={{ color: LOCK_COLOR.unknown, marginLeft: 5 }}
					aria-hidden="true"
				/>
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
