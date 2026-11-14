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

const HEALTH_CHIP_KEYS = {
  ok: "presentation.filters.chips.ok",
  warn: "presentation.filters.chips.warn",
  fail: "presentation.filters.chips.fail",
  unknown: "presentation.filters.chips.unknown",
} as const;

type Props = {
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
							{t("presentation.filters.title")}
						</h3>
					</div>
					<span
						className={styles.refreshStatus}
						role="status"
						aria-live="polite"
					>
						{healthRefreshing
							? t("presentation.filters.refreshing")
							: healthUnavailable
								? t("presentation.filters.probesUnverified")
								: t("presentation.filters.currentSnapshot")}
					</span>
				</div>

				<div
					className={styles.healthSummary}
					aria-label={t("presentation.filters.healthSummary")}
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
							{t(HEALTH_CHIP_KEYS[healthState])}
						</button>
					))}
				</div>

				<div className={styles.controls} data-homelab-hierarchy-controls>
					<label className={styles.filterField}>
						<span className={styles.filterLabel}>
							{t("presentation.filters.healthLabel")}
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
								{t("presentation.filters.healthAll")}
							</option>
							<option value="ok">{t("presentation.filters.healthOptions.ok")}</option>
							<option value="warn">{t("presentation.filters.healthOptions.warn")}</option>
							<option value="fail">{t("presentation.filters.healthOptions.fail")}</option>
							<option value="unknown">{t("presentation.filters.healthOptions.unknown")}</option>
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
							{t("presentation.filters.environmentLabel")}
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
								{t("presentation.filters.environmentAll")}
							</option>
							<option value="non-dev">
								{t("presentation.filters.environmentNonDev")}
							</option>
							<option value="production">Production</option>
							<option value="staging">Staging</option>
							<option value="dev">Dev</option>
							<option value="defaulted">
								{t("presentation.filters.environmentDefaulted")}
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
							{t("presentation.filters.reset")}
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
				<p className={styles.matchCount} role="status" aria-live="polite" aria-atomic="true">
					{t("presentation.filters.resultCount", { shown: visibleCount, total: totalCount })}
				</p>
			</section>

    </>
  );
}
