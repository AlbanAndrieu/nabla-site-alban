"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import HomelabServiceGrid from "@/app/components/homelab/HomelabServiceGrid";
import { GROUP_TITLE_KEY, METRICS_PROFILE_KEY } from "@/app/components/homelab/homelabServiceHierarchy";
import styles from "@/app/components/homelab/HomelabServicesBlock.module.css";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import { indexOwnerNavigation } from "@/lib/homelabOwnerServiceNavigation";
import {
	type HomelabServicesCatalog,
	homelabServiceId,
} from "@/lib/homelabServices";
import {
	groupCatalogByPresentation,
	type ServicePresentationGroup,
} from "@/lib/servicePresentation";
import type { ServiceTopology } from "@/lib/serviceTopology";
import type { SiteHealthV2 } from "@/lib/siteHealthV2";
import { effectiveState, indexHealth } from "./architectureTopologyFilters";

type Props = {
	catalog: HomelabServicesCatalog;
	topology: ServiceTopology;
	snapshot: HomelabHealthSnapshot | null;
	siteHealth?: SiteHealthV2 | null;
	healthUnavailable?: boolean;
};

type HierarchyGroup = ReturnType<typeof groupCatalogByPresentation>[number];

const DEFAULT_OPEN_GROUPS: readonly ServicePresentationGroup[] = [
	"services",
	"core-critical",
	"security-controls",
];

export default function ArchitectureServiceHierarchy({
	catalog,
	topology,
	snapshot,
	siteHealth = null,
	healthUnavailable = false,
}: Readonly<Props>) {
	const t = useTranslations("homelab");
	const locale = useLocale();
	const [expandedGroups, setExpandedGroups] = useState<
		Set<ServicePresentationGroup>
	>(() => new Set(DEFAULT_OPEN_GROUPS));

	const groups = useMemo<HierarchyGroup[]>(
		() => groupCatalogByPresentation(catalog, topology),
		[catalog, topology],
	);
	const ownerNavigationIndex = useMemo(
		() =>
			snapshot && !healthUnavailable ? indexOwnerNavigation(snapshot) : null,
		[snapshot, healthUnavailable],
	);
	const healthIndex = useMemo(
		() => indexHealth(snapshot, siteHealth, catalog.catalogRevision),
		[snapshot, siteHealth, catalog.catalogRevision],
	);

	const setGroupExpanded = (group: ServicePresentationGroup, open: boolean) => {
		setExpandedGroups((current) => {
			const next = new Set(current);
			if (open) next.add(group);
			else next.delete(group);
			return next;
		});
	};

	return (
		<div id="service-directory">
			<div
				id="architecture-services"
				data-homelab-service-hierarchy
				data-architecture-services
			>
				{groups.map((group, index) => {
					const issueCount = group.catalog.services.filter(
						(service) =>
							effectiveState(homelabServiceId(service), healthIndex) !== "ok",
					).length;
					return (
						<details
							className={styles.groupDetails}
							key={group.group}
							open={expandedGroups.has(group.group)}
							onToggle={(event) =>
								setGroupExpanded(group.group, event.currentTarget.open)
							}
							data-service-presentation-group={group.group}
							data-metrics-profile={group.metricsProfile}
							data-needs-attention={issueCount > 0 ? "true" : "false"}
						>
							<summary className={styles.groupSummary}>
								<span className={styles.groupTitle}>
									<strong>{t(GROUP_TITLE_KEY[group.group])}</strong>
								</span>
								<span className={styles.groupMeta}>
									<span className={styles.metricsProfileBadge}>
										{t(METRICS_PROFILE_KEY[group.metricsProfile])}
									</span>
									<span>
										{t("presentation.componentCount", {
											count: group.catalog.services.length,
										})}
									</span>
									<span data-group-issue-count={issueCount}>
										{t("presentation.issueCount", { count: issueCount })}
									</span>
								</span>
							</summary>
							<div className={`${styles.groupBody} homelab-service-subgrid`}>
								<HomelabServiceGrid
									catalog={group.catalog}
									ownerNavigationIndex={ownerNavigationIndex}
									showRuntimeWarnings={index === 0}
									snapshot={snapshot}
									siteHealth={siteHealth}
									healthUnavailable={healthUnavailable && !siteHealth}
									healthHttpStatus={null}
								/>
							</div>
						</details>
					);
				})}
				{groups.length === 0 ? (
					<p className={styles.matchCount} role="status">
						{locale === "fr"
							? "Aucun service ne correspond aux filtres actuels."
							: "No services match the current filters."}
					</p>
				) : null}
			</div>
		</div>
	);
}
