import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactHero from "@/components/ContactHero";
import LocaleSwitcher from "@/components/LocaleSwitcher";

const socials = [
	[
		"linkedin",
		"LinkedIn",
		"https://www.linkedin.com/in/nabla/",
		"fab fa-linkedin",
	],
	["twitter", "Twitter", "https://twitter.com/AlbanAndrieu", "fab fa-twitter"],
	["xing", "Xing", "https://www.xing.com/profile/Alban_Andrieu", "fab fa-xing"],
	["github", "GitHub", "https://github.com/AlbanAndrieu", "fab fa-github"],
	["docker", "Docker Hub", "https://hub.docker.com/u/nabla", "fab fa-docker"],
	[
		"stack",
		"Stack Exchange",
		"https://stackexchange.com/users/4652074/albanandrieu",
		"fab fa-stack-exchange",
	],
	[
		"facebook",
		"Facebook",
		"https://www.facebook.com/alban.andrieu",
		"fab fa-facebook",
	],
	[
		"instagram",
		"Instagram",
		"https://www.instagram.com/alban.andrieu/",
		"fab fa-instagram",
	],
	[
		"calendly",
		"Calendly",
		"https://calendly.com/alban-andrieu",
		"fas fa-calendar-check",
	],
	["slack", "Slack", "https://nabla-siege.slack.com/", "fab fa-slack"],
	[
		"discord",
		"Discord",
		"https://discord.com/channels/985573491606691840/985573491606691845",
		"fab fa-discord",
	],
	["rss", "RSS", "/feed.xml", "fas fa-rss"],
] as const;

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "contactPage" });
	return { title: t("meta.title"), description: t("meta.description") };
}

