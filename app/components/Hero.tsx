"use client";

import { useLocale, useTranslations } from "next-intl";

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
					<a
						href="https://calendly.com/alban-andrieu"
						target="_blank"
						rel="noopener noreferrer"
						className="btn btn-primary"
					>
						<i className="fa fa-calendar-plus"></i> {t("home.hero.cta.book")}
					</a>
					<a
						href={`${localePrefix}/startup.html`}
						className="btn btn-outline-light"
					>
						<i className="fas fa-rocket" aria-hidden="true"></i>{" "}
						{t("home.hero.cta.start")}
					</a>
					<a
						href={`${localePrefix}/cv/cv-small-${locale}.html`}
						className="btn btn-secondary"
						target="_blank"
						rel="noopener noreferrer"
					>
						<i className="fas fa-file-pdf"></i> {t("home.hero.cta.pdf")}
					</a>
					<a
						href="https://www.linkedin.com/in/nabla/"
						target="_blank"
						rel="noopener noreferrer"
						className="btn btn-secondary"
					>
						<i className="fab fa-linkedin"></i> {t("home.hero.cta.linkedin")}
					</a>
				</div>
				<div
					className="hero-value-list"
					aria-label={t("home.hero.services")}
				>
					<ul>
						<li>{t("home.hero.lastexp1")}</li>
						<li>{t("home.hero.lastexp2")}</li>
						<li>{t("home.hero.lastexp3")}</li>
						<li>{t("home.hero.lastexp4")}</li>
					</ul>
				</div>
				<div className="cta-buttons">
					<a href={`${localePrefix}/expertise`} className="btn btn-secondary">
						<i className="fas fa-layer-group" aria-hidden="true"></i>{" "}
						{t("home.hero.services")}
					</a>
				</div>
			</div>
		</section>
	);
}
