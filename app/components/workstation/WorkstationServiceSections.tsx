import { getTranslations } from "next-intl/server";
import ActionLink from "@/components/ui/ActionLink";
import Button from "@/components/ui/Button";
import Card, { CardBody } from "@/components/ui/Card";
import Container from "@/components/ui/Container";
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
						<Container>
							<h2 id={section.id} className="workstation-section-title h3 mb-4">
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
									const actionVariant =
										service.actionTone === "secondary"
											? "outlineSecondary"
											: "outline";

									return (
										<div key={service.key} className="col-md-4 p-3">
											<Card elevated className="workstation-service-card h-100">
												<CardBody>
													<h3 className="h5">
														<b>{service.name}</b>
													</h3>
													<p>{serviceCopy.description}</p>
													<div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
														{service.disabled ? (
															<Button
																variant={actionVariant}
																size="compact"
																disabled
															>
																{serviceCopy.action}
															</Button>
														) : (
															<ActionLink
																href={service.href}
																variant={actionVariant}
																size="compact"
																data-ui-action=""
															>
																<i
																	className={service.iconClassName}
																	aria-hidden="true"
																/>{" "}
																{serviceCopy.action}
															</ActionLink>
														)}
														<small className="text-muted">{service.port}</small>
													</div>
												</CardBody>
											</Card>
										</div>
									);
								})}
							</div>
							{copy.note ? (
								<p className="text-secondary small mt-3 mb-0">{copy.note}</p>
							) : null}
						</Container>
					</section>
				);
			})}
			<section
				className="workstation-section workstation-section--alt py-5 border-top border-secondary"
				aria-labelledby="workstation-related-heading"
			>
				<Container>
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
							<Card elevated className="workstation-service-card h-100">
								<CardBody>
									<h3 className="h6">TrueNAS Scale</h3>
									<p className="text-muted small mb-0">
										{t("related.truenas.description")}
									</p>
									<ActionLink
										href={truenasHref}
										variant="outline"
										size="compact"
										className="mt-3"
										data-ui-action=""
									>
										{t("related.truenas.action")}
									</ActionLink>
								</CardBody>
							</Card>
						</div>
						<div className="col-md-6">
							<Card elevated className="workstation-service-card h-100">
								<CardBody>
									<h3 className="h6">Nabla</h3>
									<p className="text-muted small mb-0">
										{t("related.nabla.description")}
									</p>
									<ActionLink
										href={nablaHref}
										variant="outline"
										size="compact"
										className="mt-3"
										data-ui-action=""
									>
										{t("related.nabla.action")}
									</ActionLink>
								</CardBody>
							</Card>
						</div>
					</div>
				</Container>
			</section>
		</>
	);
}
