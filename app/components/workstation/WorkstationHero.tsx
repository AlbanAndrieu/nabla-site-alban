import { getTranslations } from "next-intl/server";
import Container from "@/components/ui/Container";
import ExternalLink from "@/components/ui/ExternalLink";

type Props = Readonly<{
	truenasHref: string;
}>;

export default async function WorkstationHero({ truenasHref }: Props) {
	const t = await getTranslations("workstation.hero");

	return (
		<header>
			<section
				className="py-5 bg-light page-truenas-apps"
				aria-labelledby="workstation-compose-heading"
			>
				<Container>
					<div className="row mb-4">
						<div className="col-12 text-center">
							<h1 id="workstation-compose-heading" className="display-4 mb-3">
								{t("title")}
							</h1>
							<p className="lead text-secondary mb-0 page-truenas-apps__lead">
								{t("subtitle")}
							</p>
							<p className="text-secondary mb-0 mt-3">
								{t("nasLead")} <a href={truenasHref}>{t("nasLink")}</a>.
							</p>
						</div>
					</div>
					<div className="row">
						<div className="col-lg-6 p-3">
							<div className="card box-shadow h-100">
								<div className="card-body d-flex flex-column">
									<h2 className="h5 card-title">
										<i
											className="fab fa-github me-2 text-primary"
											aria-hidden="true"
										/>
										nabla-compose
									</h2>
									<p className="card-text flex-grow-1">
										{t("repositories.nablaCompose.description")}
									</p>
									<ExternalLink
										href="https://github.com/AlbanAndrieu/nabla-compose"
										className="btn btn-sm btn-outline-primary align-self-start"
									>
										<i className="fab fa-github" aria-hidden="true" />{" "}
										{t("repositories.nablaCompose.action")}
									</ExternalLink>
								</div>
							</div>
						</div>
						<div className="col-lg-6 p-3">
							<div className="card box-shadow h-100">
								<div className="card-body d-flex flex-column">
									<h2 className="h5 card-title">
										<i
											className="fab fa-github me-2 text-primary"
											aria-hidden="true"
										/>
										ansible-workstation
									</h2>
									<p className="card-text flex-grow-1">
										{t("repositories.ansibleWorkstation.description")}
									</p>
									<ExternalLink
										href="https://github.com/AlbanAndrieu/ansible-workstation"
										className="btn btn-sm btn-outline-primary align-self-start"
									>
										<i className="fab fa-github" aria-hidden="true" />{" "}
										{t("repositories.ansibleWorkstation.action")}
									</ExternalLink>
								</div>
							</div>
						</div>
					</div>
				</Container>
			</section>
		</header>
	);
}
