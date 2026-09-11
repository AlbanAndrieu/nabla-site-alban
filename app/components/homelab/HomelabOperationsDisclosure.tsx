"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
	type HomelabHealthSnapshot,
	parseHomelabHealthSnapshot,
} from "@/lib/homelabHealth";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import { parseServiceTopology } from "@/lib/serviceTopology";
import HomelabObservationCoverage from "./HomelabObservationCoverage";
import HomelabOperationalEvidence from "./HomelabOperationalEvidence";
import HomelabProbeDiagnostics from "./HomelabProbeDiagnostics";
import styles from "./HomelabOperationsDisclosure.module.css";

type CoverageState = {
	snapshot: HomelabHealthSnapshot | null;
	catalogServiceCount: number;
	topologyNodeCount: number;
	topologyRelationCount: number;
	loaded: boolean;
	error: boolean;
};

const EMPTY_COVERAGE: CoverageState = {
	snapshot: null,
	catalogServiceCount: 0,
	topologyNodeCount: 0,
	topologyRelationCount: 0,
	loaded: false,
	error: false,
};

function catalogCount(value: unknown): number {
	if (!value || typeof value !== "object") return 0;
	const services = (value as Partial<HomelabServicesCatalog>).services;
	return Array.isArray(services) ? services.length : 0;
}

export default function HomelabOperationsDisclosure() {
	const t = useTranslations("operations");
	const french = useLocale() === "fr";
	const [open, setOpen] = useState(false);
	const [coverage, setCoverage] = useState<CoverageState>(EMPTY_COVERAGE);

	useEffect(() => {
		if (!open || coverage.loaded) return;
		const controller = new AbortController();

		void Promise.all([
			fetch("/api/homelab-health", {
				cache: "no-store",
				signal: controller.signal,
				headers: { Accept: "application/json" },
			}),
			fetch("/api/homelab-services", {
				cache: "no-store",
				signal: controller.signal,
				headers: { Accept: "application/json" },
			}),
			fetch("/api/homelab-topology", {
				cache: "no-store",
				signal: controller.signal,
				headers: { Accept: "application/json" },
			}),
		])
			.then(async ([healthResponse, catalogResponse, topologyResponse]) => {
				const healthPayload = healthResponse.ok
					? await healthResponse.json()
					: null;
				const catalogPayload = catalogResponse.ok
					? await catalogResponse.json()
					: null;
				const topologyPayload = topologyResponse.ok
					? await topologyResponse.json()
					: null;
				const topology = parseServiceTopology(topologyPayload);
				setCoverage({
					snapshot: parseHomelabHealthSnapshot(healthPayload),
					catalogServiceCount: catalogCount(catalogPayload),
					topologyNodeCount: topology?.nodes.length ?? 0,
					topologyRelationCount: topology?.relations.length ?? 0,
					loaded: true,
					error: !healthResponse.ok,
				});
			})
			.catch((error: unknown) => {
				if (controller.signal.aborted) return;
				console.warn("Unable to load optional homelab operations coverage", error);
				setCoverage((current) => ({ ...current, loaded: true, error: true }));
			});

		return () => controller.abort();
	}, [coverage.loaded, open]);

	return (
		<details
			className={styles.disclosure}
			onToggle={(event) => setOpen(event.currentTarget.open)}
			data-homelab-operations-disclosure
		>
			<summary className={styles.summary}>
				<span className={styles.summaryIcon} aria-hidden="true">
					<i className="fas fa-screwdriver-wrench" />
				</span>
				<span className={styles.summaryText}>
					<strong>{t("title")}</strong>
					<small>
						{french
							? "Control planes, couverture d’observation, sondes et diagnostic détaillé"
							: "Control planes, observation coverage, probes and detailed diagnostics"}
					</small>
				</span>
				<span className={styles.summaryHint}>
					<i className="fas fa-circle-info" aria-hidden="true" />{" "}
					{french ? "Afficher les détails" : "Show details"}
				</span>
			</summary>
			<div className={styles.body}>
				<p className={styles.context}>
					{french
						? "Ces signaux expliquent comment la santé des services est observée. Ils restent secondaires : la vue principale ci-dessus répond d’abord à la question « quels services fonctionnent ? »."
						: "These signals explain how service health is observed. They are secondary: the primary view above first answers which services are working."}
				</p>
				{open && !coverage.loaded ? (
					<p className={styles.loading} role="status">
						<i className="fas fa-spinner fa-spin" aria-hidden="true" />{" "}
						{french
							? "Chargement de la couverture d’observation…"
							: "Loading observation coverage…"}
					</p>
				) : null}
				{coverage.loaded ? (
					<>
						<HomelabObservationCoverage
							snapshot={coverage.snapshot}
							catalogServiceCount={coverage.catalogServiceCount}
							topologyNodeCount={coverage.topologyNodeCount}
							topologyRelationCount={coverage.topologyRelationCount}
						/>
						<HomelabProbeDiagnostics snapshot={coverage.snapshot} />
					</>
				) : null}
				{coverage.error ? (
					<p className={styles.warning} role="status">
						<i className="fas fa-triangle-exclamation" aria-hidden="true" />{" "}
						{french
							? "Une partie de la couverture n’a pas pu être confirmée ; cela ne change pas automatiquement l’état des services."
							: "Part of the observation coverage could not be confirmed; this does not automatically change service health."}
					</p>
				) : null}
				<HomelabOperationalEvidence />
			</div>
		</details>
	);
}
