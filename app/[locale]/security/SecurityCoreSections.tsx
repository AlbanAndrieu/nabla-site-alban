import { getTranslations } from "next-intl/server";
import Container from "@/components/ui/Container";
import ExternalLink from "@/components/ui/ExternalLink";
import type { AppLocale } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import styles from "./SecurityCoreSections.module.css";

type ResourceLinkIcon = "external" | "github" | "brain" | "terminal";

type ResourceLink =
	| {
			href: string;
			icon?: ResourceLinkIcon;
	  }
	| {
			page: "ai";
			hash: string;
			icon: ResourceLinkIcon;
	  };

type NativeSectionKey = "owasp" | "personal" | "network" | "hardening" | "ssh";

type ResourceSectionDefinition = {
	key: NativeSectionKey;
	id: string;
	iconClass: string;
	links: readonly ResourceLink[];
};

type ResourceSectionCopy = {
	badge: string;
	title: string;
	description: string;
	links: string[];
};

const RESOURCE_SECTIONS: readonly ResourceSectionDefinition[] = [
	{
		key: "owasp",
		id: "owasp-resources",
		iconClass: "fa-solid fa-shield-halved",
		links: [
			{ href: "https://owasp.org/www-project-top-ten/" },
			{ href: "https://owasp.org/www-project-web-security-testing-guide/" },
			{
				href: "https://owasp.org/www-project-application-security-verification-standard/",
			},
			{ href: "https://owasp.org/www-community/vulnerabilities/" },
			{ href: "https://owasp.org/www-project-api-security/" },
			{ href: "https://owasp.org/www-project-mobile-top-10/" },
			{ href: "https://cheatsheetseries.owasp.org/" },
			{
				href: "https://pentest-testing-corp.medium.com/fix-security-misconfiguration-in-symfony-apps-be6ace002709",
			},
		],
	},
	{
		key: "personal",
		id: "personal-security-checklist",
		iconClass: "fa-solid fa-user-shield",
		links: [
			{
				href: "https://github.com/lissy93/personal-security-checklist",
				icon: "github",
			},
			{ href: "https://digital-defense.io/" },
			{ href: "https://www.privacytools.io/" },
		],
	},
	{
		key: "network",
		id: "network-security-scanning",
		iconClass: "fa-solid fa-network-wired",
		links: [
			{
				href: "https://www.it-connect.fr/tuto-scanopy-outil-creation-automatique-diagramme-reseau/",
			},
			{ href: "https://nmap.org/" },
			{ href: "https://www.wireshark.org/" },
			{
				href: "https://github.com/robertdavidgraham/masscan",
				icon: "github",
			},
			{ href: "https://www.openvas.org/" },
		],
	},
	{
		key: "hardening",
		id: "system-hardening-cis",
		iconClass: "fa-solid fa-server",
		links: [
			{
				href: "https://blog.stephane-robert.info/docs/securiser/durcissement/cis-benchmarks/",
			},
			{ href: "https://www.cisecurity.org/cis-benchmarks/" },
			{
				href: "https://blog.stephane-robert.info/docs/securiser/durcissement/",
			},
			{ href: "https://dev-sec.io/" },
			{ href: "https://www.open-scap.org/" },
			{ href: "https://cisofy.com/lynis/" },
			{
				href: "https://github.com/dev-sec/ansible-collection-hardening",
				icon: "github",
			},
			{
				href: "https://medium.com/@anshumaansingh10jan/comprehensive-vm-hardening-guide-using-openscap-and-ansible-88bd93186ddd",
			},
			{
				href: "https://medium.com/aardvark-infinity/program-title-automated-system-hardening-and-security-audit-script-1e00eb5a577c",
			},
		],
	},
	{
		key: "ssh",
		id: "ssh-security-hardening",
		iconClass: "fa-solid fa-terminal",
		links: [
			{
				href: "https://blog.stephane-robert.info/docs/securiser/durcissement/ssh/",
			},
			{ href: "https://www.ssh.com/academy/ssh/security" },
			{ href: "https://github.com/mozilla/ssh_scan", icon: "github" },
			{ href: "https://github.com/jtesta/ssh-audit", icon: "github" },
			{ href: "https://infosec.mozilla.org/guidelines/openssh" },
			{ page: "ai", hash: "nvidia-openshell", icon: "brain" },
			{ page: "ai", hash: "open-terminal", icon: "terminal" },
		],
	},
];

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
					{t("hero.curatedBy")} {" "}
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
