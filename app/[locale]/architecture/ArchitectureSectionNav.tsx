import styles from "./ArchitectureSectionNav.module.css";

export default function ArchitectureSectionNav({
	locale,
}: Readonly<{ locale: string }>) {
	const french = locale === "fr";
	const items = french
		? [
				["architecture-overview", "Vue d’ensemble"],
				["operational-evidence", "Opérations & diagnostic"],
				["service-impact-inspector", "Impact & cause racine"],
				["architecture-health-dashboard", "Santé & filtres"],
				["architecture-services", "Services"],
				["critical-dependency-hierarchy", "Dépendances critiques"],
				["service-architecture-explorer", "Topologie services"],
				["homelab-network-ingress-paths", "Réseau & ingress"],
				["architecture-principles", "Principes d’architecture"],
			]
		: [
				["architecture-overview", "Overview"],
				["operational-evidence", "Operations & troubleshooting"],
				["service-impact-inspector", "Impact & root cause"],
				["architecture-health-dashboard", "Health & filters"],
				["architecture-services", "Services"],
				["critical-dependency-hierarchy", "Critical dependencies"],
				["service-architecture-explorer", "Service topology"],
				["homelab-network-ingress-paths", "Network & ingress"],
				["architecture-principles", "Architecture principles"],
			];

	return (
		<nav
			className={styles.nav}
			aria-label={
				french ? "Sections de l’architecture" : "Architecture sections"
			}
		>
			<div className={styles.links}>
				{items.map(([id, label]) => (
					<a href={`#${id}`} key={id}>
						{label}
					</a>
				))}
			</div>
		</nav>
	);
}
