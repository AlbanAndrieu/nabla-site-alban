"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
	analyzeServiceCriticality,
	compareServiceCriticality,
	SERVICE_CRITICALITY_TIERS,
	type ServiceCriticalityTier,
} from "@/lib/serviceCriticality";
import type { ServiceTopology } from "@/lib/serviceTopology";

type MessageKey =
	| "criticality.tiers.foundation"
	| "criticality.tiers.shared-data"
	| "criticality.tiers.shared-platform"
	| "criticality.tiers.application"
	| "criticality.tiers.support";

const TIER_MESSAGE_KEY: Record<ServiceCriticalityTier, MessageKey> = {
	foundation: "criticality.tiers.foundation",
	"shared-data": "criticality.tiers.shared-data",
	"shared-platform": "criticality.tiers.shared-platform",
	application: "criticality.tiers.application",
	support: "criticality.tiers.support",
};

const MAX_PER_TIER = 6;
const MAX_IMPACT_NAMES = 4;

type Props = {
	topology: ServiceTopology;
	compact?: boolean;
};

export default function ServiceCriticalityOverview({
	topology,
	compact = false,
}: Readonly<Props>) {
	const t = useTranslations("homelab");
	const analysis = useMemo(() => analyzeServiceCriticality(topology), [topology]);
	const nodesById = useMemo(
		() => new Map(topology.nodes.map((node) => [node.id, node])),
		[topology],
	);

	const tiers = useMemo(
		() =>
			SERVICE_CRITICALITY_TIERS.map((tier) => ({
				tier,
				nodes: topology.nodes
					.filter((node) => analysis.get(node.id)?.tier === tier)
					.sort((left, right) =>
						compareServiceCriticality(left.id, right.id, topology, analysis),
					),
			})).filter((entry) => entry.nodes.length > 0),
		[analysis, topology],
	);

	return (
		<section
			className={compact ? "mb-4" : "container py-4"}
			aria-labelledby="service-criticality-title"
			data-service-criticality-overview
		>
			<div className="text-center mx-auto mb-3" style={{ maxWidth: 900 }}>
				<h2 id="service-criticality-title" className={compact ? "h4" : "h3"}>
					<i className="fas fa-sitemap" aria-hidden="true" />{" "}
					{t("criticality.title")}
				</h2>
				<p className="mb-1">{t("criticality.lead")}</p>
			</div>

			<div className="row g-3" data-criticality-hierarchy>
				{tiers.map(({ tier, nodes }) => (
					<div className="col-12 col-lg-6 col-xxl" key={tier}>
						<div className="card h-100 service-card-ux">
							<div className="card-body">
								<h3 className="h5 mb-3">{t(TIER_MESSAGE_KEY[tier])}</h3>
								<div className="d-flex flex-column gap-2">
									{nodes.slice(0, MAX_PER_TIER).map((node) => {
										const criticality = analysis.get(node.id);
										const required = (criticality?.requiredDependencies ?? [])
											.map((id) => nodesById.get(id)?.name ?? id)
											.slice(0, 4);
										const optional = (criticality?.optionalDependencies ?? [])
											.map((id) => nodesById.get(id)?.name ?? id)
											.slice(0, 3);
										const impacted = (criticality?.transitiveDependentIds ?? [])
											.map((id) => nodesById.get(id)?.name ?? id)
											.slice(0, MAX_IMPACT_NAMES);
										const hiddenImpact = Math.max(
											0,
											(criticality?.transitiveDependents ?? 0) - impacted.length,
										);
										return (
											<div
												className="border rounded p-2"
												key={node.id}
												data-criticality-node={node.id}
												data-criticality-tier={tier}
												data-blast-radius={criticality?.transitiveDependents ?? 0}
											>
												<div className="d-flex justify-content-between gap-2 align-items-start">
													<strong>
														{node.icon ? `${node.icon} ` : ""}
														{node.name}
													</strong>
													<span className="badge text-bg-secondary">
														{t("criticality.impact", {
															count: criticality?.transitiveDependents ?? 0,
														})}
													</span>
												</div>
												<small className="d-block text-body-secondary">
													{node.kind}
												</small>
												{required.length > 0 ? (
													<small className="d-block mt-1">
														<strong>{t("criticality.requires")}</strong>{" "}
														{required.join(" · ")}
													</small>
												) : null}
												{optional.length > 0 ? (
													<small className="d-block mt-1 text-body-secondary">
														<strong>{t("criticality.optional")}</strong>{" "}
														{optional.join(", ")}
													</small>
												) : null}
												{impacted.length > 0 ? (
													<small className="d-block mt-1 text-body-secondary">
														<strong>{t("criticality.blastRadius")}</strong>{" "}
														{impacted.join(", ")}
														{hiddenImpact > 0
															? ` ${t("criticality.moreImpacted", { count: hiddenImpact })}`
															: ""}
													</small>
												) : null}
											</div>
										);
									})}
								</div>
								{nodes.length > MAX_PER_TIER ? (
									<small className="d-block mt-2 text-body-secondary">
										{t("criticality.more", {
											count: nodes.length - MAX_PER_TIER,
										})}
									</small>
								) : null}
							</div>
						</div>
					</div>
				))}
			</div>
			<p className="small mt-3 mb-0 text-center text-body-secondary">
				{t("criticality.note")}
			</p>
		</section>
	);
}
