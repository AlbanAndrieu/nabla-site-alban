"use client";

import { useMemo, useState } from "react";
import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
	HomelabHealthState,
} from "@/lib/homelabHealth";
import {
	blockedDependencyLabels,
	resolveEffectiveServiceState,
} from "@/lib/homelabHealthResolver";
import {
	homelabServiceId,
	type HomelabServicesCatalog,
} from "@/lib/homelabServices";
import {
	analyzeServiceCriticality,
	type ServiceCriticalityTier,
} from "@/lib/serviceCriticality";
import type { ServiceTopology, ServiceTopologyRelation } from "@/lib/serviceTopology";
import styles from "./MobileArchitectureHierarchy.module.css";

type Props = {
	locale: string;
	catalog: HomelabServicesCatalog;
	topology: ServiceTopology;
	snapshot: HomelabHealthSnapshot | null;
};

type HealthIndex = {
	byId: Map<string, HomelabHealthEntry>;
	byName: Map<string, HomelabHealthEntry>;
};

const TIER_ORDER: readonly ServiceCriticalityTier[] = [
	"foundation",
	"shared-data",
	"shared-platform",
	"application",
	"support",
];

const HEALTH_RANK: Record<HomelabHealthState, number> = {
	fail: 0,
	warn: 1,
	unknown: 2,
	ok: 3,
};

function normalize(value: string): string {
	return value.trim().toLowerCase();
}

function healthIndex(snapshot: HomelabHealthSnapshot | null): HealthIndex {
	const byId = new Map<string, HomelabHealthEntry>();
	const byName = new Map<string, HomelabHealthEntry>();
	for (const entry of snapshot?.services ?? []) {
		if (entry.id) byId.set(entry.id, entry);
		byName.set(normalize(entry.name), entry);
	}
	return { byId, byName };
}

function serviceHealth(
	id: string,
	name: string,
	index: HealthIndex,
): HomelabHealthEntry | undefined {
	return index.byId.get(id) ?? index.byName.get(normalize(name));
}

function stateOf(entry: HomelabHealthEntry | undefined): HomelabHealthState {
	return entry ? resolveEffectiveServiceState(entry).effectiveState : "unknown";
}

function worstState(states: readonly HomelabHealthState[]): HomelabHealthState {
	return states.reduce<HomelabHealthState>(
		(worst, state) => (HEALTH_RANK[state] < HEALTH_RANK[worst] ? state : worst),
		"ok",
	);
}

function tierLabel(tier: ServiceCriticalityTier, french: boolean): string {
	const labels: Record<ServiceCriticalityTier, [string, string]> = {
		foundation: ["Infrastructure foundations", "Fondations d’infrastructure"],
		"shared-data": ["Shared data and state", "Données et état partagés"],
		"shared-platform": ["Shared platform services", "Services de plateforme partagés"],
		application: ["Applications and consumers", "Applications et consommateurs"],
		support: ["Support / low impact", "Support / faible impact"],
	};
	return labels[tier][french ? 1 : 0];
}

function stateLabel(state: HomelabHealthState, french: boolean): string {
	const labels: Record<HomelabHealthState, [string, string]> = {
		ok: ["healthy", "sain"],
		warn: ["degraded", "dégradé"],
		fail: ["failed", "en échec"],
		unknown: ["unknown", "inconnu"],
	};
	return labels[state][french ? 1 : 0];
}

function relationLabel(relation: ServiceTopologyRelation, french: boolean): string {
	const strength = relation.strength === "required"
		? french ? "requise" : "required"
		: french ? "optionnelle" : "optional";
	return `${strength} · ${relation.type}`;
}

