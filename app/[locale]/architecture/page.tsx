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

				<section
					id="declared-observed-architecture"
					className="content-section"
					aria-labelledby="declared-observed-title"
				>
					<div className="container py-5">
						<div className="text-center mx-auto mb-4" style={{ maxWidth: "860px" }}>
							<h2 id="declared-observed-title">
								{french
									? "Configuration déclarée, runtime observé et santé"
									: "Declared configuration, observed runtime, and health"}
							</h2>
							<p>
								{french
									? "L’architecture sépare volontairement ce qui devrait exister, ce qui tourne réellement et ce qui est effectivement utilisable. Cette séparation permet de détecter les dérives sans faire de l’interface Web ou de l’API TrueNAS une source de vérité de configuration."
									: "The architecture deliberately separates what should exist, what is actually running, and what is operationally usable. This makes configuration drift visible without turning the website or the TrueNAS API into the configuration source of truth."}
							</p>
						</div>

						<div className="row g-3">
							<div className="col-12 col-md-6 col-xl-3">
								<div className="card h-100 bg-dark border-secondary p-3">
									<h3 className="h5">1. nabla-compose</h3>
									<p className="mb-0">
										{french
											? "Source déclarative : services x-nabla, identité stable, binding runtime et relations de topologie. services.json et service-topology.json sont générés depuis le code."
											: "Declarative source: x-nabla services, stable identity, runtime binding, and topology relationships. services.json and service-topology.json are generated from code."}
									</p>
								</div>
							</div>
							<div className="col-12 col-md-6 col-xl-3">
								<div className="card h-100 bg-dark border-secondary p-3">
									<h3 className="h5">2. TrueNAS API</h3>
									<p className="mb-0">
										{french
											? "Source runtime observée : le client officiel truenas_api_client interroge app.query pour les Apps, containers, états et versions. Il ne décide jamais qu’un service doit exister ou être public."
											: "Observed runtime source: the official truenas_api_client queries app.query for Apps, containers, states, and versions. It never decides that a service should exist or be public."}
									</p>
								</div>
							</div>
							<div className="col-12 col-md-6 col-xl-3">
								<div className="card h-100 bg-dark border-secondary p-3">
									<h3 className="h5">3. fastapi-sample</h3>
									<p className="mb-0">
										{french
											? "Couche de réconciliation : joint les bindings déclarés aux workloads TrueNAS, classe les écarts (in_sync, declared_only, observed_only, conflict) et garde les contrôles de santé séparés."
											: "Reconciliation layer: joins declared bindings to TrueNAS workloads, classifies drift (in_sync, declared_only, observed_only, conflict), and keeps health checks separate."}
									</p>
								</div>
							</div>
							<div className="col-12 col-md-6 col-xl-3">
								<div className="card h-100 bg-dark border-secondary p-3">
									<h3 className="h5">4. albanandrieu.com</h3>
									<p className="mb-0">
										{french
											? "Couche de présentation : visualise la topologie, le statut runtime et la santé sans devenir une source de données backend."
											: "Presentation layer: visualizes topology, runtime status, and health without becoming a backend data source."}
									</p>
								</div>
							</div>
						</div>

						<div className="text-center mt-4">
							<p className="mb-3">
								<strong>Declared ≠ Observed ≠ Healthy</strong>
							</p>
							<div className="d-flex flex-wrap gap-2 justify-content-center">
								<ActionLink
									href="https://github.com/AlbanAndrieu/nabla-compose"
									variant="secondary"
								>
									nabla-compose
								</ActionLink>
								<ActionLink
									href="https://github.com/AlbanAndrieu/fastapi-sample"
									variant="secondary"
								>
									fastapi-sample
								</ActionLink>
							</div>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
