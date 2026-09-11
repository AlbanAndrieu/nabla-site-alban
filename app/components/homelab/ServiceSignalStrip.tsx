"use client";

import { useLocale } from "next-intl";
import type {
	HomelabHealthEntry,
	HomelabHealthState,
} from "@/lib/homelabHealth";
import { homelabHealthColor } from "@/lib/homelabHealthPresentation";
import {
	type HomelabServiceSignalId,
	homelabServiceSignals,
} from "@/lib/homelabServiceSignals";

type Props = { entry?: HomelabHealthEntry };

const SIGNAL_ICON: Record<HomelabServiceSignalId, string> = {
	public: "fas fa-globe",
	internal: "fas fa-network-wired",
	runtime: "fas fa-server",
	dependencies: "fas fa-diagram-project",
	cloudflare: "fas fa-cloud",
	tls: "fas fa-lock",
	probe: "fas fa-satellite-dish",
};

const STATE_ICON: Record<HomelabHealthState, string> = {
	ok: "fas fa-circle-check",
	warn: "fas fa-triangle-exclamation",
	fail: "fas fa-circle-xmark",
	unknown: "fas fa-circle-question",
};

const LABELS: Record<HomelabServiceSignalId, [string, string]> = {
	public: ["Public", "Public"],
	internal: ["LAN", "LAN"],
	runtime: ["Runtime", "Runtime"],
	dependencies: ["Dependencies", "Dépendances"],
	cloudflare: ["Cloudflare", "Cloudflare"],
	tls: ["TLS", "TLS"],
	probe: ["Probe", "Sonde"],
};

export default function ServiceSignalStrip({ entry }: Readonly<Props>) {
	const french = useLocale() === "fr";
	const signals = homelabServiceSignals(entry);
	if (signals.length === 0) return null;

	return (
		<div
			className="d-flex flex-wrap justify-content-center gap-2 mt-2 small"
			role="list"
			aria-label={
				french ? "Signaux de santé du service" : "Service health signals"
			}
			data-service-signal-strip
		>
			{signals.map((signal) => {
				const label = LABELS[signal.id][french ? 1 : 0];
				const color = homelabHealthColor(signal.state);
				return (
					<span
						key={signal.id}
						className="d-inline-flex align-items-center gap-1 border rounded px-2 py-1"
						role="listitem"
						data-service-signal={signal.id}
						data-service-signal-state={signal.state}
						title={`${label}: ${signal.detail}`}
						aria-label={`${label}: ${signal.detail}`}
						style={{ color, borderColor: color }}
					>
						<i className={SIGNAL_ICON[signal.id]} aria-hidden="true" />
						<span>{label}</span>
						<i className={STATE_ICON[signal.state]} aria-hidden="true" />
					</span>
				);
			})}
		</div>
	);
}
