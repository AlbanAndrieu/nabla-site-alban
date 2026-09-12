"use client";

import { useLocale, useTranslations } from "next-intl";
import ActionLink from "@/components/ui/ActionLink";

export default function Hero() {
	const t = useTranslations();
	const locale = useLocale();
	const localePrefix = locale === "fr" ? "/fr" : "";
	return (
		<section
			className="hero-section home-hero"
			id="home"
			aria-labelledby="hero-heading"
		>
			<div className="hero-content">
				<h1 className="hero-title" id="hero-heading">
					{t("home.hero.title")}
				</h1>
				<p className="hero-subtitle">{t("home.hero.subtitle")}</p>
				<ul className="hero-value-list">
					<li>{t("home.hero.stats.ia")}</li>
					<li>{t("home.hero.stats.security")}</li>
					<li>{t("home.hero.stats.infra")}</li>
					<li>{t("home.hero.stats.dev")}</li>
				</ul>
				<div className="cta-buttons">
					<ActionLink
						href="https://calendly.com/alban-andrieu"
						target="_blank"
						rel="noopener noreferrer"
					>
						<i className="fa fa-calendar-plus"></i> {t("home.hero.cta.book")}
					</ActionLink>
					<ActionLink href={`${localePrefix}/startup.html`} variant="inverted">
						<i className="fas fa-rocket" aria-hidden="true"></i>{" "}
						{t("home.hero.cta.start")}
					</ActionLink>
					<ActionLink
						href={`${localePrefix}/cv/cv-small-${locale}.html`}
						variant="secondary"
						target="_blank"
						rel="noopener noreferrer"
					>
						<i className="fas fa-file-pdf"></i> {t("home.hero.cta.pdf")}
					</ActionLink>
					<ActionLink
						href="https://www.linkedin.com/in/nabla/"
						target="_blank"
						rel="noopener noreferrer"
						variant="secondary"
					>
						<i className="fab fa-linkedin"></i> {t("home.hero.cta.linkedin")}
					</ActionLink>
				</div>
				<div className="hero-value-list" aria-label={t("home.hero.services")}>
					<ul>
						<li>{t("home.hero.value1")}</li>
						<li>{t("home.hero.value2")}</li>
						<li>{t("home.hero.value3")}</li>
						<li>{t("home.hero.value4")}</li>
					</ul>
				</div>
				<div className="cta-buttons">
					<ActionLink href={`${localePrefix}/expertise`} variant="secondary">
						<i className="fas fa-layer-group" aria-hidden="true"></i>{" "}
						{t("home.hero.services")}
					</ActionLink>
				</div>
			</div>
		</section>
	);
}
