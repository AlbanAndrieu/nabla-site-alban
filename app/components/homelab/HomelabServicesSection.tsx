import { getLocale, getTranslations } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import styles from "./HomelabServicesSection.module.css";

type Props = { headingId?: string };

/** Anonymous visitors see only the editorial platform overview. */
export default async function HomelabServicesSection({
	headingId = "homelab-services",
}: Props) {
	const [t, locale] = await Promise.all([
		getTranslations("homelab.section"),
		getLocale(),
	]);
	const french = locale === "fr";
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
					<p>
						{french
							? "Cette plateforme regroupe des expérimentations d’infrastructure, de sécurité et d’IA. Les ports, métriques et diagnostics sont privés."
							: "This platform supports infrastructure, security, and AI experiments. Ports, metrics and diagnostics are private."}
					</p>
					<p>
						<a href="https://ops.albandrieu.com/" rel="nofollow noreferrer">
							{french ? "Espace opérations privé" : "Private operations"}
						</a>
					</p>
				</div>
			</div>
		</section>
	);
}
