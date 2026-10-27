"use client";

import { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";
import type { HomelabEnvironmentFilter } from "@/lib/homelabEnvironments";
import type { HomelabHealthState } from "@/lib/homelabHealth";
import type { ServicePresentationGroup } from "@/lib/servicePresentation";
import styles from "./HomelabServicesBlock.module.css";
import { ALL_GROUPS, GROUP_TITLE_KEY } from "./homelabServiceHierarchy";

export type HealthFilter = "all" | HomelabHealthState;
export type GroupFilter = "all" | ServicePresentationGroup;

const HEALTH_STATES: readonly HomelabHealthState[] = [
  "ok", "warn", "fail", "unknown",
];

type Props = {
  french: boolean;
  healthRefreshing: boolean;
  healthUnavailable: boolean;
  healthCounts: Record<HomelabHealthState, number>;
  healthFilter: HealthFilter;
  setHealthFilter: Dispatch<SetStateAction<HealthFilter>>;
  environmentFilter: HomelabEnvironmentFilter;
  setEnvironmentFilter: Dispatch<SetStateAction<HomelabEnvironmentFilter>>;
  groupFilter: GroupFilter;
  setGroupFilter: Dispatch<SetStateAction<GroupFilter>>;
  setGroupExpanded: (group: ServicePresentationGroup, open: boolean) => void;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setExpandedGroups: Dispatch<SetStateAction<Set<ServicePresentationGroup>>>;
  visibleCount: number;
  totalCount: number;
};

/** Shared TrueNAS health counters and interactive catalog filters. */
export default function HomelabServiceFilters({
  french,
  healthRefreshing,
  healthUnavailable,
  healthCounts,
  healthFilter,
  setHealthFilter,
  environmentFilter,
  setEnvironmentFilter,
  groupFilter,
  setGroupFilter,
  setGroupExpanded,
  searchQuery,
  setSearchQuery,
  setExpandedGroups,
  visibleCount,
  totalCount,
}: Readonly<Props>) {
  const t = useTranslations("homelab");
  return (
    <>
			<section
				id="truenas-health-dashboard"
				className={styles.healthDashboard}
				aria-labelledby="truenas-health-dashboard-title"
			>
				<div className={styles.healthDashboardHeader}>
					<div>
						<h3
							id="truenas-health-dashboard-title"
							className={styles.healthDashboardTitle}
						>
							{french
								? "Santé et filtres des services"
								: "Service health and filters"}
						</h3>
					</div>
					<span
						className={styles.refreshStatus}
						role="status"
						aria-live="polite"
					>
						{healthRefreshing
							? french
								? "Actualisation…"
								: "Refreshing…"
							: healthUnavailable
								? french
									? "Sondes non vérifiées"
									: "Probes unverified"
								: french
									? "Snapshot courant"
									: "Current snapshot"}
					</span>
				</div>

				<div
					className={styles.healthSummary}
					aria-label={french ? "Résumé santé" : "Health summary"}
				>
					{HEALTH_STATES.map((healthState) => (
						<button
							type="button"
							key={healthState}
							className={styles.healthChip}
							aria-pressed={healthFilter === healthState}
							data-homelab-health-filter={healthState}
							onClick={() =>
								setHealthFilter((current) =>
									current === healthState ? "all" : healthState,
								)
							}
						>
							<strong>{healthCounts[healthState]}</strong>{" "}
							{healthState === "ok"
								? french
									? "sains"
									: "healthy"
								: healthState === "warn"
									? french
										? "dégradés"
										: "degraded"
									: healthState === "fail"
										? french
											? "en échec"
											: "failed"
										: french
											? "inconnus"
											: "unknown"}
						</button>
					))}
				</div>

				<div className={styles.controls} data-homelab-hierarchy-controls>
					<label className={styles.filterField}>
						<span className={styles.filterLabel}>
							{french ? "Santé" : "Health"}
						</span>
						<select
							className={styles.filterSelect}
							value={healthFilter}
							onChange={(event) =>
								setHealthFilter(event.currentTarget.value as HealthFilter)
							}
							data-homelab-health-select
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
					<label className={styles.filterField}>
						<span className={styles.filterLabel}>
							{t("presentation.searchLabel")}
						</span>
						<input
							type="search"
							className={styles.filterSelect}
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.currentTarget.value)}
							placeholder={t("presentation.searchPlaceholder")}
							data-homelab-service-search
						/>
					</label>
					<label className={styles.filterField}>
						<span className={styles.filterLabel}>
							{french ? "Environnement" : "Environment"}
						</span>
						<select
							className={styles.filterSelect}
							value={environmentFilter}
							onChange={(event) =>
								setEnvironmentFilter(
									event.currentTarget.value as HomelabEnvironmentFilter,
								)
							}
							data-homelab-environment-filter
						>
							<option value="all">
								{french ? "Tous les environnements" : "All environments"}
							</option>
							<option value="non-dev">
								{french
									? "Production + Staging (sans Dev)"
									: "Production + Staging (exclude Dev)"}
							</option>
							<option value="production">Production</option>
							<option value="staging">Staging</option>
							<option value="dev">Dev</option>
							<option value="defaulted">
								{french
									? "Production par défaut (métadonnées à revoir)"
									: "Default production (review metadata)"}
							</option>
						</select>
					</label>
					<label className={styles.filterField}>
						<span className={styles.filterLabel}>
							{t("presentation.filterLabel")}
						</span>
						<select
							className={styles.filterSelect}
							value={groupFilter}
							onChange={(event) => {
								const next = event.currentTarget.value as GroupFilter;
								setGroupFilter(next);
								if (next !== "all") setGroupExpanded(next, true);
							}}
							data-homelab-presentation-filter
						>
							<option value="all">{t("presentation.allGroups")}</option>
							{ALL_GROUPS.map((group) => (
								<option value={group} key={group}>
									{t(GROUP_TITLE_KEY[group])}
								</option>
							))}
						</select>
					</label>
					<div className={styles.controlButtons}>
						<button
							type="button"
							className={styles.controlButton}
							onClick={() => {
								setHealthFilter("all");
								setEnvironmentFilter("all");
								setGroupFilter("all");
								setSearchQuery("");
							}}
						>
							{french ? "Réinitialiser" : "Reset filters"}
						</button>
						<button
							type="button"
							className={styles.controlButton}
							onClick={() => setExpandedGroups(new Set(ALL_GROUPS))}
							aria-controls="homelab-service-hierarchy"
						>
							{t("criticality.expandAll")}
						</button>
						<button
							type="button"
							className={styles.controlButton}
							onClick={() => setExpandedGroups(new Set())}
							aria-controls="homelab-service-hierarchy"
						>
							{t("criticality.collapseAll")}
						</button>
					</div>
				</div>
				<p className={styles.matchCount}>
					{french
						? `${visibleCount} services affichés sur ${totalCount}`
						: `${visibleCount} services shown of ${totalCount}`}
				</p>
			</section>

    </>
  );
}
