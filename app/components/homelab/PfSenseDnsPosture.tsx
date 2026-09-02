"use client";

import { useTranslations } from "next-intl";
import type {
	HomelabHealthSnapshot,
	HomelabHealthState,
	PfSenseDnsPosture,
} from "@/lib/homelabHealth";

const ALERT_CLASS: Record<HomelabHealthState, string> = {
	ok: "alert-success",
	warn: "alert-warning",
	fail: "alert-danger",
	unknown: "alert-secondary",
};

const ICON_CLASS: Record<HomelabHealthState, string> = {
	ok: "fas fa-circle-check",
	warn: "fas fa-triangle-exclamation",
	fail: "fas fa-circle-xmark",
	unknown: "fas fa-circle-question",
};

type Props = {
	snapshot: HomelabHealthSnapshot | null;
	healthUnavailable?: boolean;
};

function postureMessage(
	posture: PfSenseDnsPosture | undefined,
	t: ReturnType<typeof useTranslations>,
): string {
	if (!posture || !posture.configured) return t("dns.unconfigured");
	if (posture.reachable === false) return t("dns.unreachable");
	if (posture.policy_state === "fail") return t("dns.resolverFailed");
	if (posture.upstream?.truenas_only === true) return t("dns.truenasOnly");
	if (
		posture.policy_state === "ok" &&
		posture.upstream?.independent_from_truenas === true
	) {
		return t("dns.independent");
	}
	return t("dns.incomplete");
}

function resolverLabel(
	posture: PfSenseDnsPosture | undefined,
	t: ReturnType<typeof useTranslations>,
): string | null {
	const resolver = posture?.resolver;
	if (!resolver) return null;
	const runtime =
		resolver.running === true
			? t("dns.resolverRunning")
			: resolver.running === false
				? t("dns.resolverStopped")
				: t("dns.resolverUnknown");
	const mode =
		resolver.forwarding === false
			? t("dns.modeRecursive")
			: resolver.forwarding === true
				? t("dns.modeForwarding")
				: t("dns.modeUnknown");
	return `${runtime} · ${mode}`;
}

export default function PfSenseDnsPosture({
	snapshot,
	healthUnavailable = false,
}: Readonly<Props>) {
	const t = useTranslations("homelab");
	const posture = snapshot?.pfsense?.dns;
	const state = posture?.policy_state ?? "unknown";
	const resolver = resolverLabel(posture, t);
	const upstreamCount = posture?.upstream?.count;

	return (
		<div
			className={`alert ${ALERT_CLASS[state]} mb-3`}
			role="status"
			data-pfsense-dns-policy={state}
			data-pfsense-dns-configured={posture?.configured ?? false}
			data-pfsense-dns-truenas-only={posture?.upstream?.truenas_only ?? false}
		>
			<strong>
				<i className={ICON_CLASS[state]} aria-hidden="true" /> {t("dns.title")}
			</strong>
			{" — "}
			{postureMessage(posture, t)}
			{resolver ? ` ${resolver}.` : ""}
			{typeof upstreamCount === "number"
				? ` ${t("dns.upstreamCount", { count: upstreamCount })}.`
				: ""}
			{healthUnavailable ? ` ${t("dns.snapshotStale")}` : ""}
			<details className="small mt-2" data-pfsense-dns-evidence>
				<summary className="fw-semibold">{t("dns.details")}</summary>
				{posture?.reason ? (
					<div className="mt-1">
						<strong>{t("dns.reasonLabel")}:</strong> {posture.reason}
					</div>
				) : null}
				<div className="mt-1">{t("dns.evidenceNote")}</div>
			</details>
		</div>
	);
}
