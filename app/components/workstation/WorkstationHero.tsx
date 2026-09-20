import { getTranslations } from "next-intl/server";
import { actionClassName } from "@/components/ui/ActionLink";
import Card, { CardBody } from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import ExternalLink from "@/components/ui/ExternalLink";
import styles from "./WorkstationLayout.module.css";

type Props = Readonly<{
	truenasHref: string;
}>;

export default async function WorkstationHero({ truenasHref }: Props) {
	const t = await getTranslations("workstation.hero");

	return (
		<header>
			<section
				className={`${styles.heroSection} page-truenas-apps`}
				aria-labelledby="workstation-compose-heading"
			>
				<Container>
					<div className={styles.heroIntro}>
						<h1 id="workstation-compose-heading" className={styles.heroTitle}>
							{t("title")}
						</h1>
						<p className={`${styles.heroLead} page-truenas-apps__lead`}>
							{t("subtitle")}
						</p>
						<p className={styles.heroSupporting}>
							{t("nasLead")} <a href={truenasHref}>{t("nasLink")}</a>.
						</p>
					</div>
					<div className={styles.heroGrid}>
						<Card elevated>
							<CardBody className={styles.heroBody}>
								<h2 className={styles.cardTitle}>
									<i
										className={`fab fa-github ${styles.headingIcon}`}
										aria-hidden="true"
									/>
									nabla-compose
								</h2>
								<p className={styles.grow}>
									{t("repositories.nablaCompose.description")}
								</p>
								<ExternalLink
									href="https://github.com/AlbanAndrieu/nabla-compose"
									className={actionClassName(
										"outline",
										"compact",
										styles.startAction,
									)}
									data-ui-action=""
								>
									<i className="fab fa-github" aria-hidden="true" />{" "}
									{t("repositories.nablaCompose.action")}
								</ExternalLink>
							</CardBody>
						</Card>
						<Card elevated>
							<CardBody className={styles.heroBody}>
								<h2 className={styles.cardTitle}>
									<i
										className={`fab fa-github ${styles.headingIcon}`}
										aria-hidden="true"
									/>
									ansible-workstation
								</h2>
								<p className={styles.grow}>
									{t("repositories.ansibleWorkstation.description")}
								</p>
								<ExternalLink
									href="https://github.com/AlbanAndrieu/ansible-workstation"
									className={actionClassName(
										"outline",
										"compact",
										styles.startAction,
									)}
									data-ui-action=""
								>
									<i className="fab fa-github" aria-hidden="true" />{" "}
									{t("repositories.ansibleWorkstation.action")}
								</ExternalLink>
							</CardBody>
						</Card>
					</div>
				</Container>
			</section>
		</header>
	);
}
