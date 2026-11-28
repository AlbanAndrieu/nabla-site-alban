import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SecurityNav from "@/components/security/SecurityNav";
import TopAnchor from "@/components/TopAnchor";
import ExternalLink from "@/components/ui/ExternalLink";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/socialMetadata";
import styles from "./page.module.css";

export const dynamic = "force-static";

const tools = [
	{
		id: "oasm",
		label: "OASM",
		href: "https://github.com/oasm-platform/open-asm",
	},
	{
		id: "prowler",
		label: "Prowler",
		href: "https://github.com/prowler-cloud/prowler",
	},
	{
		id: "cartography",
		label: "Cartography",
		href: "https://github.com/cartography-cncf/cartography",
	},
	{
		id: "nuclei",
		label: "Nuclei",
		href: "https://github.com/projectdiscovery/nuclei",
	},
	{ id: "nmap", label: "Nmap", href: "https://nmap.org/" },
	{
		id: "tls",
		label: "testssl.sh",
		href: "https://github.com/testssl/testssl.sh",
	},
	{
		id: "mail",
		label: "checkdmarc",
		href: "https://github.com/domainaware/checkdmarc",
	},
	{ id: "backstage", label: "Backstage", href: "https://backstage.io/" },
	{
		id: "defectdojo",
		label: "DefectDojo",
		href: "https://github.com/DefectDojo/django-DefectDojo",
	},
	{
		id: "fastapi",
		label: "FastAPI Sample",
		href: "https://github.com/AlbanAndrieu/fastapi-sample",
	},
] as const;

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/security/ctem">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "ctemPage" });
	return buildPageMetadata({
		title: t("title"),
		description: t("description"),
		slug: "security/ctem",
		locale,
	});
}

export default async function CtemPage({
	params,
}: PageProps<"/[locale]/security/ctem">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "ctemPage" });
	const steps = t.raw("steps") as string[];

	return (
		<>
			<TopAnchor />
			<main id="main-content" className="site-content-page page-ciso page-dark">
				<section
					className="hero-section ciso-hero"
					aria-labelledby="ctem-title"
				>
					<div className="hero-content">
						<h1 id="ctem-title" className="hero-title">
							{t("title")}
						</h1>
						<p className="hero-subtitle">{t("lead")}</p>
					</div>
				</section>
				<SecurityNav locale={locale} active="ctem" />
				<div className="ciso-content">
					<section
						className="ciso-card ciso-card--wide"
						aria-labelledby="ctem-evidence"
					>
						<h2 id="ctem-evidence">{t("evidenceTitle")}</h2>
						<p>{t("evidence")}</p>
					</section>
					<section
						className="ciso-card ciso-card--wide"
						aria-labelledby="ctem-cycle"
					>
						<h2 id="ctem-cycle">{t("cycleTitle")}</h2>
						<ol className={styles.cycle}>
							{steps.map((step, index) => (
								<li key={step}>
									<span aria-hidden="true" className={styles.step}>
										{index + 1}
									</span>
									<span>{step}</span>
								</li>
							))}
						</ol>
					</section>
					<section
						className="ciso-card ciso-card--wide"
						aria-labelledby="ctem-tools"
					>
						<h2 id="ctem-tools">{t("toolsTitle")}</h2>
						<div className={styles.grid}>
							{tools.map((tool) => (
								<article className={styles.tool} key={tool.id}>
									<h3>
										<ExternalLink href={tool.href}>{tool.label}</ExternalLink>
									</h3>
									<p>{t(`tools.${tool.id}`)}</p>
								</article>
							))}
						</div>
					</section>
					<section
						className="ciso-card ciso-card--wide"
						aria-labelledby="ctem-policy"
					>
						<h2 id="ctem-policy">{t("policyTitle")}</h2>
						<p>{t("policy")}</p>
					</section>
				</div>
			</main>
		</>
	);
}
