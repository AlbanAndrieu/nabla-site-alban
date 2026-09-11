"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import {
	type CloudflareControlPlaneStatus,
	cloudflareStatusIsUnconfirmed,
	cloudflareUnconfirmedReason,
	parseCloudflareControlPlaneStatus,
} from "@/lib/cloudflareStatus";

const EMPTY_STATUS: CloudflareControlPlaneStatus = {
	present: false,
	statusConfirmed: null,
	state: "unknown",
	reachable: null,
	apiReachable: null,
	lastKnownReachable: null,
	stale: false,
};

function statusIcon(value: boolean | null): string {
	if (value === true) return "fas fa-circle-check text-success";
	if (value === false) return "fas fa-circle-xmark text-danger";
	return "fas fa-circle-question text-warning";
}

export default function CloudflareStatusWarning() {
	const french = useLocale() === "fr";
	const [status, setStatus] = useState<CloudflareControlPlaneStatus>(EMPTY_STATUS);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		let active = true;
		let controller: AbortController | null = null;

		const load = async () => {
			if (document.hidden) return;
			controller?.abort();
			controller = new AbortController();
			try {
				const response = await fetch("/api/homelab-health", {
					cache: "no-store",
					signal: controller.signal,
					headers: { Accept: "application/json" },
				});
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const payload: unknown = await response.json();
				if (active) {
					setStatus(parseCloudflareControlPlaneStatus(payload));
					setLoaded(true);
				}
			} catch {
				if (active && !controller.signal.aborted) {
					setStatus(EMPTY_STATUS);
					setLoaded(true);
				}
			}
		};

		void load();
		const onVisibilityChange = () => {
			if (!document.hidden) void load();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			active = false;
			controller?.abort();
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, []);

	if (!loaded || !cloudflareStatusIsUnconfirmed(status)) return null;

	const backendDetail = status.warning ?? status.message;
	return (
		<div
			className="alert alert-warning py-2"
			role="status"
			data-cloudflare-status-unconfirmed
			data-cloudflare-error-kind={status.errorKind ?? "unknown"}
		>
			<div className="d-flex flex-wrap align-items-center gap-2">
				<strong>
					<i className="fas fa-cloud" aria-hidden="true" /> Cloudflare
				</strong>
				<span>
					<i className={statusIcon(status.apiReachable)} aria-hidden="true" />{" "}
					{french ? "API" : "API"}:{" "}
					{status.apiReachable === true
						? french
							? "joignable"
							: "reachable"
						: status.apiReachable === false
							? french
								? "injoignable"
								: "unreachable"
							: french
								? "non confirmée"
								: "unconfirmed"}
				</span>
				{typeof status.httpStatus === "number" ? (
					<span>
						<i className="fas fa-code" aria-hidden="true" /> HTTP {status.httpStatus}
					</span>
				) : null}
				{typeof status.tunnelCount === "number" ? (
					<span>
						<i className="fas fa-route" aria-hidden="true" /> {status.tunnelCount}{" "}
						{french ? "tunnel(s) observé(s)" : "tunnel(s) observed"}
					</span>
				) : null}
				{status.lastKnownReachable !== null ? (
					<span>
						<i className="fas fa-clock-rotate-left" aria-hidden="true" />{" "}
						{french ? "dernier état connu" : "last known"}:{" "}
						{status.lastKnownReachable
							? french
								? "joignable"
								: "reachable"
							: french
								? "injoignable"
								: "unreachable"}
					</span>
				) : null}
			</div>
			<p className="mb-1 mt-2">{cloudflareUnconfirmedReason(status, french)}</p>
			{backendDetail ? (
				<small className="d-block text-break" data-cloudflare-backend-detail>
					{backendDetail}
				</small>
			) : null}
			<small className="d-block mt-1">
				<i className="fas fa-shield-halved" aria-hidden="true" />{" "}
				{french
					? "Cette incertitude reste un avertissement : elle ne passe pas les services en panne ou en état dégradé."
					: "This uncertainty remains a warning and does not mark services down or degraded."}
			</small>
		</div>
	);
}
