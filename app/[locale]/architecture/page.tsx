import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import TopAnchor from "@/components/TopAnchor";
import ActionLink from "@/components/ui/ActionLink";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/socialMetadata";

type ArchitecturePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
	params,
}: ArchitecturePageProps): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const french = locale === "fr";
	return buildPageMetadata({
		title: french ? "Architecture de la plateforme Nabla" : "Nabla platform architecture",
		description: french
			? "Principes de la plateforme : infrastructure, sécurité et observabilité. Les topologies opérationnelles restent privées."
			: "Platform principles: infrastructure, security, and observability. Operational topologies are private.",
		slug: "architecture",
		locale,
	});
}

export default async function ArchitecturePage({
	params,
}: ArchitecturePageProps) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const french = locale === "fr";
	const prefix = french ? "/fr" : "";

	return (
		<div className="site-content-page page-dark architecture-page">
			<TopAnchor />
			<main id="main-content">
				<section
					id="architecture-overview"
					className="hero-section"
					aria-labelledby="architecture-title"
				>
					<div className="hero-content">
						<h1 id="architecture-title" className="hero-title">
							{french ? "Architecture Nabla" : "Nabla architecture"}
						</h1>
						<p className="hero-subtitle">
							{french
								? "Une plateforme auto-hébergée pour la sécurité, les services et l’IA."
								: "A self-hosted platform for security, services, and AI."}
						</p>
						<div className="d-flex flex-wrap gap-2 justify-content-center">
							<ActionLink href={`${prefix}/ai`} variant="secondary">AI</ActionLink>
							<ActionLink href={`${prefix}/truenas`} variant="secondary">TrueNAS</ActionLink>
							<ActionLink href={`${prefix}/nabla`} variant="secondary">Nabla</ActionLink>
						</div>
					</div>
				</section>
				<section
					id="declared-observed-architecture"
					className="content-section"
					aria-labelledby="architecture-principles"
				>
					<div className="container py-5">
						<SectionHeading id="architecture-principles" iconClass="fa-diagram-project">
							{french ? "Principes d’architecture" : "Architecture principles"}
						</SectionHeading>
						<p>
							{french
								? "La plateforme distingue configuration déclarative, exécution et observation. Les relations détaillées, chemins réseau et preuves de santé sont réservés au propriétaire."
								: "The platform separates declared configuration, runtime and observation. Detailed dependencies, network paths and health evidence are owner-only."}
						</p>
						<p>
							<a href="https://ops.albandrieu.com/" rel="nofollow noreferrer">
								{french ? "Consulter l’espace privé" : "Open private operations"}
							</a>
						</p>
					</div>
				</section>
			</main>
			<SiteWidgetsScript />
		</div>
	);
}
