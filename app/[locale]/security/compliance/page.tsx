import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SecurityNav from "@/components/security/SecurityNav";
import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import ExternalLink from "@/components/ui/ExternalLink";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/socialMetadata";

type Props = { params: Promise<{ locale: string }> };
type ReferenceGroup = {
	id: string;
	title: string;
	items: { name: string; url: string; description: string }[];
};

export const dynamic = "force-static";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "compliancePage" });
	return buildPageMetadata({
		title: t("title"),
		description: t("lead"),
		slug: "security/compliance",
		locale,
	});
}

export default async function CompliancePage({ params }: Props) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "compliancePage" });
	const groups = t.raw("groups") as ReferenceGroup[];

	return (
		<div className="site-content-page page-security">
			<TopAnchor />
			<header className="hero-section">
				<Container>
					<h1>{t("title")}</h1>
					<p>{t("lead")}</p>
				</Container>
			</header>
			<main id="main-content" className="security-resources">
				<SecurityNav locale={locale} active="compliance" />
				<Container>
					{groups.map((group) => (
						<section key={group.id} className="resource-card" aria-labelledby={group.id}>
							<h2 id={group.id}>{group.title}</h2>
							<ul className="resource-list">
								{group.items.map((item) => (
									<li key={item.name}>
										<ExternalLink href={item.url}>{item.name}</ExternalLink>
										<p>{item.description}</p>
									</li>
								))}
							</ul>
						</section>
					))}
				</Container>
			</main>
		</div>
	);
}
