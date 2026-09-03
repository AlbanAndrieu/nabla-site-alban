"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import {
	homelabServiceId,
	type HomelabServicesCatalog,
} from "@/lib/homelabServices";
import {
	analyzeServiceCriticality,
	compareServiceCriticality,
	criticalityTierOrder,
	type ServiceCriticalityTier,
} from "@/lib/serviceCriticality";
import type { ServiceTopology } from "@/lib/serviceTopology";
import HomelabServiceGrid from "@/app/components/homelab/HomelabServiceGrid";
import styles from "@/app/components/homelab/HomelabServicesBlock.module.css";

type Props = {
	catalog: HomelabServicesCatalog;
	topology: ServiceTopology;
	snapshot: HomelabHealthSnapshot | null;
	healthUnavailable?: boolean;
};

type HierarchyGroup = {
	tier: ServiceCriticalityTier;
	catalog: HomelabServicesCatalog;
};

type TierTitleKey =
	| "criticality.tiers.foundation"
	| "criticality.tiers.shared-data"
	| "criticality.tiers.shared-platform"
	| "criticality.tiers.application"
	| "criticality.tiers.support";

type TierDescriptionKey =
	| "criticality.tierDescriptions.foundation"
	| "criticality.tierDescriptions.shared-data"
	| "criticality.tierDescriptions.shared-platform"
	| "criticality.tierDescriptions.application"
	| "criticality.tierDescriptions.support";

const ALL_TIERS: readonly ServiceCriticalityTier[] = [
	"foundation",
	"shared-data",
	"shared-platform",
	"application",
	"support",
];

const TIER_TITLE_KEY: Record<ServiceCriticalityTier, TierTitleKey> = {
	foundation: "criticality.tiers.foundation",
	"shared-data": "criticality.tiers.shared-data",
	"shared-platform": "criticality.tiers.shared-platform",
	application: "criticality.tiers.application",
	support: "criticality.tiers.support",
};

const TIER_DESCRIPTION_KEY: Record<ServiceCriticalityTier, TierDescriptionKey> = {
	foundation: "criticality.tierDescriptions.foundation",
	"shared-data": "criticality.tierDescriptions.shared-data",
	"shared-platform": "criticality.tierDescriptions.shared-platform",
	application: "criticality.tierDescriptions.application",
	support: "criticality.tierDescriptions.support",
};

export default function ArchitectureServiceHierarchy({
	catalog,
	topology,
	snapshot,
	healthUnavailable = false,
}: Readonly<Props>) {
	const t = useTranslations("homelab");
	const locale = useLocale();
	const [expandedTiers, setExpandedTiers] = useState<Set<ServiceCriticalityTier>>(
		() => new Set(ALL_TIERS),
	);

	const groups = useMemo<HierarchyGroup[]>(() => {
		const analysis = analyzeServiceCriticality(topology);
		const grouped = new Map<ServiceCriticalityTier, typeof catalog.services>();

		for (const service of catalog.services) {
			const id = homelabServiceId(service);
			const tier = analysis.get(id)?.tier ?? "support";
			grouped.set(tier, [...(grouped.get(tier) ?? []), service]);
		}

		return [...grouped.entries()]
			.map(([tier, services]) => ({
				tier,
				catalog: {
					...catalog,
					services: [...services].sort((left, right) =>
						compareServiceCriticality(
							homelabServiceId(left),
							homelabServiceId(right),
							topology,
							analysis,
						),
					),
				},
			}))
			.sort(
				(left, right) =>
					criticalityTierOrder(left.tier) - criticalityTierOrder(right.tier),
			);
	}, [catalog, topology]);

	const setTierExpanded = (tier: ServiceCriticalityTier, open: boolean) => {
		setExpandedTiers((current) => {
			const next = new Set(current);
			if (open) next.add(tier);
			else next.delete(tier);
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
						key={group.tier}
						open={expandedTiers.has(group.tier)}
						onToggle={(event) =>
							setTierExpanded(group.tier, event.currentTarget.open)
						}
						data-service-criticality-group={group.tier}
					>
						<summary className={styles.groupSummary}>
							<span className={styles.groupTitle}>
								<strong>{t(TIER_TITLE_KEY[group.tier])}</strong>
								<span className={styles.groupDescription}>
									{t(TIER_DESCRIPTION_KEY[group.tier])}
								</span>
							</span>
							<span className={styles.groupMeta}>
								{t("criticality.componentCount", {
									count: group.catalog.services.length,
								})}
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
