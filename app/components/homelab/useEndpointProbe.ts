"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { classifyHttpStatus, type ProbeDetail } from "./endpointHealth";
import type { EndpointHealthState } from "./homelabGridPresentation";

type HealthState = EndpointHealthState;

const subscribeToHydration = () => () => undefined;
const clientHydratedSnapshot = () => true;
const serverHydratedSnapshot = () => false;

export function useHydrated(): boolean {
	return useSyncExternalStore(
		subscribeToHydration,
		clientHydratedSnapshot,
		serverHydratedSnapshot,
	);
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
	for (const path of [
		"/favicon.ico",
		"/favicon.png",
		"/apple-touch-icon.png",
	]) {
		if (await probeImage(`${origin}${path}?_np=${Date.now()}`, signal)) {
			return { state: "ok", detail: { kind: "favicon" } };
		}
		if (signal.aborted) return { state: "fail", detail: { kind: "timeout" } };
	}
	return { state: "fail", detail: { kind: "unreadable" } };
}

/**
 * Browser-side reachability probe for private endpoints that lack an
 * authoritative FastAPI snapshot. Times out after ten seconds.
 */
export function useEndpointProbe(
	url: string | undefined,
	configured: boolean,
	supplementWithPrivateProbe: boolean,
): { privateHealth: HealthState; privateDetail: ProbeDetail } {
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
			return;
		}
		if (!["http:", "https:"].includes(parsed.protocol)) return;

		let disposed = false;
		const controller = new AbortController();
		const timeout = window.setTimeout(() => {
			controller.abort();
			if (!disposed) {
				setPrivateHealth("fail");
				setPrivateDetail({ kind: "timeout" });
			}
		}, 10_000);
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

	return { privateHealth, privateDetail };
}
