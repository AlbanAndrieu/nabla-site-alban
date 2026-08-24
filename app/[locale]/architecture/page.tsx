import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import ActionLink from "@/components/ui/ActionLink";
import { routing } from "@/i18n/routing";
import { loadHomelabServicesCatalog } from "@/lib/homelabServices";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import { loadServiceTopology } from "@/lib/serviceTopology";
import ArchitectureExplorer from "./ArchitectureExplorer";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/architecture">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const french = locale === "fr";
	return {
		title: french ? "Architecture des services Nabla" : "Nabla service architecture",
		description: french
			? "Diagrammes interactifs de la plateforme IA et de la topologie des services Nabla et TrueNAS."
			: "Interactive diagrams of the AI platform and the Nabla and TrueNAS service topology.",
		alternates: {
			canonical: canonicalPagePath("architecture", locale),
			languages: {
				en: canonicalPagePath("architecture", "en"),
				fr: canonicalPagePath("architecture", "fr"),
			},
		},
	};
}

export default async function ArchitecturePage({
	params,
}: PageProps<"/[locale]/architecture">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const french = locale === "fr";
	const [{ catalog, source: catalogSource }, { topology, source: topologySource }] =
		await Promise.all([loadHomelabServicesCatalog(), loadServiceTopology()]);
	const prefix = french ? "/fr" : "";

	return (
		<div className="site-content-page page-dark">
			<TopAnchor />
			<SkipToMainContent />
			<main id="main-content">
				<section className="hero-section" aria-labelledby="architecture-title">
					<div className="hero-content">
						<h1 id="architecture-title" className="hero-title">
							<i className="fas fa-diagram-project" aria-hidden="true" />{" "}
							{french ? "Architecture interactive Nabla" : "Interactive Nabla architecture"}
						</h1>
						<p className="hero-subtitle">
							{french
								? "Plateforme IA, services homelab, dépendances fonctionnelles et intégrations observables."
								: "AI platform, homelab services, functional dependencies, and observable integrations."}
						</p>
						<p className="hero-description">
							{french
								? "La vue AI Platform reprend le diagramme d’architecture précédent avec les outils individuels. La vue Nabla / TrueNAS fusionne le catalogue de services avec les relations déclarées dans nabla-compose ; elle n’utilise pas depends_on comme substitut à une architecture fonctionnelle."
								: "AI Platform expands the previous architecture diagram into individual tools. Nabla / TrueNAS merges the service inventory with relationships declared in nabla-compose; it does not use depends_on as a substitute for functional architecture."}
						</p>
						<div className="d-flex flex-wrap gap-2 justify-content-center">
							<ActionLink href={`${prefix}/ai`} variant="secondary">AI</ActionLink>
							<ActionLink href={`${prefix}/truenas`} variant="secondary">TrueNAS</ActionLink>
							<ActionLink href={`${prefix}/nabla`} variant="secondary">Nabla</ActionLink>
						</div>
					</div>
				</section>

				<ArchitectureExplorer
					locale={locale}
					catalog={catalog}
					catalogSource={catalogSource}
					topology={topology}
					topologySource={topologySource}
				/>
			</main>
		</div>
	);
}