export default async function ContactPage({
	params,
}: PageProps<"/[locale]/contact">) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("contactPage");
	return (
		<main
			id="main-content"
			className="site-content-page page-contact page-dark"
		>
			<span id="top" />
			<LocaleSwitcher />
			<ContactHero
				contactCta={t("hero.contactCta")}
				contactHref="#contact-details"
				current={t("hero.current")}
				cvCta={t("hero.cvCta")}
				cvHref={`/${locale}/cv`}
				experience={t("hero.experience")}
				intro={t("intro")}
				role={t("role")}
			/>
			<section className="contact-section container" id="contact-details">
				<h2 className="section-title">{t("information.title")}</h2>
				<p className="section-subtitle">{t("information.subtitle")}</p>
				<div className="contact-methods">
					<a className="contact-method" href={`/${locale}/contact`}>
						<Image
							src="/assets/nabla/signature/qr_albanandrieu_contact_logo.png"
							width={120}
							height={120}
							alt={t("allInfoAlt")}
						/>
						<div className="contact-info">
							<h3>{t("allInfo")}</h3>
						</div>
					</a>
					<a
						className="contact-method"
						href="mailto:job@albandrieu.com?Subject=DevSecOps%20Inquiry"
					>
						<div className="contact-icon">
							<i className="fas fa-envelope" />
						</div>
						<div className="contact-info">
							<h3>{t("methods.email.title")}</h3>
							<p>{t("methods.email.value")}</p>
						</div>
					</a>
					<div className="contact-method">
						<div className="contact-icon">
							<i className="fas fa-phone" />
						</div>
						<div className="contact-info">
							<h3>{t("methods.phone.title")}</h3>
							<p>{t("methods.phone.value")}</p>
						</div>
					</div>
					<a
						className="contact-method"
						href="https://calendly.com/alban-andrieu"
						target="_blank"
						rel="noopener noreferrer"
					>
						<div className="contact-icon">
							<i className="fas fa-calendar-plus" />
						</div>
						<div className="contact-info">
							<h3>{t("methods.calendar.title")}</h3>
							<p>{t("methods.calendar.value")}</p>
						</div>
					</a>
				</div>
			</section>
			<section className="proof-section container">
				<h2 className="section-title">{t("cv.title")}</h2>
				<p>{t("cv.description")}</p>
				<div className="cv-page-links">
					<a className="btn btn-primary" href={`/${locale}/cv`}>
						{t("cv.cta")}
					</a>
					{["full", "medium", "small"].map((size) => (
						<a
							className="btn btn-outline-primary"
							href={`/cv/cv-${size}-${locale}.html`}
							target="_blank"
							key={size}
							rel="noopener"
						>
							{t(`cv.${size}`)}
						</a>
					))}
				</div>
				<a
					className="cv-page-qr"
					href="https://www.linkedin.com/in/nabla/"
					target="_blank"
					rel="noopener noreferrer"
				>
					<Image
						src="/assets/nabla/signature/qr-code-linkedin-nabla.jpg"
						width={120}
						height={120}
						alt={t("linkedinQrAlt")}
					/>
					<strong>LinkedIn</strong>
				</a>
			</section>
			<section className="contact-section container">
				<h2 className="section-title">{t("social.title")}</h2>
				<p className="section-subtitle">{t("social.subtitle")}</p>
				<div className="contact-methods">
					{socials.map(([key, name, href, icon]) => (
						<a
							className="contact-method"
							href={href}
							target={href.startsWith("http") ? "_blank" : undefined}
							rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
							key={key}
						>
							<div className="contact-icon">
								<i className={icon} />
							</div>
							<div className="contact-info">
								<h3>{name}</h3>
								<p>{t(`social.channels.${key}`)}</p>
							</div>
						</a>
					))}
				</div>
			</section>
			<section className="contact-section container">
				<article
					className="location-section"
					id="location"
					itemScope
					itemType="https://schema.org/PostalAddress"
				>
					<h2 className="section-title">{t("location.title")}</h2>
					<p className="location-address">
						<i className="fas fa-map-marker-alt" aria-hidden="true" />{" "}
						<span itemProp="streetAddress">{t("location.district")}</span> ·{" "}
						<span itemProp="postalCode">92800</span>{" "}
						<span itemProp="addressLocality">Puteaux</span> ·{" "}
						<span itemProp="addressRegion">Île-de-France</span>,{" "}
						<span itemProp="addressCountry">France</span>
					</p>
					<p>{t("location.description")}</p>
					<div className="map-container">
						<iframe
							title={t("location.mapTitle")}
							src="https://www.openstreetmap.org/export/embed.html?bbox=2.135%2C48.845%2C2.285%2C48.93&layer=mapnik&marker=48.8919%2C2.238"
							loading="lazy"
						/>
					</div>
					<p className="contact-map-caption">
						{t("location.caption")}{" "}
						<a
							href="https://www.openstreetmap.org/copyright"
							target="_blank"
							rel="noopener noreferrer"
						>
							OpenStreetMap
						</a>{" "}
						{t("location.contributors")}
					</p>
				</article>
				<article className="contact-open-source">
					<h2 className="section-title">{t("opensource.title")}</h2>
					<p className="section-subtitle">{t("opensource.description")}</p>
					<div className="cv-page-links">
						<a
							className="btn btn-primary btn-lg"
							href="https://github.com/AlbanAndrieu/nabla-site-alban"
							target="_blank"
							rel="noopener noreferrer"
						>
							<i className="fab fa-github" /> {t("opensource.site")}
						</a>
						<a
							className="btn btn-outline-primary"
							href="https://github.com/AlbanAndrieu"
							target="_blank"
							rel="noopener noreferrer"
						>
							<i className="fab fa-github" /> {t("opensource.all")}
						</a>
					</div>
					<div className="contact-github-badges">
						<iframe
							src="https://ghbtns.com/github-btn.html?user=AlbanAndrieu&repo=nabla-site-alban&type=watch&count=true"
							title={t("opensource.stars")}
							width="110"
							height="20"
						/>
						<iframe
							src="https://ghbtns.com/github-btn.html?user=AlbanAndrieu&repo=nabla-site-alban&type=fork&count=true"
							title={t("opensource.forks")}
							width="95"
							height="20"
						/>
						<iframe
							src="https://github.com/sponsors/AlbanAndrieu/button"
							title={t("opensource.sponsor")}
							width="114"
							height="32"
						/>
					</div>
					<a
						className="contact-stack-badge"
						href="https://stackexchange.com/users/4652074/albanandrieu"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Image
							src="https://stackexchange.com/users/flair/4652074.png"
							width={208}
							height={58}
							alt={t("opensource.stackAlt")}
							unoptimized
						/>
					</a>
				</article>
			</section>
		</main>
	);
}
