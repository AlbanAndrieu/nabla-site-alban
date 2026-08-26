import ActionLink from "@/components/ui/ActionLink";
import { canonicalPagePath } from "@/lib/sitePageCatalog";

type Props = Readonly<{ locale: "en" | "fr" }>;

export default function WorkstationHero({ locale }: Props) {
	const french = locale === "fr";
	return (
		<header>
			<section
				className="py-5 bg-light page-truenas-apps"
				aria-labelledby="workstation-compose-heading"
			>
				<div className="container">
					<div className="row mb-4">
						<div className="col-12 text-center">
							<h1 id="workstation-compose-heading" className="display-4 mb-3">
								{french ? "Services Docker Compose" : "Docker Compose Services"}
							</h1>
							<p className="lead text-secondary mb-0 page-truenas-apps__lead">
								{french
									? "Applications et services auto-hébergés exécutés sur ma station de travail et préparés pour une migration depuis ou vers TrueNAS Scale."
									: "Self-hosted applications and services running on my workstation and prepared for migration from or to TrueNAS Scale."}
							</p>
							<p className="text-secondary mb-0 mt-3">
								{french ? "Pour le catalogue côté NAS, consultez " : "For the NAS-side catalog, see "}
								<a href={canonicalPagePath("truenas", locale)}>
									{french ? "les services TrueNAS Scale" : "TrueNAS Scale services"}
								</a>
								.
							</p>
						</div>
					</div>

					<div className="row">
						<div className="col-lg-6 p-3">
							<div className="card box-shadow h-100">
								<div className="card-body d-flex flex-column">
									<h2 className="h5 card-title">
										<i className="fab fa-github me-2 text-primary" aria-hidden="true" />
										nabla-compose
									</h2>
									<p className="card-text flex-grow-1">
										{french
											? "Fichiers Docker Compose pour la station de travail et les déploiements associés."
											: "Docker Compose files for the workstation and related deployments."}
									</p>
									<ActionLink
										href="https://github.com/AlbanAndrieu/nabla-compose"
										variant="secondary"
									>
										<i className="fab fa-github" aria-hidden="true" />{" "}
										{french ? "Ouvrir nabla-compose" : "Open nabla-compose"}
									</ActionLink>
								</div>
							</div>
						</div>

						<div className="col-lg-6 p-3">
							<div className="card box-shadow h-100">
								<div className="card-body d-flex flex-column">
									<h2 className="h5 card-title">
										<i className="fab fa-github me-2 text-primary" aria-hidden="true" />
										ansible-workstation
									</h2>
									<p className="card-text flex-grow-1">
										{french
											? "Rôle et playbooks Ansible qui provisionnent cette station Ubuntu, ses paquets et ses outils desktop optionnels."
											: "Ansible role and playbooks that provision this Ubuntu workstation, its packages, and optional desktop tooling."}
									</p>
									<ActionLink
										href="https://github.com/AlbanAndrieu/ansible-workstation"
										variant="secondary"
									>
										<i className="fab fa-github" aria-hidden="true" />{" "}
										{french ? "Ouvrir ansible-workstation" : "Open ansible-workstation"}
									</ActionLink>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</header>
	);
}
