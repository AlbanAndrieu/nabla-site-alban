type SecurityLocale = "en" | "fr";

type ResourceLink = {
	label: string;
	href: string;
	icon?: "external" | "github";
};

type ResourceSectionCopy = {
	id: string;
	badge: string;
	iconClass: string;
	title: string;
	description: string;
	links: ResourceLink[];
};

type SecurityCopy = {
	hero: {
		title: string;
		lead: string;
		curatedBy: string;
		standards: string;
		standardsLead: string;
	};
	sections: ResourceSectionCopy[];
};

const COPY: Record<SecurityLocale, SecurityCopy> = {
	en: {
		hero: {
			title: "Security Resources & Tools",
			lead: "Curated security references for DevSecOps, platform engineering and cloud operations.",
			curatedBy: "Curated by",
			standards: "Security Standards & Compliance",
			standardsLead: "NIST, ISO 27001, GDPR and compliance tooling.",
		},
		sections: [
			{
				id: "owasp-resources",
				badge: "Application Security",
				iconClass: "fa-solid fa-shield-halved",
				title: "OWASP — Open Worldwide Application Security Project",
				description:
					"Practical standards, testing guidance and reference material for building and assessing secure web, API and mobile applications.",
				links: [
					{ label: "OWASP Top 10", href: "https://owasp.org/www-project-top-ten/" },
					{ label: "OWASP Web Security Testing Guide (WSTG)", href: "https://owasp.org/www-project-web-security-testing-guide/" },
					{ label: "OWASP Application Security Verification Standard (ASVS)", href: "https://owasp.org/www-project-application-security-verification-standard/" },
					{ label: "OWASP vulnerability categories", href: "https://owasp.org/www-community/vulnerabilities/" },
					{ label: "OWASP API Security Top 10", href: "https://owasp.org/www-project-api-security/" },
					{ label: "OWASP Mobile Top 10", href: "https://owasp.org/www-project-mobile-top-10/" },
					{ label: "OWASP Cheat Sheet Series", href: "https://cheatsheetseries.owasp.org/" },
					{ label: "Security misconfiguration in Symfony applications", href: "https://pentest-testing-corp.medium.com/fix-security-misconfiguration-in-symfony-apps-be6ace002709" },
				],
			},
			{
				id: "personal-security-checklist",
				badge: "Personal Security",
				iconClass: "fa-solid fa-user-shield",
				title: "Personal Security Checklist",
				description:
					"Practical references for strengthening personal digital security, privacy, account hygiene and device protection.",
				links: [
					{ label: "Personal Security Checklist by Lissy93", href: "https://github.com/lissy93/personal-security-checklist", icon: "github" },
					{ label: "Digital Defense — interactive security guide", href: "https://digital-defense.io/" },
					{ label: "PrivacyTools.io", href: "https://www.privacytools.io/" },
				],
			},
			{
				id: "network-security-scanning",
				badge: "Network Security",
				iconClass: "fa-solid fa-network-wired",
				title: "Network Security & Scanning Tools",
				description:
					"Tools and references for network discovery, packet analysis, vulnerability assessment and infrastructure mapping.",
				links: [
					{ label: "Scanopy — automatic network diagram generation", href: "https://www.it-connect.fr/tuto-scanopy-outil-creation-automatique-diagramme-reseau/" },
					{ label: "Nmap — network mapper and security auditing", href: "https://nmap.org/" },
					{ label: "Wireshark — network protocol analyzer", href: "https://www.wireshark.org/" },
					{ label: "Masscan — high-speed TCP port scanner", href: "https://github.com/robertdavidgraham/masscan", icon: "github" },
					{ label: "Greenbone / OpenVAS — vulnerability assessment", href: "https://www.openvas.org/" },
				],
			},
		],
	},
	fr: {
		hero: {
			title: "Ressources et outils de sécurité",
			lead: "Une sélection de références pour le DevSecOps, l’ingénierie plateforme et les opérations cloud.",
			curatedBy: "Sélection maintenue par",
			standards: "Standards de sécurité et conformité",
			standardsLead: "NIST, ISO 27001, RGPD et outillage de conformité.",
		},
		sections: [
			{
				id: "owasp-resources",
				badge: "Sécurité applicative",
				iconClass: "fa-solid fa-shield-halved",
				title: "OWASP — Open Worldwide Application Security Project",
				description:
					"Standards, guides de test et références pratiques pour concevoir et évaluer la sécurité des applications web, API et mobiles.",
				links: [
					{ label: "OWASP Top 10", href: "https://owasp.org/www-project-top-ten/" },
					{ label: "Guide de test de sécurité web OWASP (WSTG)", href: "https://owasp.org/www-project-web-security-testing-guide/" },
					{ label: "OWASP Application Security Verification Standard (ASVS)", href: "https://owasp.org/www-project-application-security-verification-standard/" },
					{ label: "Catégories de vulnérabilités OWASP", href: "https://owasp.org/www-community/vulnerabilities/" },
					{ label: "OWASP API Security Top 10", href: "https://owasp.org/www-project-api-security/" },
					{ label: "OWASP Mobile Top 10", href: "https://owasp.org/www-project-mobile-top-10/" },
					{ label: "OWASP Cheat Sheet Series", href: "https://cheatsheetseries.owasp.org/" },
					{ label: "Mauvaises configurations de sécurité dans les applications Symfony", href: "https://pentest-testing-corp.medium.com/fix-security-misconfiguration-in-symfony-apps-be6ace002709" },
				],
			},
			{
				id: "personal-security-checklist",
				badge: "Sécurité personnelle",
				iconClass: "fa-solid fa-user-shield",
				title: "Checklist de sécurité personnelle",
				description:
					"Références pratiques pour renforcer la sécurité numérique, la confidentialité, l’hygiène des comptes et la protection des terminaux.",
				links: [
					{ label: "Personal Security Checklist par Lissy93", href: "https://github.com/lissy93/personal-security-checklist", icon: "github" },
					{ label: "Digital Defense — guide interactif de sécurité", href: "https://digital-defense.io/" },
					{ label: "PrivacyTools.io", href: "https://www.privacytools.io/" },
				],
			},
			{
				id: "network-security-scanning",
				badge: "Sécurité réseau",
				iconClass: "fa-solid fa-network-wired",
				title: "Outils de sécurité et d’analyse réseau",
				description:
					"Outils et références pour la découverte réseau, l’analyse de paquets, l’évaluation des vulnérabilités et la cartographie d’infrastructure.",
				links: [
					{ label: "Scanopy — génération automatique de diagrammes réseau", href: "https://www.it-connect.fr/tuto-scanopy-outil-creation-automatique-diagramme-reseau/" },
					{ label: "Nmap — cartographie réseau et audit de sécurité", href: "https://nmap.org/" },
					{ label: "Wireshark — analyseur de protocoles réseau", href: "https://www.wireshark.org/" },
					{ label: "Masscan — scanner de ports TCP haute vitesse", href: "https://github.com/robertdavidgraham/masscan", icon: "github" },
					{ label: "Greenbone / OpenVAS — évaluation des vulnérabilités", href: "https://www.openvas.org/" },
				],
			},
		],
	},
};

