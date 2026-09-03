import AnchoredHeading from "@/components/AnchoredHeading";
import ActionLink from "@/components/ui/ActionLink";
import {
	homelabServiceEndpointUrl,
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

export default function ArchitectureServiceDirectory({ locale, catalog, topology }: Readonly<Props>) {
	const french = locale === "fr";
	const analysis = analyzeServiceCriticality(topology);
	const grouped = new Map<ServiceCriticalityTier, typeof catalog.services>();
	for (const service of catalog.services) {
		const id = homelabServiceId(service);
		const tier = analysis.get(id)?.tier ?? "support";
		grouped.set(tier, [...(grouped.get(tier) ?? []), service]);
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
						? "Chaque service possède maintenant une ancre stable de la forme #service-<id>. Ce répertoire rend tous les composants accessibles même lorsque la topologie interactive est en mode IA ou chemin critique."
						: "Every service now has a stable #service-<id> anchor. This directory keeps every component directly addressable even when the interactive topology is showing the AI view or only the critical path."}
				</p>
			</div>
			{groups.map(([tier, services]) => (
				<div className={styles.group} key={tier} data-service-directory-tier={tier}>
					<h3>{french ? TIER_LABELS[tier][1] : TIER_LABELS[tier][0]}</h3>
					<div className={styles.grid}>
						{[...services]
							.sort((left, right) =>
								compareServiceCriticality(
									homelabServiceId(left),
									homelabServiceId(right),
									topology,
									analysis,
								),
							)
							.map((service) => {
								const id = homelabServiceId(service);
								const criticality = analysis.get(id);
								return (
									<article id={`service-${id}`} className={styles.card} key={id} data-architecture-service={id}>
										<div className={styles.cardHeader}>
											<strong>{service.name}</strong>
											<code>{id}</code>
										</div>
										{service.description ? <p>{service.description}</p> : null}
										<div className={styles.meta}>
											<span>{french ? "criticité" : "criticality"}: {tier.replaceAll("-", " ")}</span>
											{typeof criticality?.transitiveDependents === "number" ? (
												<span>{french ? "rayon d’impact" : "blast radius"}: {criticality.transitiveDependents}</span>
											) : null}
											{service.external === true ? <span>{french ? "externe" : "external"}</span> : null}
										</div>
										<div className={styles.actions}>
											<ActionLink href={`#service-${id}`} variant="secondary" size="compact">
												#{`service-${id}`}
											</ActionLink>
											{service.endpointEnabled !== false ? (
												<ActionLink href={homelabServiceEndpointUrl(service)} target="_blank" rel="noopener noreferrer" variant="outline" size="compact">
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
