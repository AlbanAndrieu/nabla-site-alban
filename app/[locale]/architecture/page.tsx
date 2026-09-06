import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import HomelabOperationalEvidence from "@/app/components/homelab/HomelabOperationalEvidence";
import HomeLabNetworkFlow from "@/app/components/truenas/HomeLabNetworkFlow";
import AnchoredHeading from "@/components/AnchoredHeading";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import ActionLink from "@/components/ui/ActionLink";
import { routing } from "@/i18n/routing";
import { getStaticHomelabServicesCatalog } from "@/lib/homelabServices";
import { getStaticServiceTopology } from "@/lib/serviceTopology";
import { buildPageMetadata } from "@/lib/socialMetadata";
import ArchitectureImpactInspector from "./ArchitectureImpactInspector";
import ArchitectureSectionNav from "./ArchitectureSectionNav";
import ArchitectureTopologyView from "./ArchitectureTopologyView";
import styles from "./ArchitecturePage.module.css";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/architecture">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const french = locale === "fr";
	return buildPageMetadata({
		title: french
			? "Architecture des services Nabla"
			: "Nabla service architecture",
		description: french
			? "Diagrammes interactifs de la plateforme IA et de la topologie des services Nabla et TrueNAS."
			: "Interactive diagrams of the AI platform and the Nabla and TrueNAS service topology.",
		slug: "architecture",
		locale,
	});
}

export default async function ArchitecturePage({
	params,
}: PageProps<"/[locale]/architecture">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const french = locale === "fr";
	const { catalog, source: catalogSource } = getStaticHomelabServicesCatalog();
	const { topology, source: topologySource } = getStaticServiceTopology();
	const prefix = french ? "/fr" : "";

	return (
		<div className="site-content-page page-dark">
			<TopAnchor />
			<SkipToMainContent />
			<main id="main-content">
				<section
					id="architecture-overview"
					className="hero-section"
					aria-labelledby="architecture-title"
				>
					<div className="hero-content">
						<h1 id="architecture-title" className="hero-title">
							<i className="fas fa-diagram-project" aria-hidden="true" />{" "}
							{french
								? "Architecture interactive Nabla"
								: "Interactive Nabla architecture"}
						</h1>
						<p className="hero-subtitle">
							{french
								? "Plateforme IA, services homelab, dépendances fonctionnelles et intégrations observables."
								: "AI platform, homelab services, functional dependencies, and observable integrations."}
						</p>
						<p className="hero-description">
							{french
								? "La lecture commence par les fondations et composants à plus grand rayon d’impact, avant les applications feuilles. La vue détaillée conserve ensuite l’ensemble des relations déclarées dans nabla-compose."
								: "The page starts with foundations and components with the largest blast radius before leaf applications. The detailed view then keeps the complete relationship graph declared in nabla-compose."}
						</p>
						<div className="d-flex flex-wrap gap-2 justify-content-center">
							<ActionLink href={`${prefix}/ai`} variant="secondary">
								AI
							</ActionLink>
							<ActionLink href={`${prefix}/truenas`} variant="secondary">
								TrueNAS
							</ActionLink>
							<ActionLink href={`${prefix}/nabla`} variant="secondary">
								Nabla
							</ActionLink>
						</div>
					</div>
				</section>

				<ArchitectureSectionNav locale={locale} />
				<div className="container">
					<HomelabOperationalEvidence />
				</div>
				<ArchitectureImpactInspector locale={locale} />

				<ArchitectureTopologyView
					locale={locale}
					initialCatalog={catalog}
					initialCatalogSource={catalogSource}
					initialTopology={topology}
					initialTopologySource={topologySource}
				/>

				<section
					id="homelab-network-architecture"
					className="content-section"
					aria-labelledby="homelab-network-ingress-paths"
				>
					<div className="container py-5">
						<div
							className={`text-center mx-auto mb-4 ${styles.networkIntro}`}
						>
							<AnchoredHeading id="homelab-network-ingress-paths">
								{french
									? "Réseau homelab et chemins d’ingress"
									: "Homelab network and ingress paths"}
							</AnchoredHeading>
							<p>
								{french
									? "Ce diagramme React Flow est exactement le même composant que celui de la page TrueNAS. Il distingue le chemin HAProxy direct, le DNS Cloudflare sans Tunnel pour Garage et le Cloudflare Tunnel terminé par le conteneur Docker cloudflared pour OpenWebUI."
									: "This React Flow diagram is the exact same component used on the TrueNAS page. For Garage, client HTTPS terminates at HAProxy on pfSense, HAProxy re-encrypts the backend connection with TLS to Traefik :443 on TrueNAS, and Traefik then routes to Garage. Cloudflare provides DNS only for Garage, while OpenWebUI uses a Cloudflare Tunnel terminated by the cloudflared Docker container."}
							</p>
						</div>
						<HomeLabNetworkFlow />
					</div>
				</section>

				<section
					id="declared-observed-architecture"
					className="content-section"
					aria-labelledby="declared-observed-health"
				>
					<div className="container py-5">
						<div
							className={`text-center mx-auto mb-4 ${styles.evidenceIntro}`}
						>
							<AnchoredHeading id="declared-observed-health">
								{french
									? "Configuration déclarée, runtime observé et santé"
									: "Declared configuration, observed runtime, and health"}
							</AnchoredHeading>
							<p>
								{french
									? "L’architecture sépare volontairement ce qui devrait exister, ce qui tourne réellement et ce qui est effectivement utilisable. Cette séparation permet de détecter les dérives sans faire de l’interface Web ou de l’API TrueNAS une source de vérité de configuration."
									: "The architecture deliberately separates what should exist, what is actually running, and what is operationally usable. This makes configuration drift visible without turning the website or the TrueNAS API into the configuration source of truth."}
							</p>
						</div>

						<div className="row g-3">
							{[
								[
									"1. nabla-compose",
									french
										? "Source déclarative : services x-nabla, identité stable, binding runtime et relations de topologie. services.json et service-topology.json sont générés depuis le code."
										: "Declarative source: x-nabla services, stable identity, runtime binding, and topology relationships. services.json and service-topology.json are generated from code.",
								],
								[
									"2. TrueNAS API",
									french
										? "Source runtime observée : le client officiel truenas_api_client interroge app.query pour les Apps, containers, états et versions. Il ne décide jamais qu’un service doit exister ou être public."
										: "Observed runtime source: the official truenas_api_client queries app.query for Apps, containers, states, and versions. It never decides that a service should exist or be public.",
								],
								[
									"3. fastapi-sample",
									french
										? "Couche de réconciliation : joint les bindings déclarés aux workloads TrueNAS, classe les écarts (in_sync, declared_only, observed_only, conflict) et garde les contrôles de santé séparés."
										: "Reconciliation layer: joins declared bindings to TrueNAS workloads, classifies drift (in_sync, declared_only, observed_only, conflict), and keeps health checks separate.",
								],
								[
									"4. albanandrieu.com",
									french
										? "Couche de présentation : visualise la topologie, le statut runtime et la santé sans devenir une source de données backend."
										: "Presentation layer: visualizes topology, runtime status, and health without becoming a backend data source.",
								],
							].map(([title, copy]) => (
								<div className="col-12 col-md-6 col-xl-3" key={title}>
									<div className="card h-100 bg-dark border-secondary p-3">
										<h3 className="h5">{title}</h3>
										<p className="mb-0">{copy}</p>
									</div>
								</div>
							))}
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