function ResourceSection({ section }: Readonly<{ section: ResourceSectionCopy }>) {
	const headingId = `${section.id}-heading`;
	return (
		<section id={section.id} className="resource-card" aria-labelledby={headingId}>
			<span className="category-badge">{section.badge}</span>
			<div className="icon">
				<i className={section.iconClass} aria-hidden="true" />
			</div>
			<h3 id={headingId}>{section.title}</h3>
			<p>{section.description}</p>
			<ul className="resource-list">
				{section.links.map((link) => (
					<li key={link.href}>
						<a href={link.href} target="_blank" rel="noopener noreferrer">
							<i
								className={link.icon === "github" ? "fa-brands fa-github" : "fa-solid fa-arrow-up-right-from-square"}
								aria-hidden="true"
							/>{" "}
							{link.label}
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}

export default function SecurityCoreSections({
	locale,
	contactHref,
}: Readonly<{ locale: SecurityLocale; contactHref: string }>) {
	const copy = COPY[locale];

	return (
		<>
			<header className="hero-section" id="hero">
				<div className="container">
					<h1>
						<i className="fa-solid fa-shield-halved" aria-hidden="true" /> {copy.hero.title}
					</h1>
					<p>{copy.hero.lead}</p>
					<p>
						{copy.hero.curatedBy} <a href={contactHref}>Alban Andrieu</a>
					</p>
					<p>
						<a href="#security-standards-compliance">{copy.hero.standards}</a> — {copy.hero.standardsLead}
					</p>
				</div>
			</header>
			<div className="container">
				{copy.sections.map((section) => (
					<ResourceSection section={section} key={section.id} />
				))}
			</div>
		</>
	);
}
