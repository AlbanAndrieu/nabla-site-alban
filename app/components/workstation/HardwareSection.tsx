import { getTranslations } from "next-intl/server";
import Card, { CardBody } from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import styles from "./WorkstationLayout.module.css";

export default async function HardwareSection() {
	const t = await getTranslations("workstation.hardware");

	return (
		<section
			className="category-section nabla-platforms-section hardware-section"
			aria-labelledby="hardware-heading"
		>
			<Container>
				<div className={styles.hardwareContent}>
					<h2
						id="hardware-heading"
						className={`${styles.hardwareTitle} hardware-heading-with-icon`}
					>
						<span
							className="hardware-heading-with-icon__glyph"
							aria-hidden="true"
						>
							<i className="fas fa-server" />
						</span>
						<span className="hardware-heading-with-icon__text">{t("title")}</span>
					</h2>
					<h3 className={styles.hardwareSubtitle} id="nabla-workstation-heading">
						<i
							className={`fas fa-database ${styles.headingIcon}`}
							aria-hidden="true"
						/>
						{t("workstationTitle")}
					</h3>
					<div className={`hardware-platform-band ${styles.hardwareBand}`}>
						<Card elevated className={styles.hardwareIntroCard}>
							<CardBody>
								<p className={`${styles.hardwareIntro} hardware-bom-intro`}>
									<span
										className="hardware-bom-intro__icon"
										aria-hidden="true"
									>
										<i className="fas fa-screwdriver-wrench" />
									</span>
									<span className="hardware-bom-intro__text">{t("intro")}</span>
								</p>
							</CardBody>
						</Card>
					</div>
				</div>
			</Container>
		</section>
	);
}
