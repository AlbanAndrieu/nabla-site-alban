import { getTranslations } from "next-intl/server";
import Container from "@/components/ui/Container";
import ExternalLink from "@/components/ui/ExternalLink";
import type { AppLocale } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import styles from "./SecurityCoreSections.module.css";
import {
	RESOURCE_SECTIONS,
	type ResourceLinkIcon,
	type ResourceSectionDefinition,
} from "./securityResources";

type ResourceSectionCopy = {
	badge: string;
	title: string;
	description: string;
	links: string[];
};

function resourceLinkIconClass(icon: ResourceLinkIcon = "external") {
	switch (icon) {
		case "github":
			return "fa-brands fa-github";
		case "brain":
			return "fa-solid fa-brain";
		case "terminal":
			return "fa-solid fa-terminal";
		default:
			return "fa-solid fa-arrow-up-right-from-square";
	}
}

function ResourceSection({
	definition,
	copy,
	locale,
}: Readonly<{
	definition: ResourceSectionDefinition;
	copy: ResourceSectionCopy;
	locale: AppLocale;
}>) {
	const headingId = `${definition.id}-heading`;
	return (
		<section
			id={definition.id}
			className="resource-card"
			aria-labelledby={headingId}
		>
			<span className="category-badge">{copy.badge}</span>
			<div className="icon">
				<i className={definition.iconClass} aria-hidden="true" />
			</div>
			<h3 id={headingId}>{copy.title}</h3>
			<p>{copy.description}</p>
			<ul className="resource-list">
				{definition.links.map((link, index) => {
					const label = copy.links[index];
					const content = (
						<>
							<i className={resourceLinkIconClass(link.icon)} aria-hidden="true" />{" "}
							{label}
						</>
					);

					return (
						<li key={"href" in link ? link.href : `${link.page}#${link.hash}`}>
							{"href" in link ? (
								<ExternalLink href={link.href}>{content}</ExternalLink>
							) : (
								<a href={`${canonicalPagePath(link.page, locale)}#${link.hash}`}>
									{content}
								</a>
							)}
						</li>
					);
				})}
			</ul>
		</section>
	);
}

export async function SecurityHero({
	locale,
	contactHref,
}: Readonly<{ locale: AppLocale; contactHref: string }>) {
	const t = await getTranslations({ locale, namespace: "securityPage" });
	return (
		<header className="hero-section" id="hero">
			<Container>
				<h1>
					<i className="fa-solid fa-shield-halved" aria-hidden="true" />{" "}
					{t("title")}
				</h1>
				<p>{t("hero.lead")}</p>
				<p>
					{t("hero.curatedBy")}{" "}
					<a className={styles.heroLink} href={contactHref}>
						Alban Andrieu
					</a>
				</p>
				<p>
					<a className={styles.heroLink} href="#security-standards-compliance">
						{t("hero.standards")}
					</a>{" "}
					— {t("hero.standardsLead")}
				</p>
			</Container>
		</header>
	);
}

export default async function SecurityCoreSections({
	locale,
}: Readonly<{ locale: AppLocale }>) {
	const t = await getTranslations({ locale, namespace: "securityPage" });
	return (
		<Container>
			{RESOURCE_SECTIONS.map((definition) => (
				<ResourceSection
					definition={definition}
					copy={
						t.raw(
							`nativeSections.${definition.key}`,
						) as ResourceSectionCopy
					}
					locale={locale}
					key={definition.id}
				/>
			))}
		</Container>
	);
}
