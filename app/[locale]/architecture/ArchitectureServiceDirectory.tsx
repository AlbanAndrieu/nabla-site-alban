import AnchoredHeading from "@/components/AnchoredHeading";
import ActionLink from "@/components/ui/ActionLink";
import {
	homelabServiceEndpointUrl,
	homelabServiceId,
	type HomelabService,
	type HomelabServicesCatalog,
} from "@/lib/homelabServices";
import {
	analyzeServiceCriticality,
	compareServiceCriticality,
	criticalityTierOrder,
	type ServiceCriticalityTier,
} from "@/lib/serviceCriticality";
import type { ServiceTopology, ServiceTopologyNode } from "@/lib/serviceTopology";
import styles from "./ArchitectureServiceDirectory.module.css";

type Props = {
	locale: string;
	catalog: HomelabServicesCatalog;
	topology: ServiceTopology;
};

const TIER_LABELS: Record<ServiceCriticalityTier, [string, string]> = {
	foundation: ["Infrastructure foundations", "Fondations d’infrastructure"],
	"shared-data": ["Shared data and state", "Données et état partagés"],
	"shared-platform": ["Shared platform services", "Services de plateforme partagés"],
	application: ["Applications and consumers", "Applications et consommateurs"],
	support: ["Support and low-impact", "Support et faible impact"],
};

function endpointFor(node: ServiceTopologyNode, service: HomelabService | undefined): string | null {
	if (service?.endpointEnabled !== false) return service ? homelabServiceEndpointUrl(service) : node.url ?? null;
	return node.url ?? null;
}

export default function ArchitectureServiceDirectory({ locale, catalog, topology }: Readonly<Props>) {
	const french = locale === "fr";
	const analysis = analyzeServiceCriticality(topology);
	const catalogById = new Map(catalog.services.map((service) => [homelabServiceId(service), service]));
	const grouped = new Map<ServiceCriticalityTier, ServiceTopologyNode[]>();

	for (const node of topology.nodes) {
		const tier = analysis.get(node.id)?.tier ?? "support";
		grouped.set(tier, [...(grouped.get(tier) ?? []), node]);
	}

	const groups = [...grouped.entries()].sort(
		([left], [right]) => criticalityTierOrder(left) - criticalityTierOrder(right),
	);

	return (
		<section id="service-directory" className={styles.section} aria-labelledby="service-directory-title">
			<div className={styles.heading}>
				<AnchoredHeading id="service-directory-title">
					{french ? "Répertoire des services déclarés" : "Declared service directory"}
				</AnchoredHeading>
				<p>
					{french
						? "Chaque nœud de la topologie déclarée possède une ancre stable de la forme #service-<id>. Le catalogue enrichit les cartes lorsqu’il est disponible, mais il ne peut pas faire disparaître un service déclaré."
						: "Every node in the declared topology has a stable #service-<id> anchor. The service catalog enriches cards when available, but it cannot make a declared topology service disappear."}
				</p>
			</div>
			{groups.map(([tier, nodes]) => (
				<div className={styles.group} key={tier} data-service-directory-tier={tier}>
					<h3>{french ? TIER_LABELS[tier][1] : TIER_LABELS[tier][0]}</h3>
					<div className={styles.grid}>
						{[...nodes]
							.sort((left, right) => compareServiceCriticality(left.id, right.id, topology, analysis))
							.map((node) => {
								const service = catalogById.get(node.id);
								const criticality = analysis.get(node.id);
								const endpoint = endpointFor(node, service);
								const description = service?.description ?? node.description;
								return (
									<article id={`service-${node.id}`} className={styles.card} key={node.id} data-architecture-service={node.id}>
										<div className={styles.cardHeader}>
											<strong>{node.name}</strong>
											<code>{node.id}</code>
										</div>
										{description ? <p>{description}</p> : null}
										<div className={styles.meta}>
											<span>{node.kind}</span>
											<span>{node.category}</span>
											<span>{french ? "criticité" : "criticality"}: {tier.replaceAll("-", " ")}</span>
											{typeof criticality?.transitiveDependents === "number" ? (
												<span>{french ? "rayon d’impact" : "blast radius"}: {criticality.transitiveDependents}</span>
											) : null}
											{service?.external === true ? <span>{french ? "externe" : "external"}</span> : null}
										</div>
										<div className={styles.actions}>
											<ActionLink href={`#service-${node.id}`} variant="secondary" size="compact">
												#{`service-${node.id}`}
											</ActionLink>
											{endpoint ? (
												<ActionLink href={endpoint} target="_blank" rel="noopener noreferrer" variant="outline" size="compact">
													{french ? "Ouvrir" : "Open"}
												</ActionLink>
											) : null}
										</div>
									</article>
								);
							})}
					</div>
				</div>
			))}
		</section>
	);
}
