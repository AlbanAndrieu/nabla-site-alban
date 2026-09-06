"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import {
	type HomelabServicesCatalog,
} from "@/lib/homelabServices";
import {
	groupCatalogByPresentation,
	type ServiceMetricsProfile,
	type ServicePresentationGroup,
} from "@/lib/servicePresentation";
import type { ServiceTopology } from "@/lib/serviceTopology";
import HomelabServiceGrid from "@/app/components/homelab/HomelabServiceGrid";
import styles from "@/app/components/homelab/HomelabServicesBlock.module.css";

type Props = {
	catalog: HomelabServicesCatalog;
	topology: ServiceTopology;
	snapshot: HomelabHealthSnapshot | null;
	healthUnavailable?: boolean;
};

type HierarchyGroup = ReturnType<typeof groupCatalogByPresentation>[number];

type GroupTitleKey =
	| "presentation.groups.services"
	| "presentation.groups.core-critical"
	| "presentation.groups.security-controls"
	| "presentation.groups.shared-core"
	| "presentation.groups.support";

type GroupDescriptionKey =
	| "presentation.descriptions.services"
	| "presentation.descriptions.core-critical"
	| "presentation.descriptions.security-controls"
	| "presentation.descriptions.shared-core"
	| "presentation.descriptions.support";

type MetricsProfileKey =
	| "presentation.metrics.red"
	| "presentation.metrics.use"
	| "presentation.metrics.security"
	| "presentation.metrics.red-use"
	| "presentation.metrics.support";

const DEFAULT_OPEN_GROUPS: readonly ServicePresentationGroup[] = [
	"services",
	"core-critical",
	"security-controls",
];

const GROUP_TITLE_KEY: Record<ServicePresentationGroup, GroupTitleKey> = {
	services: "presentation.groups.services",
	"core-critical": "presentation.groups.core-critical",
	"security-controls": "presentation.groups.security-controls",
	"shared-core": "presentation.groups.shared-core",
	support: "presentation.groups.support",
};

const GROUP_DESCRIPTION_KEY: Record<ServicePresentationGroup, GroupDescriptionKey> = {
	services: "presentation.descriptions.services",
	"core-critical": "presentation.descriptions.core-critical",
	"security-controls": "presentation.descriptions.security-controls",
	"shared-core": "presentation.descriptions.shared-core",
	support: "presentation.descriptions.support",
};

const METRICS_PROFILE_KEY: Record<ServiceMetricsProfile, MetricsProfileKey> = {
	red: "presentation.metrics.red",
	use: "presentation.metrics.use",
	security: "presentation.metrics.security",
	"red-use": "presentation.metrics.red-use",
	support: "presentation.metrics.support",
};

export default function ArchitectureServiceHierarchy({
	catalog,
	topology,
	snapshot,
	healthUnavailable = false,
}: Readonly<Props>) {
	const t = useTranslations("homelab");
	const locale = useLocale();
	const [expandedGroups, setExpandedGroups] = useState<Set<ServicePresentationGroup>>(
		() => new Set(DEFAULT_OPEN_GROUPS),
	);

	const groups = useMemo<HierarchyGroup[]>(
		() => groupCatalogByPresentation(catalog, topology),
		[catalog, topology],
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
				{groups.map((group) => (
					<details
						className={styles.groupDetails}
						key={group.group}
						open={expandedGroups.has(group.group)}
						onToggle={(event) =>
							setGroupExpanded(group.group, event.currentTarget.open)
						}
						data-service-presentation-group={group.group}
						data-metrics-profile={group.metricsProfile}
					>
						<summary className={styles.groupSummary}>
							<span className={styles.groupTitle}>
								<strong>{t(GROUP_TITLE_KEY[group.group])}</strong>
								<span className={styles.groupDescription}>
									{t(GROUP_DESCRIPTION_KEY[group.group])}
								</span>
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
							</span>
						</summary>
						<div className={`${styles.groupBody} homelab-service-subgrid`}>
							<HomelabServiceGrid
								catalog={group.catalog}
								snapshot={snapshot}
								healthUnavailable={healthUnavailable}
								healthHttpStatus={null}
							/>
						</div>
					</details>
				))}
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
