import Script from "next/script";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React from "react";
import ThreatFeed from "@/components/ciso/ThreatFeed";

export default async function CTIDPage({
	params,
}: {
	params: { locale: "en" | "fr" };
}) {
	setRequestLocale(params.locale);
	const t = await getTranslations("ctid");
	return (
		<div className="site-content-page page-ctid page-dark">
			<div id="top" />
			<a href="#main-content" className="skip-to-main">
				{t("../../site.skipToMainContent")}
			</a>
			<nav className="page-nav container py-3" aria-label="Breadcrumb">
				<a href="/" className="text-decoration-none">
					<i className="fas fa-home" aria-hidden="true"></i>{" "}
					{t("../../site.backHome")}
				</a>
			</nav>
			<header>
				<h1>{t("title")}</h1>
				<div
					role="img"
					aria-label="Skull and shield emoji"
					style={{ fontSize: "2rem" }}
				>
					{t("hero")}
				</div>
				<p className="lead text-secondary mb-0">{t("subtitle")}</p>
			</header>
			<main id="main-content">
				<ThreatFeed locale={params.locale} />
			</main>
			<footer className="footer" role="contentinfo">
				<div className="social-links">
					<a
						href="https://www.linkedin.com/in/nabla"
						target="_blank"
						rel="noopener noreferrer"
						className="social-link"
						aria-label="LinkedIn"
					>
						<i className="fab fa-linkedin-in"></i>
					</a>
					<a
						href="https://calendly.com/alban-andrieu"
						target="_blank"
						rel="noopener noreferrer"
						className="social-link"
						aria-label="Calendly"
					>
						<i className="fa fa-calendar-plus"></i>
					</a>
					<a
						href="https://github.com/AlbanAndrieu"
						target="_blank"
						rel="noopener noreferrer"
						className="social-link"
						aria-label="GitHub"
					>
						<i className="fab fa-github"></i>
					</a>
					<a
						href="https://hub.docker.com/u/nabla"
						target="_blank"
						rel="noopener noreferrer"
						className="social-link"
						aria-label="Docker Hub"
					>
						<i className="fab fa-docker"></i>
					</a>
					<a
						href="https://stackexchange.com/users/4652074/albanandrieu"
						target="_blank"
						rel="noopener noreferrer"
						className="social-link"
						aria-label="Stack Exchange"
					>
						<i className="fab fa-stack-exchange"></i>
					</a>
				</div>
				<div className="footer-links">
					<a href="/policy/legal.html">{t("footer.legal")}</a>
					<a
						href="javascript:openAxeptioCookies()"
						rel="noopener noreferrer"
						className="text-muted"
					>
						{t("footer.cookies")}
					</a>
				</div>
				<p className="text-md-center mt-3">
					<a href="/" className="btn btn-sm btn-outline-secondary">
						{t("footer.backToHome")}
					</a>
					<a href="#top" className="btn btn-sm btn-outline-secondary">
						{t("footer.backToTop")}
					</a>
				</p>
				<p className="footer-copyright"></p>
			</footer>
			<Script src="/site-widgets.js" strategy="afterInteractive" />
		</div>
	);
}
