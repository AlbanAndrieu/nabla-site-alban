import { getTranslations } from "next-intl/server";
import AnchoredHeading from "@/components/AnchoredHeading";

type Props = {
	locale: string;
};

const OUTCOME_DOMAINS = ["legal", "devops", "platform"] as const;

export default async function HomeOutcomesSection({ locale }: Props) {
	const t = await getTranslations({ locale, namespace: "home" });
	const prefix = locale === "fr" ? "/fr" : "";

	return (
		<section className="proof-section" aria-labelledby="outcomes">
			<AnchoredHeading className="section-title" id="outcomes">
				{t("outcomes.title")}
			</AnchoredHeading>
			<p className="section-subtitle">{t("outcomes.engagements")}</p>
			<div className="proof-grid">
				{OUTCOME_DOMAINS.map((domain) => (
					<div className="proof-card" key={domain}>
						<h3>{t(`outcomes.${domain}.title`)}</h3>
						<p className="proof-context">{t(`outcomes.${domain}.context`)}</p>
						<ul>
							<li>{t(`outcomes.${domain}.pt1`)}</li>
							<li>{t(`outcomes.${domain}.pt2`)}</li>
							<li>{t(`outcomes.${domain}.pt3`)}</li>
						</ul>
					</div>
				))}
			</div>
			<p className="section-subtitle mt-4 mb-0">
				<a href={`${prefix}/expertise`}>{t("outcomes.detail")}</a>
			</p>
		</section>
	);
}
