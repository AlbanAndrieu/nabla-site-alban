import { getTranslations } from "next-intl/server";
import ActionLink from "@/components/ui/ActionLink";
import Button from "@/components/ui/Button";
import Card, { CardBody } from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import styles from "./WorkstationLayout.module.css";
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
					styles.section,
					"workstation-section",
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
							<h2
								id={section.id}
								className={`${styles.sectionTitle} workstation-section-title`}
							>
								<span
									className={`${styles.sectionTitleIcon} workstation-section-title__icon`}
									aria-hidden="true"
								>
									<i className={section.iconClassName} />
								</span>
								{copy.title}
							</h2>
							<div className={styles.serviceGrid}>
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
										<Card key={service.key} elevated>
											<CardBody>
												<h3 className={styles.cardTitle}>
													<b>{service.name}</b>
												</h3>
												<p>{serviceCopy.description}</p>
												<div className={styles.actionRow}>
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
													<small className={styles.servicePort}>{service.port}</small>
												</div>
											</CardBody>
										</Card>
									);
								})}
							</div>
							{copy.note ? (
								<p className={styles.note}>{copy.note}</p>
							) : null}
						</Container>
					</section>
				);
			})}
			<section
				className={`${styles.section} ${styles.relatedSection} workstation-section workstation-section--alt`}
				aria-labelledby="workstation-related-heading"
			>
				<Container>
					<h2
						id="workstation-related-heading"
						className={`${styles.sectionTitle} workstation-section-title`}
					>
						<span
							className={`${styles.sectionTitleIcon} workstation-section-title__icon`}
							aria-hidden="true"
						>
							<i className="fas fa-link" />
						</span>
						{t("related.title")}
					</h2>
					<div className={styles.relatedGrid}>
						<Card elevated>
							<CardBody>
								<h3 className={styles.relatedTitle}>TrueNAS Scale</h3>
								<p className={styles.relatedCopy}>
									{t("related.truenas.description")}
								</p>
								<ActionLink
									href={truenasHref}
									variant="outline"
									size="compact"
									className={styles.relatedAction}
									data-ui-action=""
								>
									{t("related.truenas.action")}
								</ActionLink>
							</CardBody>
						</Card>
						<Card elevated>
							<CardBody>
								<h3 className={styles.relatedTitle}>Nabla</h3>
								<p className={styles.relatedCopy}>
									{t("related.nabla.description")}
								</p>
								<ActionLink
									href={nablaHref}
									variant="outline"
									size="compact"
									className={styles.relatedAction}
									data-ui-action=""
								>
									{t("related.nabla.action")}
								</ActionLink>
							</CardBody>
						</Card>
					</div>
				</Container>
			</section>
		</>
	);
}
