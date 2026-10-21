"use client";

import styles from "./ArchitectureCatalogNotice.module.css";

type CatalogFailureReason = "key-missing" | "access-denied" | "unavailable";

type Props = {
	french: boolean;
	reason: CatalogFailureReason;
	onRetry: () => void;
};

const HELP: Record<CatalogFailureReason, { fr: string; en: string }> = {
	"key-missing": {
		fr: "La clé de diagnostic serveur est absente. Vérifiez la configuration de l’environnement Vercel concerné (Preview ou Production), puis redéployez.",
		en: "The server-side diagnostics key is missing. Check the corresponding Vercel environment (Preview or Production), then redeploy.",
	},
	"access-denied": {
		fr: "L’accès au catalogue a été refusé. Vérifiez l’identité SERVICE et ses permissions côté FastAPI, sans élargir l’accès OWNER.",
		en: "Catalog access was denied. Check the SERVICE identity and its FastAPI permissions without broadening OWNER access.",
	},
	unavailable: {
		fr: "Le catalogue n’a pas pu être chargé. Vérifiez le déploiement de la source v2 et le contrat de réponse ; aucune donnée de remplacement n’est inventée.",
		en: "The catalog could not be loaded. Check the v2 source deployment and response contract; no substitute data is invented.",
	},
};

export default function ArchitectureCatalogNotice({
	french,
	reason,
	onRetry,
}: Readonly<Props>) {
	const help = HELP[reason];
	const configurationIssue = reason === "key-missing" || reason === "access-denied";
	return (
		<section
			className="container py-4"
			role="alert"
			aria-labelledby="architecture-catalog-unavailable-title"
			data-architecture-catalog-v2-unavailable
			data-catalog-failure-reason={reason}
		>
			<div className={styles.panel}>
				<span className={styles.icon} aria-hidden="true">
					<svg
						viewBox="0 0 24 24"
						width="24"
						height="24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="12" cy="12" r="9" />
						<path d="M12 7v6m0 4h.01" />
					</svg>
				</span>
				<div className={styles.body}>
					<p className={styles.eyebrow}>
						{french
							? "Vue privée · Backstage v2"
							: "Private view · Backstage v2"}
					</p>
					<h2
						id="architecture-catalog-unavailable-title"
						className={styles.title}
					>
						{french
							? configurationIssue
								? "Accès au catalogue des services à vérifier"
								: "Cartographie des services indisponible"
							: configurationIssue
								? "Service catalog access needs attention"
								: "Service architecture unavailable"}
					</h2>
					<p className={styles.description}>
						{french
							? "Le catalogue qui alimente les cartes et le graphe n’a pas pu être chargé. Cela ne signifie pas que les services sont arrêtés."
							: "The catalog powering the service cards and graph could not be loaded. This does not mean the services are down."}
					</p>
					<div className={styles.diagnostic}>
						<strong>{french ? "Point à vérifier" : "What to check"}</strong>
						<p>{french ? help.fr : help.en}</p>
					</div>
					<div className={styles.actions}>
						<button className={styles.retry} type="button" onClick={onRetry}>
							<svg
								viewBox="0 0 24 24"
								width="18"
								height="18"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M20 7v5h-5" />
								<path d="M4 17v-5h5" />
								<path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 4a7 7 0 0 0 11.6-2" />
							</svg>
							{french ? "Réessayer le chargement" : "Try loading again"}
						</button>
						<span className={styles.note}>
							{french
								? "Aucun inventaire approximatif n’est affiché."
								: "No approximate inventory is displayed."}
						</span>
					</div>
				</div>
			</div>
		</section>
	);
}
