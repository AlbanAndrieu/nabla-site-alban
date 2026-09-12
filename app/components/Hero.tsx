"use client";

import { useLocale, useTranslations } from "next-intl";
import ActionLink from "@/components/ui/ActionLink";
import styles from "./Hero.module.css";

export default function Hero() {
	const t = useTranslations();
	const locale = useLocale();
	const localePrefix = locale === "fr" ? "/fr" : "";
	return (
		<section
			className={styles.hero}
			id="home"
			aria-labelledby="hero-heading"
			data-responsive-hero
		>
			<div className={styles.content}>
				<h1 className={styles.title} id="hero-heading">
					{t("home.hero.title")}
				</h1>
				<p className={styles.subtitle}>{t("home.hero.subtitle")}</p>
				<ul className={styles.valueList}>
					<li>{t("home.hero.stats.ia")}</li>
					<li>{t("home.hero.stats.security")}</li>
					<li>{t("home.hero.stats.infra")}</li>
					<li>{t("home.hero.stats.dev")}</li>
				</ul>
				<div className={styles.ctaGroup} data-hero-actions="primary">
					<ActionLink
						href="https://calendly.com/alban-andrieu"
						target="_blank"
						rel="noopener noreferrer"
					>
						<i className="fa fa-calendar-plus" aria-hidden="true"></i>{" "}
						{t("home.hero.cta.book")}
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
						<i className="fas fa-file-pdf" aria-hidden="true"></i>{" "}
						{t("home.hero.cta.pdf")}
					</ActionLink>
					<ActionLink
						href="https://www.linkedin.com/in/nabla/"
						target="_blank"
						rel="noopener noreferrer"
						variant="secondary"
					>
						<i className="fab fa-linkedin" aria-hidden="true"></i>{" "}
						{t("home.hero.cta.linkedin")}
					</ActionLink>
				</div>
				<div
					className={styles.serviceBlock}
					aria-label={t("home.hero.services")}
				>
					<ul className={styles.valueList}>
						<li>{t("home.hero.value1")}</li>
						<li>{t("home.hero.value2")}</li>
						<li>{t("home.hero.value3")}</li>
						<li>{t("home.hero.value4")}</li>
					</ul>
				</div>
				<div className={styles.ctaGroup} data-hero-actions="services">
					<ActionLink href={`${localePrefix}/expertise`} variant="secondary">
						<i className="fas fa-layer-group" aria-hidden="true"></i>{" "}
						{t("home.hero.services")}
					</ActionLink>
				</div>
			</div>
		</section>
	);
}
