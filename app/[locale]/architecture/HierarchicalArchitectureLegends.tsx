import styles from "./HierarchicalArchitectureExplorer.module.css";
import { relationSemanticClass } from "./hierarchicalArchitectureModel";

type Props = { french: boolean };

export function ArchitectureRelationLegend({ french }: Readonly<Props>) {
	return (
		<div className={styles.relationLegend} data-architecture-relation-legend>
			<strong>{french ? "Sémantique des arêtes" : "Edge semantics"}</strong>
			<div className={styles.relationLegendItems}>
				{(
					[
						["dependency", french ? "Dépendance" : "Dependency"],
						["flow", french ? "Flux API / données" : "API / data flow"],
						["exposure", french ? "Exposition" : "Exposure"],
						["placement", french ? "Hébergement" : "Placement"],
						["observation", french ? "Observabilité" : "Observation"],
						["automation", french ? "Automatisation" : "Automation"],
					] as const
				).map(([semantic, label]) => (
					<span key={semantic} data-relation-kind={semantic}>
						<i
							className={`${styles.relationSwatch} ${relationSemanticClass(semantic)}`}
							aria-hidden="true"
						/>
						{label}
					</span>
				))}
			</div>
			<small>
				{french
					? "La couleur et le motif indiquent la nature de la relation ; required/optional indique séparément son poids fonctionnel. L’évidence FastAPI d’une dépendance requise peut surcharger sa couleur sans modifier sa sémantique."
					: "Color and line pattern identify relation purpose; required/optional separately identifies functional strength. FastAPI evidence for a required dependency may override its color without changing its semantic category."}
			</small>
		</div>
	);
}

export function ArchitectureExposureContract({ french }: Readonly<Props>) {
	return (
		<aside className={styles.exposureContract} data-exposure-path-contract>
			<div className={styles.exposureContractHeader}>
				<strong>
					{french
						? "Contrat des chemins d’exposition"
						: "Exposure path contract"}
				</strong>
				<span>
					{french
						? "Réseau ≠ dépendances fonctionnelles"
						: "Network ≠ functional dependencies"}
				</span>
			</div>
			<div className={styles.exposurePathGrid}>
				<div data-exposure-path="direct">
					<strong>HAProxy direct</strong>
					<code>Internet → pfSense:7000 → HAProxy → TrueNAS:7000</code>
					<small>
						{french
							? "Chemin public direct explicitement distinct du Tunnel Cloudflare."
							: "Public direct path explicitly separate from Cloudflare Tunnel."}
					</small>
				</div>
				<div data-exposure-path="cloudflare">
					<strong>Cloudflare Tunnel</strong>
					<code>Cloudflare edge → cloudflared → service</code>
					<small data-cloudflare-direct-isolation>
						{french
							? "Une preuve Tunnel/Access ne prouve jamais que le chemin direct pfSense:7000 → HAProxy → TrueNAS fonctionne."
							: "Tunnel/Access evidence never proves that the direct pfSense:7000 → HAProxy → TrueNAS path works."}
					</small>
				</div>
				<div data-exposure-path="lan-vpn">
					<strong>LAN / VPN only</strong>
					<code>pfSense admin 10443/tcp · TrueNAS SSH 9922/tcp</code>
					<small>
						{french
							? "Ces ports d’administration ne sont pas des endpoints Internet attendus."
							: "These administration ports are not expected Internet endpoints."}
					</small>
				</div>
				<div data-exposure-path="internal">
					<strong>{french ? "Routage interne" : "Internal routing"}</strong>
					<code>service → API / data / dependency → service</code>
					<small>
						{french
							? "Une relation fonctionnelle interne ne signifie pas qu’un service est publiquement exposé."
							: "An internal functional relationship does not mean a service is publicly exposed."}
					</small>
				</div>
			</div>
		</aside>
	);
}
