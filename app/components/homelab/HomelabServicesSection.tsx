import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import HomelabPrivateServices from "./HomelabPrivateServices";
import styles from "./HomelabServicesSection.module.css";

type Props = { headingId?: string };

/**
 * Anonymous visitors see only the editorial platform overview; the owner
 * network or Cloudflare Access additionally loads the private service views.
 */
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
				</div>
				<HomelabPrivateServices />
			</div>
		</section>
	);
}
