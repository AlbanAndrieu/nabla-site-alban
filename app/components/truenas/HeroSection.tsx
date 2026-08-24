import { getTranslations } from "next-intl/server";

export default async function HeroSection() {
	const t = await getTranslations("truenas.page.hero");

	return (
		<section className="truenas-hero" aria-label={t("ariaLabel")}>
			<div className="container py-4 mb-2">
				<h1 className="display-4 mb-2 text-center">{t("title")}</h1>
				<p className="lead mb-1 text-center">{t("lead")}</p>
				<p className="lead text-center small text-muted">
					{t("credit")} <br />
					{t("topics")}
				</p>
			</div>
		</section>
	);
}
