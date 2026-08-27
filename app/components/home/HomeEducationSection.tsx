import { getTranslations } from "next-intl/server";
import AnchoredHeading from "@/components/AnchoredHeading";

type Props = {
	locale: string;
};

export default async function HomeEducationSection({ locale }: Props) {
	const t = await getTranslations({ locale, namespace: "home" });
	const prefix = locale === "fr" ? "/fr" : "";

	return (
		<section className="education-section" aria-labelledby="education">
			<AnchoredHeading className="section-title" id="education">
				{t("education.title")}
			</AnchoredHeading>
			<div className="education-grid">
				<EducationCard
					icon="fa-globe"
					featured
					title={t("education.international.title")}
					org={t("education.international.org")}
				>
					{t.rich("education.international.details", {
						strong: (chunks) => <strong>{chunks}</strong>,
					})}
				</EducationCard>
				<EducationCard
					icon="fa-graduation-cap"
					title={t("education.engineering.title")}
					org={t("education.engineering.org")}
				>
					{t("education.engineering.details")}
				</EducationCard>
				<EducationCard
					icon="fa-certificate"
					title={t("education.iso.title")}
					org={t("education.iso.org")}
				>
					{t.rich("education.iso.details", {
						strong: (chunks) => <strong>{chunks}</strong>,
						link: (chunks) => (
							<a href={`${prefix}/security#security-standards-compliance`}>
								{chunks}
							</a>
						),
					})}
				</EducationCard>
				<EducationCard
					icon="fa-cloud"
					title={t("education.cloud.title")}
					org={t("education.cloud.org")}
				>
					{t("education.cloud.details")}
				</EducationCard>
			</div>
		</section>
	);
}

function EducationCard({
	icon,
	featured = false,
	title,
	org,
	children,
}: {
	icon: string;
	featured?: boolean;
	title: string;
	org: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={`education-card${featured ? " education-card--featured" : ""}`}
		>
			<div className="education-icon">
				<i className={`fas ${icon}`} aria-hidden="true" />
			</div>
			<h3>{title}</h3>
			<p className="education-institution">{org}</p>
			<p className="education-details">{children}</p>
		</div>
	);
}
