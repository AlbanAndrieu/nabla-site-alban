import styles from "./ArchitectureSectionNav.module.css";

export default function ArchitectureSectionNav({ locale }: Readonly<{ locale: string }>) {
	const french = locale === "fr";
	const items = french
		? [
				["architecture-overview", "Vue d’ensemble"],
				["architecture-health-dashboard", "Santé & filtres"],
				["critical-dependency-hierarchy", "Dépendances critiques"],
				["service-architecture-explorer", "Topologie services"],
				["homelab-network-ingress-paths", "Réseau & ingress"],
				["declared-observed-health", "Déclaré / observé / santé"],
			]
		: [
				["architecture-overview", "Overview"],
				["architecture-health-dashboard", "Health & filters"],
				["critical-dependency-hierarchy", "Critical dependencies"],
				["service-architecture-explorer", "Service topology"],
				["homelab-network-ingress-paths", "Network & ingress"],
				["declared-observed-health", "Declared / observed / health"],
			];

	return (
		<nav className={styles.nav} aria-label={french ? "Sections de l’architecture" : "Architecture sections"}>
			<div className={styles.links}>
				{items.map(([id, label]) => (
					<a href={`#${id}`} key={id}>{label}</a>
				))}
			</div>
		</nav>
	);
}
