"use client";

import { useLocale } from "next-intl";
import type {
	HomelabHealthEntry,
	HomelabProbeSource,
} from "@/lib/homelabHealth";

type Props = {
	entry?: HomelabHealthEntry;
};

function seconds(value: number | null | undefined): string | null {
	return typeof value === "number" && Number.isFinite(value)
		? `${Math.max(0, Math.round(value))}s`
		: null;
}

function sourceLabel(
	source: HomelabProbeSource | undefined,
	french: boolean,
): string {
	switch (source) {
		case "origin":
			return french ? "origine fraîche" : "fresh origin";
		case "memory":
			return french ? "mémoire conservée" : "retained memory";
		case "deadline":
			return "deadline";
		default:
			return french ? "provenance inconnue" : "unknown provenance";
	}
}

function sourceIcon(entry: HomelabHealthEntry): string {
	if (entry.probe_stale === true) return "fas fa-clock-rotate-left";
	if (entry.probe_source === "origin") return "fas fa-satellite-dish";
	if (entry.probe_source === "memory") return "fas fa-database";
	if (entry.probe_source === "deadline" || entry.timed_out === true)
		return "fas fa-stopwatch";
	return "fas fa-circle-question";
}

function reachabilityLabel(
	value: boolean | null | undefined,
	french: boolean,
): string {
	if (value === true) return french ? "joignable" : "reachable";
	if (value === false) return french ? "injoignable" : "unreachable";
	return french ? "non confirmée" : "unconfirmed";
}

export default function ServiceProbeEvidence({ entry }: Readonly<Props>) {
	const french = useLocale() === "fr";
	if (!entry) return null;

	const hasRollingEvidence =
		entry.probe_source !== undefined ||
		entry.probe_age_seconds !== undefined ||
		entry.probe_stale !== undefined ||
		entry.probe_interval_seconds !== undefined ||
		entry.next_probe_in_seconds !== undefined ||
		Boolean(entry.probe_refresh_error);
	if (!hasRollingEvidence) return null;

	const age = seconds(entry.probe_age_seconds);
	const staleAfter = seconds(entry.probe_stale_after_seconds);
	const interval = seconds(entry.probe_interval_seconds);
	const next = seconds(entry.next_probe_in_seconds);
	const details = [
		age ? `${french ? "âge" : "age"} ${age}` : null,
		staleAfter
			? `${french ? "stale après" : "stale after"} ${staleAfter}`
			: null,
		interval
			? `${french ? "cadence estimée" : "estimated cadence"} ~${interval}`
			: null,
		next ? `${french ? "prochaine sonde" : "next probe"} ~${next}` : null,
	].filter((value): value is string => value !== null);

	return (
		<div
			className={`small text-start mt-2 ${entry.probe_stale ? "text-warning" : "text-muted"}`}
			data-probe-evidence
			data-probe-source={entry.probe_source ?? "unknown"}
			data-probe-stale={entry.probe_stale === true ? "true" : "false"}
		>
			<span>
				<i className={sourceIcon(entry)} aria-hidden="true" />{" "}
				{sourceLabel(entry.probe_source, french)}
				{details.length > 0 ? ` · ${details.join(" · ")}` : ""}
			</span>
			{entry.probe_stale === true ? (
				<span className="d-block" data-probe-last-known>
					<i className="fas fa-clock-rotate-left" aria-hidden="true" />{" "}
					{french ? "Dernier état connu" : "Last known state"}:{" "}
					{entry.last_known_state ?? "unknown"}
					{" · "}
					{reachabilityLabel(entry.last_known_reachable, french)}
					{typeof entry.last_known_http_status === "number"
						? ` · HTTP ${entry.last_known_http_status}`
						: ""}
				</span>
			) : null}
			{entry.probe_refresh_error ? (
				<span className="d-block" data-probe-refresh-error>
					<i className="fas fa-rotate" aria-hidden="true" /> Refresh:{" "}
					{entry.probe_refresh_error}
				</span>
			) : null}
		</div>
	);
}
