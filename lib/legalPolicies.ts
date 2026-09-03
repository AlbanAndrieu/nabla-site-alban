import type { AppLocale } from "@/i18n/routing";

export const LEGAL_POLICY_EMAIL = "job@albandrieu.com";
export const LEGAL_POLICY_LAST_UPDATED = "2026-09-03";

export type LegalPolicySlug = "legal" | "impressum";

export type LegalPolicyLinkLabels = Readonly<{
	privacy: string;
	terms: string;
	home: string;
}>;

type LegalPolicySection = Readonly<{
	heading: string;
	paragraphs: readonly string[];
}>;

type LegalPolicyCopy = Readonly<{
	metadataTitle: string;
	metadataDescription: string;
	title: string;
	lastUpdatedLabel: string;
	lastUpdated: string;
	intro: readonly string[];
	links: LegalPolicyLinkLabels;
	sections: readonly LegalPolicySection[];
}>;

const LEGAL_POLICY_COPY = {
	legal: {
		en: {
			metadataTitle: "Legal notices | Alban Andrieu",
			metadataDescription:
				"Legal notices for albanandrieu.com: publisher, hosting, privacy summary, intellectual property and contact information.",
			title: "Legal notices",
			lastUpdatedLabel: "Last updated",
			lastUpdated: LEGAL_POLICY_LAST_UPDATED,
			intro: [
				"This page identifies the parties responsible for albanandrieu.com and summarises how personal data and intellectual property are treated. It is intended to meet applicable transparency requirements, including French law no. 2004-575 of 21 June 2004 on confidence in the digital economy where applicable.",
			],
			links: { privacy: "Privacy Policy", terms: "Terms of Service", home: "homepage" },
			sections: [
				{
					heading: "Site publisher",
					paragraphs: [
						"The site albanandrieu.com is published in connection with professional activities operated under the name Nabla, in the Paris area, France.",
					],
				},
				{
					heading: "Publication director",
					paragraphs: ["Alban Andrieu."],
				},
				{
					heading: "Contact",
					paragraphs: [
						"Email: {email}. The same address may be used for commercial and professional enquiries.",
					],
				},
				{
					heading: "Hosting",
					paragraphs: [
						"The site is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, United States. Further legal and contact information is available at {vercel}.",
					],
				},
				{
					heading: "Privacy and personal data",
					paragraphs: [
						"If you send a message or use a form on this site, the contact details you provide may be used to respond to your request or for directly related follow-up unless another legal basis applies.",
						"Under the GDPR and similar rules, you may have rights of access, rectification, erasure, restriction, objection and portability. Requests can be sent to {email}. You may also lodge a complaint with a supervisory authority such as {cnil} in France.",
						"For full details, see the {privacy}.",
					],
				},
				{
					heading: "Use of the site and liability",
					paragraphs: [
						"Content is provided for general information. Third-party services remain responsible for their own content and availability. No guarantee is given that the site will be uninterrupted or error-free. The complete contractual terms are available in the {terms}.",
					],
				},
				{
					heading: "Intellectual property and trademarks",
					paragraphs: [
						"The site and its original text, graphics, logos and structure may not be reproduced or reused without prior written agreement except as allowed by law. Names, logos and trademarks mentioned on the site belong to their respective owners and are used for identification.",
					],
				},
			],
		},
		fr: {
			metadataTitle: "Mentions légales | Alban Andrieu",
			metadataDescription:
				"Mentions légales d’albanandrieu.com : éditeur, hébergement, confidentialité, propriété intellectuelle et contact.",
			title: "Mentions légales",
			lastUpdatedLabel: "Dernière mise à jour",
			lastUpdated: LEGAL_POLICY_LAST_UPDATED,
			intro: [
				"Cette page identifie les responsables d’albanandrieu.com et résume le traitement des données personnelles et de la propriété intellectuelle. Elle vise à satisfaire les obligations de transparence applicables, notamment celles issues de la loi française n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique lorsqu’elles s’appliquent.",
			],
			links: { privacy: "Politique de confidentialité", terms: "Conditions d’utilisation", home: "page d’accueil" },
			sections: [
				{
					heading: "Éditeur du site",
					paragraphs: [
						"Le site albanandrieu.com est publié dans le cadre d’activités professionnelles exercées sous le nom Nabla, dans la région parisienne, France.",
					],
				},
				{
					heading: "Directeur de la publication",
					paragraphs: ["Alban Andrieu."],
				},
				{
					heading: "Contact",
					paragraphs: [
						"Adresse électronique : {email}. Cette adresse peut également être utilisée pour les demandes commerciales et professionnelles.",
					],
				},
				{
					heading: "Hébergement",
					paragraphs: [
						"Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis. Les informations juridiques et de contact complémentaires sont disponibles sur {vercel}.",
					],
				},
				{
					heading: "Vie privée et données personnelles",
					paragraphs: [
						"Si vous envoyez un message ou utilisez un formulaire, les coordonnées fournies peuvent être utilisées pour répondre à votre demande ou assurer un suivi directement lié, sauf autre base juridique applicable.",
						"En vertu du RGPD et de règles similaires, vous pouvez disposer de droits d’accès, rectification, effacement, limitation, opposition et portabilité. Les demandes peuvent être adressées à {email}. Vous pouvez également saisir une autorité de contrôle telle que la {cnil} en France.",
						"Pour plus de détails, consultez la {privacy}.",
					],
				},
				{
					heading: "Utilisation du site et responsabilité",
					paragraphs: [
						"Le contenu est fourni à titre d’information générale. Les services tiers restent responsables de leur propre contenu et de leur disponibilité. Aucune garantie d’absence d’interruption ou d’erreur n’est donnée. Les conditions contractuelles complètes figurent dans les {terms}.",
					],
				},
				{
					heading: "Propriété intellectuelle et marques",
					paragraphs: [
						"Le site ainsi que ses textes, graphismes, logos et sa structure d’origine ne peuvent être reproduits ou réutilisés sans accord écrit préalable, sauf dans les cas autorisés par la loi. Les noms, logos et marques cités appartiennent à leurs propriétaires respectifs et sont utilisés à des fins d’identification.",
					],
				},
			],
		},
	},
	impressum: {
		en: {
			metadataTitle: "Impressum (Legal Notice) | Alban Andrieu",
			metadataDescription:
				"Impressum and publisher information for albanandrieu.com, including responsible party, contact and site purpose.",
			title: "Impressum (Legal Notice)",
			lastUpdatedLabel: "Last updated",
			lastUpdated: LEGAL_POLICY_LAST_UPDATED,
			intro: [
				"For Germany, {ddg} sets general information duties for certain digital services where its statutory scope applies. This page provides publisher and contact information for albanandrieu.com and also serves as an equivalent legal notice for visitors; it does not claim that one national regime applies universally to every visitor.",
			],
			links: { privacy: "Privacy Policy", terms: "Terms of Service", home: "homepage" },
			sections: [
				{
					heading: "Publisher and responsible for content",
					paragraphs: [
						"Nabla, Paris area, France. Publication director: Alban Andrieu. Contact: {email} or the contact options on the {home}.",
					],
				},
				{
					heading: "Purpose of the website",
					paragraphs: [
						"This site presents professional portfolio material, DevSecOps, cloud, security and AI expertise, technical projects, homelab architecture, consulting information and editorial resources.",
					],
				},
				{
					heading: "Liability and data protection",
					paragraphs: [
						"Content is provided to the best of our knowledge without a guarantee of completeness or continuous availability. External providers remain responsible for their services. See the {privacy} for data protection and the {terms} for use of the site.",
					],
				},
				{
					heading: "Copyright and intellectual property",
					paragraphs: [
						"Original texts, layout and materials are protected by applicable intellectual-property rules. Reuse beyond what the law permits may require prior permission.",
					],
				},
			],
		},
		fr: {
			metadataTitle: "Impressum (mentions légales) | Alban Andrieu",
			metadataDescription:
				"Impressum et informations sur l’éditeur d’albanandrieu.com : responsable, contact et objet du site.",
			title: "Impressum (mentions légales)",
			lastUpdatedLabel: "Dernière mise à jour",
			lastUpdated: LEGAL_POLICY_LAST_UPDATED,
			intro: [
				"En Allemagne, le {ddg} prévoit des obligations générales d’information pour certains services numériques lorsque son champ d’application légal est rempli. Cette page fournit les informations d’éditeur et de contact d’albanandrieu.com et sert également de notice légale équivalente pour les visiteurs ; elle ne prétend pas qu’un régime national unique s’applique universellement.",
			],
			links: { privacy: "Politique de confidentialité", terms: "Conditions d’utilisation", home: "page d’accueil" },
			sections: [
				{
					heading: "Éditeur et responsable du contenu",
					paragraphs: [
						"Nabla, région parisienne, France. Directeur de la publication : Alban Andrieu. Contact : {email} ou les moyens de contact proposés sur la {home}.",
					],
				},
				{
					heading: "Objet du site",
					paragraphs: [
						"Ce site présente un portfolio professionnel, une expertise DevSecOps, cloud, sécurité et IA, des projets techniques, l’architecture du homelab, des informations de conseil et des ressources éditoriales.",
					],
				},
				{
					heading: "Responsabilité et protection des données",
					paragraphs: [
						"Le contenu est fourni au mieux de nos connaissances sans garantie d’exhaustivité ni de disponibilité continue. Les prestataires externes restent responsables de leurs services. Consultez la {privacy} pour les données personnelles et les {terms} pour l’utilisation du site.",
					],
				},
				{
					heading: "Droit d’auteur et propriété intellectuelle",
					paragraphs: [
						"Les textes, la mise en page et les contenus originaux sont protégés par les règles applicables de propriété intellectuelle. Une réutilisation au-delà de ce que la loi autorise peut nécessiter une autorisation préalable.",
					],
				},
			],
		},
	},
} as const satisfies Record<LegalPolicySlug, Record<AppLocale, LegalPolicyCopy>>;

export function getLegalPolicyCopy(policy: LegalPolicySlug, locale: AppLocale) {
	return LEGAL_POLICY_COPY[policy][locale];
}
