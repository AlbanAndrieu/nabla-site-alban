import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactHero from "@/components/ContactHero";
import ActionLink from "@/components/ui/ActionLink";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";

type Link = { href: string; label: string; flag?: string; download?: boolean };

const latex: Array<{ key: "basic" | "quick"; links: Link[] }> = [
	{
		key: "basic",
		links: [
			{
				href: "/cv/cv-aandrieu-2026-en.pdf",
				label: "PDF",
				flag: "🇬🇧",
				download: true,
			},
			{
				href: "/cv/cv-aandrieu-2026-fr.pdf",
				label: "PDF",
				flag: "🇫🇷",
				download: true,
			},
			{
				href: "/cv/cv-aandrieu-2026-de.pdf",
				label: "PDF",
				flag: "🇩🇪",
				download: true,
			},
			{
				href: "/cv/cv-aandrieu-2026-no.pdf",
				label: "PDF",
				flag: "🇳🇴",
				download: true,
			},
		],
	},
	{
		key: "quick",
		links: [
			{
				href: "/cv/cv-aandrieu-2026-ts-en.pdf",
				label: "PDF",
				flag: "🇬🇧",
				download: true,
			},
			{
				href: "/cv/cv-aandrieu-2026-ts-fr.pdf",
				label: "PDF",
				flag: "🇫🇷",
				download: true,
			},
			{
				href: "/cv/cv-aandrieu-2026-ts-de.pdf",
				label: "PDF",
				flag: "🇩🇪",
				download: true,
			},
			{
				href: "/cv/cv-aandrieu-2026-ts-no.pdf",
				label: "PDF",
				flag: "🇳🇴",
				download: true,
			},
		],
	},
];

const htmlResumes = ["small", "medium", "large", "full"].map((size) => ({
	size,
	links: [
		["en", "🇬🇧"],
		["fr", "🇫🇷"],
		["de", "🇩🇪"],
		["no", "🇳🇴"],
	].map(([language, flag]) => ({
		href: `/cv/cv-${size}-${language}.html`,
		label: language.toUpperCase(),
		flag,
	})),
}));

const reactive = [
	{
		key: "medium",
		links: [
			{
				href: "https://reactive.albandrieu.com/nabla/cv-aandrieu-2026-03-29-en",
				label: "5 pages · ATS 81",
				flag: "🇬🇧",
			},
			{
				href: "https://reactive.albandrieu.com/nabla/cv-aandrieu-2026-03-29-fr",
				label: "5 pages · ATS 78",
				flag: "🇫🇷",
			},
		],
	},
	{
		key: "large",
		links: [
			{
				href: "https://reactive.albandrieu.com/nabla/cv-large-en-rx",
				label: "EN",
				flag: "🇬🇧",
			},
			{
				href: "https://reactive.albandrieu.com/nabla/cv-large-fr-rx",
				label: "FR",
				flag: "🇫🇷",
			},
		],
	},
	{
		key: "full",
		links: [
			{
				href: "https://reactive.albandrieu.com/nabla/cv-full-en-rx",
				label: "EN",
				flag: "🇬🇧",
			},
			{
				href: "https://reactive.albandrieu.com/nabla/cv-full-fr-rx",
				label: "FR",
				flag: "🇫🇷",
			},
		],
	},
] as const;

function Links({ links }: { links: Link[] | readonly Link[] }) {
	return (
		<div className="cv-page-links">
			{links.map((link) => (
				<ActionLink
					download={link.download || undefined}
					href={link.href}
					key={link.href}
					rel="noopener noreferrer"
					size="compact"
					target="_blank"
					variant="outline"
				>
					{link.flag && <span aria-hidden="true">{link.flag} </span>}
					{link.label}
				</ActionLink>
			))}
		</div>
	);
}

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/cv">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "cvPage" });
	return {
		title: t("meta.title"),
		description: t("meta.description"),
		alternates: {
			canonical: canonicalPagePath("cv", locale),
			languages: {
				en: canonicalPagePath("cv", "en"),
				fr: canonicalPagePath("cv", "fr"),
			},
		},
	};
}

