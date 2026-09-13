import { getTranslations } from "next-intl/server";
import { WORKSTATION_SECTIONS } from "./workstationServices";

type Props = Readonly<{
	truenasHref: string;
	nablaHref: string;
}>;

type ServiceCopy = Readonly<{
	description: string;
	action: string;
}>;

type SectionCopy = Readonly<{
	title: string;
	services: Readonly<Record<string, ServiceCopy>>;
	note?: string;
}>;

export default async function WorkstationServiceSections({
	truenasHref,
	nablaHref,
}: Props) {
	const t = await getTranslations("workstation");

	return (
		<>
			{WORKSTATION_SECTIONS.map((section) => {
				const copy = t.raw(`sections.${section.key}`) as SectionCopy;
				const sectionClassName = [
					"workstation-section",
					"py-5",
					section.alternate
						? "workstation-section--alt"
						: "workstation-section--apps",
				].join(" ");

				return (
					<section
						key={section.key}
						className={sectionClassName}
						aria-labelledby={section.id}
					>
						<div className="container">
							<h2
								id={section.id}
								className="workstation-section-title h3 mb-4"
							>
								<span
									className="workstation-section-title__icon"
									aria-hidden="true"
								>
									<i className={section.iconClassName} />
								</span>
								{copy.title}
							</h2>
							<div className="row">
								{section.services.map((service) => {
									const serviceCopy = copy.services[service.key];
									if (!serviceCopy) {
										throw new Error(
											`Missing workstation copy for ${section.key}.${service.key}`,
										);
									}
									const actionClassName = `btn btn-sm btn-outline-${
										service.actionTone ?? "primary"
									}`;

									return (
										<div key={service.key} className="col-md-4 p-3">
											<div className="card workstation-service-card box-shadow h-100">
												<div className="card-body">
													<h3 className="h5 card-title">
														<b>{service.name}</b>
													</h3>
													<p className="card-text">
														{serviceCopy.description}
													</p>
													<div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
														{service.disabled ? (
															<button
																type="button"
																className={actionClassName}
																disabled
															>
																{serviceCopy.action}
															</button>
														) : (
															<a
																href={service.href}
																className={actionClassName}
															>
																<i
																	className={service.iconClassName}
																	aria-hidden="true"
																/>{" "}
																{serviceCopy.action}
															</a>
														)}
														<small className="text-muted">{service.port}</small>
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
							{copy.note ? (
								<p className="text-secondary small mt-3 mb-0">{copy.note}</p>
							) : null}
						</div>
					</section>
				);
			})}
			<section
				className="workstation-section workstation-section--alt py-5 border-top border-secondary"
				aria-labelledby="workstation-related-heading"
			>
				<div className="container">
					<h2
						id="workstation-related-heading"
						className="workstation-section-title h3 mb-4"
					>
						<span
							className="workstation-section-title__icon"
							aria-hidden="true"
						>
							<i className="fas fa-link" />
						</span>
						{t("related.title")}
					</h2>
					<div className="row g-4">
						<div className="col-md-6">
							<div className="card workstation-service-card box-shadow h-100 border-secondary">
								<div className="card-body">
									<h3 className="h6 card-title">TrueNAS Scale</h3>
									<p className="card-text text-muted small mb-0">
										{t("related.truenas.description")}
									</p>
									<a
										href={truenasHref}
										className="btn btn-sm btn-outline-primary mt-3"
									>
										{t("related.truenas.action")}
									</a>
								</div>
							</div>
						</div>
						<div className="col-md-6">
							<div className="card workstation-service-card box-shadow h-100 border-secondary">
								<div className="card-body">
									<h3 className="h6 card-title">Nabla</h3>
									<p className="card-text text-muted small mb-0">
										{t("related.nabla.description")}
									</p>
									<a
										href={nablaHref}
										className="btn btn-sm btn-outline-primary mt-3"
									>
										{t("related.nabla.action")}
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
