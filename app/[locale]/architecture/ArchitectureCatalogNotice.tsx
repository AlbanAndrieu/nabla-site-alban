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
		fr: "La configuration d’accès au service FastAPI est incomplète. Vérifiez la clé serveur de diagnostic dans Vercel.",
		en: "The FastAPI service access configuration is incomplete. Check the server-side diagnostics key in Vercel.",
	},
	"access-denied": {
		fr: "FastAPI a refusé l’authentification du service. Vérifiez la correspondance de la clé de diagnostic entre Vercel et FastAPI.",
		en: "FastAPI rejected service authentication. Check that the diagnostics key matches between Vercel and FastAPI.",
	},
	unavailable: {
		fr: "La source Backstage v2 ne répond pas, n’est pas encore publiée ou a renvoyé une réponse invalide. Vérifiez d’abord sa disponibilité.",
		en: "The Backstage v2 source is unreachable, not yet published, or returned an invalid response. Check its availability first.",
	},
};

export default function ArchitectureCatalogNotice({
	french,
	reason,
	onRetry,
}: Readonly<Props>) {
	const help = HELP[reason];
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
							? "Cartographie des services momentanément indisponible"
							: "Service architecture temporarily unavailable"}
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
