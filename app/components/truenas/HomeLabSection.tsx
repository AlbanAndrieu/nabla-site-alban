import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import HomeLabPrivateNetwork from "./HomeLabPrivateNetwork";

export default async function HomeLabSection() {
	const t = await getTranslations("truenas.page.homelab");
	return (
		<section className="py-4 page-truenas-secondary" aria-labelledby="homelab">
			<div className="container">
				<SectionHeading id="homelab" iconClass="fa-layer-group">
					{t("title")}
				</SectionHeading>
				<p className="text-secondary mb-4">{t("intro")}</p>
				<p>{t("purpose")}</p>
				<p className="small">{t("projectDetails")}</p>
				<HomeLabPrivateNetwork />
			</div>
		</section>
	);
}