export default function MobileArchitectureHierarchy({
	locale,
	catalog,
	topology,
	snapshot,
}: Readonly<Props>) {
	const french = locale === "fr";
	const [criticalOnly, setCriticalOnly] = useState(true);
	const [showOptional, setShowOptional] = useState(false);
	const [expandedTiers, setExpandedTiers] = useState<Set<ServiceCriticalityTier>>(
		() => new Set(["foundation", "shared-data", "shared-platform"]),
	);
	const index = useMemo(() => healthIndex(snapshot), [snapshot]);
	const criticality = useMemo(() => analyzeServiceCriticality(topology), [topology]);
	const namesById = useMemo(
		() => new Map(topology.nodes.map((node) => [node.id, node.name])),
		[topology.nodes],
	);
	const relationsBySource = useMemo(() => {
		const result = new Map<string, ServiceTopologyRelation[]>();
		for (const relation of topology.relations) {
			result.set(relation.source, [...(result.get(relation.source) ?? []), relation]);
		}
		return result;
	}, [topology.relations]);

	const groups = useMemo(() => {
		return TIER_ORDER.map((tier) => {
			const services = catalog.services
				.filter((service) => {
					const id = homelabServiceId(service);
					const serviceTier = criticality.get(id)?.tier ?? "support";
					return serviceTier === tier && (!criticalOnly || tier !== "support");
				})
				.map((service) => {
					const id = homelabServiceId(service);
					const health = serviceHealth(id, service.name, index);
					return {
						service,
						id,
						health,
						state: stateOf(health),
						criticality: criticality.get(id),
					};
				});
			return {
				tier,
				services,
				state: services.length
					? worstState(services.map((service) => service.state))
					: "unknown" as HomelabHealthState,
			};
		}).filter((group) => group.services.length > 0);
	}, [catalog.services, criticalOnly, criticality, index]);

	const setTierExpanded = (tier: ServiceCriticalityTier, open: boolean) => {
		setExpandedTiers((current) => {
			const next = new Set(current);
			if (open) next.add(tier);
			else next.delete(tier);
			return next;
		});
	};

	return (
		<section
			className={styles.mobileHierarchy}
			aria-labelledby="mobile-architecture-hierarchy-title"
			data-mobile-architecture-hierarchy
		>
			<div className={styles.header}>
				<div>
					<h2 id="mobile-architecture-hierarchy-title">
						{french ? "Hiérarchie compacte" : "Compact hierarchy"}
					</h2>
					<p>
						{french
							? "Vue mobile des niveaux de criticité, états effectifs et relations directes. Le graphe interactif complet reste disponible plus bas."
							: "Mobile view of criticality tiers, effective health, and direct relations. The complete interactive graph remains available below."}
					</p>
				</div>
				<div className={styles.controls}>
					<label>
						<input
							type="checkbox"
							checked={criticalOnly}
							onChange={(event) => setCriticalOnly(event.target.checked)}
						/>
						<span>{french ? "Critiques uniquement" : "Critical only"}</span>
					</label>
					<label>
						<input
							type="checkbox"
							checked={showOptional}
							onChange={(event) => setShowOptional(event.target.checked)}
						/>
						<span>{french ? "Relations optionnelles" : "Optional relations"}</span>
					</label>
				</div>
			</div>

			<div className={styles.groups}>
				{groups.map((group) => (
					<details
						key={group.tier}
						open={expandedTiers.has(group.tier)}
						onToggle={(event) => setTierExpanded(group.tier, event.currentTarget.open)}
						className={styles.group}
						data-mobile-criticality-tier={group.tier}
					>
						<summary>
							<span>
								<strong>{tierLabel(group.tier, french)}</strong>
								<small>{group.services.length} {french ? "services" : "services"}</small>
							</span>
							<span className={styles.state} data-health-state={group.state}>
								{stateLabel(group.state, french)}
							</span>
						</summary>
						<div className={styles.serviceList}>
							{group.services.map(({ service, id, health, state, criticality: itemCriticality }) => {
								const blockers = blockedDependencyLabels(health);
								const relations = (relationsBySource.get(id) ?? []).filter(
									(relation) => showOptional || relation.strength === "required",
								);
								return (
									<article className={styles.service} key={id} data-mobile-service={id}>
										<div className={styles.serviceHeading}>
											<div>
												<strong>{service.name}</strong>
												<small>
													{itemCriticality?.tier ?? "support"}
													{typeof itemCriticality?.transitiveDependents === "number"
														? ` · ${french ? "impact" : "blast"} ${itemCriticality.transitiveDependents}`
														: ""}
												</small>
											</div>
											<span className={styles.state} data-health-state={state}>
												{stateLabel(state, french)}
											</span>
										</div>
										{blockers.length ? (
											<p className={styles.blocked} data-mobile-service-blockers>
												{french ? "Bloqué par" : "Blocked by"}: {blockers.join(", ")}
											</p>
										) : null}
										{relations.length ? (
											<ul className={styles.relations}>
												{relations.map((relation) => (
													<li
														key={`${relation.source}-${relation.type}-${relation.target}`}
														data-mobile-relation-strength={relation.strength}
													>
														<span>{namesById.get(relation.target) ?? relation.target}</span>
														<small>{relationLabel(relation, french)}</small>
													</li>
												))}
											</ul>
										) : (
											<small className={styles.noRelations}>
												{french ? "Aucune relation directe affichée." : "No direct relations shown."}
											</small>
										)}
									</article>
								);
							})}
						</div>
					</details>
				))}
			</div>
		</section>
	);
}
