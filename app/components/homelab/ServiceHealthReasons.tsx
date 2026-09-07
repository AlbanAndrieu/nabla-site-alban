"use client";

import { useTranslations } from "next-intl";
import type {
	HomelabHealthEntry,
	HomelabHealthState,
} from "@/lib/homelabHealth";
import {
	homelabHealthReasons,
	type HomelabHealthReason,
} from "@/lib/homelabHealthPresentation";

type Props = {
	entry?: HomelabHealthEntry;
	state: HomelabHealthState;
	tunnelExpected: boolean;
	cloudflareConfigured?: boolean;
	runtimeStale?: boolean;
};

function reasonKey(reason: HomelabHealthReason): string {
	switch (reason.kind) {
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
	}
}

export default function ServiceHealthReasons({
	entry,
	state,
	tunnelExpected,
	cloudflareConfigured,
	runtimeStale,
}: Props) {
	const t = useTranslations("homelab");
	if (state !== "fail" && state !== "warn") return null;

	const reasons = homelabHealthReasons(entry, {
		tunnelExpected,
		cloudflareConfigured,
		runtimeStale,
	});
	const visibleReasons =
		reasons.length > 0
			? reasons
			: [
					{
						kind: state === "fail" ? "public_endpoint_down" : "stale_evidence",
						detail:
							state === "fail"
								? t("health.reasons.genericFailure")
								: t("health.reasons.genericDegraded"),
					} satisfies HomelabHealthReason,
				];

	return (
		<div
			className={`alert ${state === "fail" ? "alert-danger" : "alert-warning"} py-2 px-2 small text-start mt-3 mb-0`}
			data-health-reasons
			data-health-severity={state}
		>
			<strong>{t("health.reasonTitle")}</strong>
			<ul className="mb-0 mt-1 ps-3">
				{visibleReasons.map((reason, index) => (
					<li key={`${reason.kind}:${reason.detail ?? ""}:${index}`}>
						{reason.detail
							? t(reasonKey(reason), { detail: reason.detail })
							: t(reasonKey(reason))}
					</li>
				))}
			</ul>
		</div>
	);
}
