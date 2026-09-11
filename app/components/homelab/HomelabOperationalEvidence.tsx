"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import AnchoredHeading from "@/components/AnchoredHeading";
import type { HomelabObservabilitySnapshot } from "@/lib/homelabObservability";
import HomelabOperationalControlPlane from "./HomelabOperationalControlPlane";
import HomelabOperationalDeepDiagnostics from "./HomelabOperationalDeepDiagnostics";
import styles from "./HomelabOperationalEvidence.module.css";
import HomelabOperationalExposure from "./HomelabOperationalExposure";
import HomelabOperationalFreshness from "./HomelabOperationalFreshness";
import HomelabOperationalMetrics from "./HomelabOperationalMetrics";
import HomelabOperationalPfSenseDetails from "./HomelabOperationalPfSenseDetails";
import HomelabOperationalRuntime from "./HomelabOperationalRuntime";
import PfSenseDnsPosture from "./PfSenseDnsPosture";
import useAnchoredDetails from "./useAnchoredDetails";

const REFRESH_MS = 30_000;

export default function HomelabOperationalEvidence() {
	const t = useTranslations("operations");
	const [evidence, setEvidence] = useState<HomelabObservabilitySnapshot | null>(null);
	const [refreshing, setRefreshing] = useState(true);
	const [unavailable, setUnavailable] = useState(false);
	const pfsenseDetails = useAnchoredDetails(
		"pfsense-operational-evidence",
		Boolean(evidence?.pfsense),
	);

	useEffect(() => {
		let active = true;
		let controller: AbortController | null = null;

		const load = async () => {
			if (document.hidden) return;
			controller?.abort();
			controller = new AbortController();
			setRefreshing(true);
			try {
				const response = await fetch("/api/homelab-observability", {
					cache: "no-store",
					signal: controller.signal,
					headers: { Accept: "application/json" },
				});
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const payload = (await response.json()) as HomelabObservabilitySnapshot;
				if (active) {
					setEvidence(payload);
					setUnavailable(false);
				}
			} catch {
				if (active && !controller.signal.aborted) setUnavailable(true);
			} finally {
				if (active && !controller.signal.aborted) setRefreshing(false);
			}
		};

		void load();
		const timer = window.setInterval(() => void load(), REFRESH_MS);
		const onVisibilityChange = () => {
			if (!document.hidden) void load();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			active = false;
			controller?.abort();
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, []);

	const boardStatus = refreshing
		? t("board.refreshing")
		: unavailable && !evidence
			? t("board.unavailable")
			: evidence?.board.state === "pending"
				? t("board.pending")
				: evidence?.board.state === "stale"
					? t("board.stale")
					: t("board.fresh");

	return (
		<div
			id="operational-evidence"
			className={styles.panel}
			role="region"
			aria-labelledby="operational-evidence-title"
			data-homelab-operational-evidence
		>
			<div className={styles.header}>
				<div>
					<AnchoredHeading
						id="operational-evidence-title"
						as="h2"
						className={styles.title}
					>
						{t("title")}
					</AnchoredHeading>
					<p className={styles.lead}>{t("lead")}</p>
				</div>
				<div className={styles.boardStatus} role="status" aria-live="polite">
					<i
						className={
							refreshing || evidence?.board.refreshing
								? "fas fa-rotate fa-spin"
								: "fas fa-clock-rotate-left"
						}
						aria-hidden="true"
					/>{" "}
					{boardStatus}
					{typeof evidence?.board.ageSeconds === "number"
						? ` · ${t("board.age", {
								seconds: Math.round(evidence.board.ageSeconds),
							})}`
						: ""}
					{typeof evidence?.refreshElapsedMs === "number"
						? ` · ${t("board.probeDuration", {
								milliseconds: evidence.refreshElapsedMs,
							})}`
						: ""}
				</div>
			</div>

			{evidence ? (
				<>
					<HomelabOperationalControlPlane
						evidence={evidence}
						onInspectPfSense={() => pfsenseDetails.reveal("smooth")}
					/>
					<HomelabOperationalMetrics evidence={evidence} />
					{evidence.healthSnapshot?.pfsense?.dns ? (
						<PfSenseDnsPosture
							snapshot={evidence.healthSnapshot}
							healthUnavailable={unavailable || evidence.board.state === "stale"}
						/>
					) : null}
					<HomelabOperationalRuntime evidence={evidence} />
					<HomelabOperationalDeepDiagnostics evidence={evidence} />
					<HomelabOperationalPfSenseDetails
						evidence={evidence}
						open={pfsenseDetails.open}
						onToggle={pfsenseDetails.setOpen}
					/>
					<HomelabOperationalExposure evidence={evidence} />
					<HomelabOperationalFreshness evidence={evidence} />
				</>
			) : (
				<div className={styles.emptyState} role={unavailable ? "alert" : "status"}>
					{boardStatus}
				</div>
			)}
		</div>
	);
}
