import type { AppLocale } from "@/i18n/routing";

export const SERVICE_TERMS_EMAIL = "job@albandrieu.com";
export const SERVICE_TERMS_LAST_UPDATED = "2026-09-03";

export type ServiceTermsSection = Readonly<{
	heading: string;
	paragraphs?: readonly string[];
	bullets?: readonly string[];
}>;

export type ServiceTermsCopy = Readonly<{
	metadataTitle: string;
	metadataDescription: string;
	title: string;
	lastUpdatedLabel: string;
	sections: readonly ServiceTermsSection[];
}>;

const SERVICE_TERMS_COPY = {
	en: {
		metadataTitle: "Terms of Service | Alban Andrieu",
		metadataDescription:
			"Terms governing access to and use of albanandrieu.com, its professional content, tools and associated services.",
		title: "Terms of Service",
		lastUpdatedLabel: "Last updated",
		sections: [
			{ heading: "1. Legal notice", paragraphs: ["These Terms govern access to and use of albanandrieu.com and associated services provided in connection with Nabla professional activities in the Paris area, France. Contact: {email}."] },
			{ heading: "2. Scope", paragraphs: ["These Terms apply to access to or use of the website, its published content, tools and associated services. Using the site means you agree to comply with these Terms to the extent they are applicable to your use."] },
			{ heading: "3. Eligibility", paragraphs: ["Use of contractual services is limited to persons with legal capacity under applicable law. If you act for an organisation, you must have authority to bind or represent it where required."] },
			{ heading: "4. Services", paragraphs: ["The site provides professional information, technical resources, portfolio material and access to tools or services described on the relevant pages. Features may be modified, suspended or discontinued as the site evolves."] },
			{ heading: "5. User obligations", paragraphs: ["Users must:"], bullets: ["provide accurate and lawful information when submitting data;", "comply with applicable laws and regulations;", "avoid misuse, unauthorised access or interference with the site or connected services;", "respect intellectual-property and third-party rights."] },
			{ heading: "6. Prohibited use", paragraphs: ["Unlawful, fraudulent, abusive or security-harming use is prohibited."], bullets: ["attempting to bypass access controls or security mechanisms;", "automated access that violates published restrictions or applicable law;", "transmitting malicious code or intentionally disrupting services."] },
			{ heading: "7. Intellectual property", paragraphs: ["Original site content, software, branding and documentation are protected by applicable intellectual-property rules. No ownership right is transferred by access to the site; lawful quotation, open-source licences and other expressly granted rights remain unaffected."] },
			{ heading: "8. Availability", paragraphs: ["The site and associated services are provided on an “as is” and “as available” basis. Continuous or error-free availability is not guaranteed, particularly for experimental, homelab or third-party integrations."] },
			{ heading: "9. Liability", paragraphs: ["Liability is governed by applicable law. Nothing in these Terms excludes or limits liability where such exclusion or limitation is prohibited, including mandatory consumer-protection rights. Subject to those rules, responsibility for indirect or consequential losses may be limited where legally permitted."] },
			{ heading: "10. Third-party services", paragraphs: ["The site links to and may integrate third-party services. Their providers are responsible for their own terms, privacy practices, security and availability."] },
			{ heading: "11. Data protection", paragraphs: ["Personal data is processed in accordance with the Privacy Policy and applicable data-protection law, including the GDPR where applicable."] },
			{ heading: "12. Suspension and termination", paragraphs: ["Access to a service may be suspended or terminated in response to abuse, a security risk, breach of applicable terms or a legal obligation, without prejudice to mandatory rights and other remedies."] },
			{ heading: "13. Governing law", paragraphs: ["These Terms are governed by French law, without prejudice to mandatory provisions that may apply to you under EU law, consumer-protection law or other conflict-of-law rules."] },
			{ heading: "14. Jurisdiction", paragraphs: ["Disputes should first be addressed in good faith. Courts with jurisdiction under applicable procedural and consumer-protection rules remain competent; these Terms do not override mandatory statutory jurisdiction."] },
			{ heading: "15. Amendments", paragraphs: ["These Terms may be updated as the website, services or applicable rules change. The version and revision date published on this page identify the current Terms."] },
			{ heading: "16. Contact", paragraphs: ["Questions regarding these Terms may be sent to {email}."] },
		],
	},
	fr: {
		metadataTitle: "Conditions d’utilisation | Alban Andrieu",
		metadataDescription:
			"Conditions régissant l’accès et l’utilisation d’albanandrieu.com, de ses contenus professionnels, outils et services associés.",
		title: "Conditions d’utilisation",
		lastUpdatedLabel: "Dernière mise à jour",
		sections: [
			{ heading: "1. Mentions légales", paragraphs: ["Les présentes Conditions régissent l’accès à albanandrieu.com et aux services associés fournis dans le cadre des activités professionnelles Nabla, dans la région parisienne, France. Contact : {email}."] },
			{ heading: "2. Champ d’application", paragraphs: ["Les présentes Conditions s’appliquent à l’accès au site, à ses contenus publiés, outils et services associés. L’utilisation du site implique le respect de ces Conditions dans la mesure où elles s’appliquent à votre usage."] },
			{ heading: "3. Capacité", paragraphs: ["L’utilisation de services contractuels est réservée aux personnes disposant de la capacité juridique requise. Si vous agissez pour une organisation, vous devez disposer du pouvoir nécessaire pour la représenter lorsque cela est requis."] },
			{ heading: "4. Services", paragraphs: ["Le site fournit des informations professionnelles, des ressources techniques, des éléments de portfolio ainsi que l’accès aux outils ou services décrits sur les pages concernées. Les fonctionnalités peuvent évoluer, être suspendues ou interrompues."] },
			{ heading: "5. Obligations des utilisateurs", paragraphs: ["Les utilisateurs doivent :"], bullets: ["fournir des informations exactes et licites lorsqu’ils transmettent des données ;", "respecter les lois et réglementations applicables ;", "s’abstenir de tout usage abusif, accès non autorisé ou perturbation du site ou des services connectés ;", "respecter les droits de propriété intellectuelle et les droits des tiers."] },
			{ heading: "6. Usages interdits", paragraphs: ["Tout usage illicite, frauduleux, abusif ou portant atteinte à la sécurité est interdit."], bullets: ["tenter de contourner les contrôles d’accès ou mécanismes de sécurité ;", "effectuer un accès automatisé contraire aux restrictions publiées ou au droit applicable ;", "transmettre un code malveillant ou perturber intentionnellement les services."] },
			{ heading: "7. Propriété intellectuelle", paragraphs: ["Les contenus originaux du site, logiciels, éléments de marque et documentation sont protégés par les règles applicables de propriété intellectuelle. L’accès au site ne transfère aucun droit de propriété ; les citations licites, licences open source et autres droits expressément accordés demeurent applicables."] },
			{ heading: "8. Disponibilité", paragraphs: ["Le site et les services associés sont fournis « en l’état » et selon leur disponibilité. Une disponibilité continue ou exempte d’erreur n’est pas garantie, notamment pour les intégrations expérimentales, homelab ou tierces."] },
			{ heading: "9. Responsabilité", paragraphs: ["La responsabilité est régie par le droit applicable. Aucune disposition ne limite ou n’exclut une responsabilité lorsqu’une telle limitation est interdite, notamment au regard des droits impératifs des consommateurs. Sous réserve de ces règles, les dommages indirects ou consécutifs peuvent être limités lorsque la loi le permet."] },
			{ heading: "10. Services tiers", paragraphs: ["Le site renvoie vers des services tiers et peut les intégrer. Leurs fournisseurs restent responsables de leurs propres conditions, pratiques de confidentialité, sécurité et disponibilité."] },
			{ heading: "11. Protection des données", paragraphs: ["Les données personnelles sont traitées conformément à la Politique de confidentialité et au droit applicable en matière de protection des données, notamment au RGPD lorsqu’il s’applique."] },
			{ heading: "12. Suspension et résiliation", paragraphs: ["L’accès à un service peut être suspendu ou interrompu en cas d’abus, de risque de sécurité, de manquement aux conditions applicables ou d’obligation légale, sans préjudice des droits impératifs et autres recours."] },
			{ heading: "13. Droit applicable", paragraphs: ["Les présentes Conditions sont régies par le droit français, sans préjudice des dispositions impératives qui pourraient vous être applicables en vertu du droit de l’Union européenne, du droit de la consommation ou d’autres règles de conflit de lois."] },
			{ heading: "14. Juridiction", paragraphs: ["Les différends doivent d’abord faire l’objet d’une tentative de résolution de bonne foi. Les juridictions compétentes au titre des règles de procédure et de protection des consommateurs applicables restent compétentes ; les présentes Conditions ne dérogent pas à une compétence légale impérative."] },
			{ heading: "15. Modifications", paragraphs: ["Les présentes Conditions peuvent être mises à jour en fonction de l’évolution du site, des services ou des règles applicables. La version et la date de révision publiées sur cette page identifient les Conditions en vigueur."] },
			{ heading: "16. Contact", paragraphs: ["Toute question relative aux présentes Conditions peut être adressée à {email}."] },
		],
	},
} as const satisfies Record<AppLocale, ServiceTermsCopy>;

export function getServiceTermsCopy(locale: AppLocale) {
	return SERVICE_TERMS_COPY[locale];
}
