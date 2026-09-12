import { getTranslations } from "next-intl/server";
import ActionLink from "@/components/ui/ActionLink";
import SectionHeading from "@/components/SectionHeading";
import HomelabOperationsDisclosure from "./HomelabOperationsDisclosure";
import HomelabServicesBlock from "./HomelabServicesBlock";
import styles from "./HomelabServicesSection.module.css";

type Props = {
	headingId?: string;
};

export default async function HomelabServicesSection({
	headingId = "homelab-services",
}: Props) {
	const t = await getTranslations("homelab.section");

	return (
		<section
			className="stack-page-hero py-5 homelab-services-section page-truenas-apps"
			aria-labelledby={headingId}
		>
			<div className="container">
				<div className={styles.sectionHeader}>
					<SectionHeading id={headingId} iconClass="fa-server">
						{t("title")}
					</SectionHeading>
					<div className={styles.introCard}>
						<span className={styles.introIcon} aria-hidden="true">
							<i className="fas fa-heart-pulse" />
						</span>
						<p className={styles.introText}>{t("lead")}</p>
						<div className={styles.architectureLink}>
							<ActionLink
								href="architecture#declared-observed-architecture"
								variant="secondary"
							>
								<i className="fas fa-diagram-project" aria-hidden="true" />{" "}
								Architecture
							</ActionLink>
						</div>
					</div>
					<p className="small text-secondary homelab-services-foss-note mt-3 mb-0">
						{t("iconsBefore")}{" "}
						<a
							href="https://selfh.st/icons/"
							target="_blank"
							rel="noopener noreferrer"
						>
							selfh.st/icons
						</a>
						. {t("iconsAfter")}{" "}
						<a
							href="https://selfh.st/apps/"
							target="_blank"
							rel="noopener noreferrer"
						>
							selfh.st/apps
						</a>
						.
					</p>
				</div>

				<div className={styles.serviceFirst} data-service-first-homelab-view>
					<HomelabServicesBlock />
				</div>
				<HomelabOperationsDisclosure />
			</div>
		</section>
	);
}
