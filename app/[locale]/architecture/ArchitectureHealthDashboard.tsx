"use client";

import { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";
import homelabStyles from "@/app/components/homelab/HomelabServicesBlock.module.css";
import {
	GROUP_FILTERS,
	type GroupFilter,
	HEALTH_STATES,
	type HealthFilter,
	type HealthStateCounts,
	PRESENTATION_GROUP_TITLE_KEY,
} from "./architectureTopologyFilters";

type Props = {
	french: boolean;
	refreshing: boolean;
	healthUnavailable: boolean;
	ageSeconds: number | null;
	counts: HealthStateCounts;
	healthFilter: HealthFilter;
	setHealthFilter: Dispatch<SetStateAction<HealthFilter>>;
	groupFilter: GroupFilter;
	setGroupFilter: Dispatch<SetStateAction<GroupFilter>>;
	searchQuery: string;
	setSearchQuery: Dispatch<SetStateAction<string>>;
	shownCount: number;
	totalCount: number;
};

/** Header, health chips, filter controls and match count of the dashboard. */
export default function ArchitectureHealthDashboard({
	french,
	refreshing,
	healthUnavailable,
	ageSeconds,
	counts,
	healthFilter,
	setHealthFilter,
	groupFilter,
	setGroupFilter,
	searchQuery,
	setSearchQuery,
	shownCount,
	totalCount,
}: Readonly<Props>) {
	const t = useTranslations("homelab");
	const groupLabel = (group: GroupFilter) =>
		group === "all"
			? t("presentation.allGroups")
			: t(PRESENTATION_GROUP_TITLE_KEY[group]);

	return (
		<>
			<div className={homelabStyles.healthDashboardHeader}>
				<div>
					<h2
						id="architecture-health-dashboard-title"
						className={homelabStyles.healthDashboardTitle}
					>
						{french
							? "État et filtres de l’architecture"
							: "Architecture health and filters"}
					</h2>
					<p>
						{french
							? "Les filtres s’appliquent aux services déclarés du graphe ; la topologie complète reste utilisée pour calculer la criticité et le rayon d’impact."
							: "Services stay first; filters use operator presentation roles while the complete topology remains the basis for dependency criticality and blast-radius calculations."}
					</p>
				</div>
				<div
					className={homelabStyles.refreshStatus}
					role="status"
					aria-live="polite"
				>
					{refreshing
						? french
							? "Actualisation…"
							: "Refreshing…"
						: healthUnavailable
							? french
								? "Actualisation indisponible · dernier snapshot conservé"
								: "Refresh unavailable · keeping last snapshot"
							: ageSeconds === null
								? french
									? "Snapshot en attente"
									: "Waiting for snapshot"
								: french
									? `Mis à jour il y a ${ageSeconds}s`
									: `Updated ${ageSeconds}s ago`}
				</div>
			</div>

			<div
				className={homelabStyles.healthSummary}
				aria-label={french ? "Résumé santé" : "Health summary"}
			>
				{HEALTH_STATES.map((state) => (
					<button
						type="button"
						key={state}
						className={homelabStyles.healthChip}
						data-health-filter={state}
						aria-pressed={healthFilter === state}
						onClick={() =>
							setHealthFilter((current) => (current === state ? "all" : state))
						}
					>
						<strong>{counts[state]}</strong>{" "}
						{state === "ok"
							? french
								? "sains"
								: "healthy"
							: state === "warn"
								? french
									? "dégradés"
									: "degraded"
								: state === "fail"
									? french
										? "en échec"
										: "failed"
									: french
										? "inconnus"
										: "unknown"}
					</button>
				))}
			</div>

			<div className={homelabStyles.controls}>
				<label className={homelabStyles.filterField}>
					<span className={homelabStyles.filterLabel}>
						{french ? "Santé" : "Health"}
					</span>
					<select
						className={homelabStyles.filterSelect}
						value={healthFilter}
						onChange={(event) =>
							setHealthFilter(event.target.value as HealthFilter)
						}
					>
						<option value="all">
							{french ? "Tous les états" : "All health states"}
						</option>
						<option value="ok">{french ? "Sain" : "Healthy"}</option>
						<option value="warn">{french ? "Dégradé" : "Degraded"}</option>
						<option value="fail">{french ? "En échec" : "Failed"}</option>
						<option value="unknown">{french ? "Inconnu" : "Unknown"}</option>
					</select>
				</label>
				<label className={homelabStyles.filterField}>
					<span className={homelabStyles.filterLabel}>
						{t("presentation.searchLabel")}
					</span>
					<input
						type="search"
						className={homelabStyles.filterSelect}
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.currentTarget.value)}
						placeholder={t("presentation.searchPlaceholder")}
						data-architecture-service-search
					/>
				</label>
				<label className={homelabStyles.filterField}>
					<span className={homelabStyles.filterLabel}>
						{t("presentation.filterLabel")}
					</span>
					<select
						className={homelabStyles.filterSelect}
						value={groupFilter}
						onChange={(event) =>
							setGroupFilter(event.target.value as GroupFilter)
						}
						data-architecture-presentation-filter
					>
						{GROUP_FILTERS.map((group) => (
							<option value={group} key={group}>
								{groupLabel(group)}
							</option>
						))}
					</select>
				</label>
				<div className={homelabStyles.controlButtons}>
					<button
						type="button"
						className={homelabStyles.controlButton}
						onClick={() => {
							setHealthFilter("all");
							setGroupFilter("all");
							setSearchQuery("");
						}}
					>
						{french ? "Réinitialiser" : "Reset filters"}
					</button>
				</div>
			</div>
			<p className={homelabStyles.matchCount}>
				{french
					? `${shownCount} services déclarés affichés sur ${totalCount}`
					: `${shownCount} declared services shown of ${totalCount}`}
			</p>
		</>
	);
}