export default async function CvPage({ params }: PageProps<"/[locale]/cv">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const [t, contact] = await Promise.all([
		getTranslations("cvPage"),
		getTranslations("contactPage"),
	]);
	return (
		<main id="main-content" className="site-content-page page-cv page-dark">
			<ContactHero
				contactCta={contact("hero.contactCta")}
				contactHref={canonicalPagePath("contact", locale)}
				cvCta={contact("hero.cvCta")}
				cvHref="#cv-formats"
				experience={contact("hero.experience")}
				intro={contact("intro")}
				profileAlt={contact("hero.profileAlt")}
				role={contact("role")}
			/>

			<section
				className="services-section container cv-page-section"
				id="cv-formats"
			>
				<h2 className="section-title">{t("contact.title")}</h2>
				<a
					className="cv-page-qr cv-contact-qr"
					href={canonicalPagePath("contact", locale)}
					aria-label={t("contact.cta")}
				>
					<Image
						src="/assets/nabla/signature/qr_albanandrieu_contact_logo.png"
						width={140}
						height={140}
						alt={t("contact.qrAlt")}
					/>
				</a>
			</section>

			<section className="services-section container cv-page-section">
				<h2 className="section-title">{t("latex.title")}</h2>
				<p className="section-subtitle">{t("latex.description")}</p>
				<div className="services-grid">
					{latex.map((group) => (
						<article className="service-card" key={group.key}>
							<h3>{t(`latex.${group.key}`)}</h3>
							<Links links={group.links} />
						</article>
					))}
				</div>
				<p>
					{t("latex.export")}{" "}
					<a
						href="https://pandoc.org/app/"
						target="_blank"
						rel="noopener noreferrer"
					>
						Pandoc
					</a>
					.
				</p>
			</section>

			<section className="services-section container cv-page-section">
				<h2 className="section-title">{t("professional.title")}</h2>
				<div className="services-grid">
					<article className="service-card">
						<h3>LinkedIn & Malt</h3>
						<p>{t("professional.network")}</p>
						<div className="cv-page-qr-grid">
							<a
								className="cv-page-qr"
								href="https://www.linkedin.com/in/nabla/"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/assets/nabla/signature/qr_linkedin_nabla.png"
									width={445}
									height={440}
									alt={t("professional.linkedinAlt")}
									style={{ width: 140, height: "auto" }}
								/>
								<strong>LinkedIn</strong>
							</a>
							<a
								className="cv-page-qr"
								href="https://www.malt.fr/profile/albanandrieu"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/assets/nabla/signature/qr-code-malt-nabla.jpg"
									width={996}
									height={1507}
									alt={t("professional.maltAlt")}
									style={{ width: 140, height: "auto" }}
								/>
								<strong>Malt</strong>
							</a>
						</div>
					</article>
					<article className="service-card">
						<h3>CVDesignR</h3>
						<p>{t("professional.cvdesignr")}</p>
						<Links
							links={[
								{
									href: "https://cvdesignr.com/p/6a3cf2867786d",
									label: "ATS 89",
									flag: "🇬🇧",
								},
								{
									href: "https://cvdesignr.com/p/0laOMlPNen9byM8",
									label: "ATS 89",
									flag: "🇫🇷",
								},
							]}
						/>
						<p>
							{t("professional.atsTest")}{" "}
							<a
								href="https://fixmycv.fr/"
								target="_blank"
								rel="noopener noreferrer"
							>
								FixMyCV
							</a>
							.
						</p>
					</article>
					<article className="service-card">
						<h3>
							<a
								href="https://reactive.albandrieu.com/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Reactive Resume
							</a>
						</h3>
						<p>{t("professional.reactive")}</p>
						{reactive.map((group) => (
							<div className="cv-page-format-row" key={group.key}>
								<strong>{t(`sizes.${group.key}`)}</strong>
								<Links links={group.links} />
							</div>
						))}
					</article>
				</div>
			</section>

			<section className="services-section container cv-page-section">
				<h2 className="section-title">{t("html.title")}</h2>
				<p className="section-subtitle">{t("html.description")}</p>
				<div className="services-grid">
					{htmlResumes.map((group) => (
						<article className="service-card" key={group.size}>
							<h3>{t(`sizes.${group.size}`)}</h3>
							<Links links={group.links} />
						</article>
					))}
				</div>
			</section>

			<section className="services-section container cv-page-section">
				<h2 className="section-title">{t("archive.title")}</h2>
				<div className="services-grid">
					<article className="service-card">
						<h3>LinkedIn PDF</h3>
						<p>{t("archive.linkedin")}</p>
						<Links
							links={[
								{
									href: "/cv/linkedin/cv-aandrieu-linkedin-2026-01-01-en.pdf",
									label: "PDF",
									flag: "🇬🇧",
									download: true,
								},
							]}
						/>
					</article>
					<article className="service-card">
						<h3>FlowCV</h3>
						<p>{t("archive.flowcv")}</p>
						<Links
							links={[
								{
									href: "https://flowcv.com/resume/cojup4q8oq92/",
									label: t("viewOnline"),
								},
							]}
						/>
					</article>
				</div>
			</section>

			<section className="proof-section container">
				<h2 className="section-title">{t("about.title")}</h2>
				<p>{t("about.description")}</p>
			</section>
		</main>
	);
}
