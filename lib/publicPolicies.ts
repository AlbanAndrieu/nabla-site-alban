import type { AppLocale } from "@/i18n/routing";

export const PUBLIC_POLICY_LAST_UPDATED = "2026-09-03";

export type PublicPolicySlug = "accessibility_statement" | "cookie_policy";

export type PublicPolicyLinkLabels = Readonly<{
	privacy: string;
	home: string;
	wcag: string;
	defender: string;
}>;

type PublicPolicyListItem = Readonly<{ label?: string; text: string }>;
type PublicPolicySection = Readonly<{
	heading: string;
	paragraphs?: readonly string[];
	items?: readonly PublicPolicyListItem[];
}>;

export type PublicPolicyCopy = Readonly<{
	metadataTitle: string;
	metadataDescription: string;
	title: string;
	lastUpdatedLabel: string;
	lastUpdated: string;
	intro: readonly string[];
	links: PublicPolicyLinkLabels;
	sections: readonly PublicPolicySection[];
	closing?: readonly string[];
}>;

const PUBLIC_POLICY_COPY = {
	cookie_policy: {
		en: {
			metadataTitle: "Cookie Policy | Alban Andrieu",
			metadataDescription:
				"Cookie and analytics policy for albanandrieu.com: browser storage, Vercel analytics, optional integrations and preference controls.",
			title: "Cookie Policy",
			lastUpdatedLabel: "Last updated",
			lastUpdated: PUBLIC_POLICY_LAST_UPDATED,
			intro: [
				"This policy explains how cookies, browser storage and similar technologies may be used on albanandrieu.com. For general personal-data processing, see the {privacy}.",
			],
			links: { privacy: "Privacy Policy", home: "homepage", wcag: "WCAG 2.1", defender: "Défenseur des droits" },
			sections: [
				{ heading: "1. What are cookies and similar technologies?", paragraphs: ["Cookies are small text files or similar browser/device storage mechanisms used by a site or third-party service. They can support essential operation, preferences, security, audience measurement or third-party integrations."] },
				{
					heading: "2. Technologies used on this site",
					paragraphs: ["The technologies actually loaded depend on the page and runtime configuration."],
					items: [
						{ label: "Strictly necessary", text: "technical storage may be used for security, routing, sessions or remembered preferences where applicable law permits this without consent." },
						{ label: "Default Next.js measurement", text: "the current Next.js runtime loads Vercel Web Analytics and Speed Insights by default through the shared site analytics loader." },
						{ label: "Optional analytics", text: "configuration can enable additional analytics or experimentation providers such as Ahrefs, Google Tag Manager/Google Analytics, VWO, PostHog, Heap, Datadog RUM or Mixpanel. Legacy pages may also load Google Translate or other third-party scripts." },
					],
				},
				{ heading: "3. Consent and changing your choices", paragraphs: ["Where applicable law requires consent, non-essential technologies should be enabled only after an appropriate choice has been collected. A consent banner or manager is not guaranteed to be available on every site surface. Browser settings can also be used to block or delete cookies and other site data.", "Blocking storage or third-party scripts may affect features such as remembered preferences, translation, analytics or embedded services."] },
				{ heading: "4. Retention", paragraphs: ["Retention depends on the technology and provider. Session storage generally expires with the session, while persistent storage remains until its configured expiry, deletion by the user or another applicable retention limit. Third-party providers may publish their own retention periods."] },
				{ heading: "5. Updates", paragraphs: ["This policy may be updated when the site runtime, analytics configuration, providers or applicable rules change. The revision date at the top identifies the current version."] },
			],
			closing: ["For questions or to exercise rights concerning personal data processed through these technologies, see the {privacy} and its contact details."],
		},
		fr: {
			metadataTitle: "Politique relative aux cookies | Alban Andrieu",
			metadataDescription:
				"Politique cookies et analytics d’albanandrieu.com : stockage navigateur, analytics Vercel, intégrations optionnelles et gestion des préférences.",
			title: "Politique relative aux cookies",
			lastUpdatedLabel: "Dernière mise à jour",
			lastUpdated: PUBLIC_POLICY_LAST_UPDATED,
			intro: ["Cette politique explique comment des cookies, du stockage navigateur et des technologies similaires peuvent être utilisés sur albanandrieu.com. Pour le traitement général des données personnelles, consultez la {privacy}."],
			links: { privacy: "Politique de confidentialité", home: "page d’accueil", wcag: "WCAG 2.1", defender: "Défenseur des droits" },
			sections: [
				{ heading: "1. Que sont les cookies et technologies similaires ?", paragraphs: ["Les cookies sont de petits fichiers texte ou mécanismes de stockage comparables utilisés dans le navigateur ou sur l’appareil par un site ou un service tiers. Ils peuvent contribuer au fonctionnement essentiel, aux préférences, à la sécurité, à la mesure d’audience ou à des intégrations tierces."] },
				{
					heading: "2. Technologies utilisées sur ce site",
					paragraphs: ["Les technologies effectivement chargées dépendent de la page et de la configuration du runtime."],
					items: [
						{ label: "Strictement nécessaires", text: "du stockage technique peut être utilisé pour la sécurité, le routage, les sessions ou la mémorisation de préférences lorsque le droit applicable le permet sans consentement." },
						{ label: "Mesure Next.js par défaut", text: "le runtime Next.js actuel charge par défaut Vercel Web Analytics et Speed Insights au moyen du chargeur analytics partagé du site." },
						{ label: "Analytics optionnels", text: "la configuration peut activer d’autres fournisseurs d’analytics ou d’expérimentation tels que Ahrefs, Google Tag Manager/Google Analytics, VWO, PostHog, Heap, Datadog RUM ou Mixpanel. Des pages legacy peuvent également charger Google Translate ou d’autres scripts tiers." },
					],
				},
				{ heading: "3. Consentement et modification des choix", paragraphs: ["Lorsque le droit applicable exige un consentement, les technologies non essentielles doivent être activées uniquement après la collecte d’un choix approprié. Un bandeau ou gestionnaire de consentement n’est pas garanti sur chaque surface du site. Les réglages du navigateur permettent également de bloquer ou supprimer les cookies et autres données de site.", "Le blocage du stockage ou de scripts tiers peut affecter certaines fonctions comme les préférences mémorisées, la traduction, les analytics ou des services intégrés."] },
				{ heading: "4. Conservation", paragraphs: ["La conservation dépend de la technologie et du fournisseur. Le stockage de session expire généralement avec la session, tandis que le stockage persistant demeure jusqu’à son expiration configurée, sa suppression par l’utilisateur ou une autre limite applicable. Les fournisseurs tiers peuvent publier leurs propres durées de conservation."] },
				{ heading: "5. Mises à jour", paragraphs: ["Cette politique peut être mise à jour lorsque le runtime, la configuration analytics, les fournisseurs ou les règles applicables évoluent. La date affichée en haut de page identifie la version en vigueur."] },
			],
			closing: ["Pour toute question ou pour exercer des droits concernant des données personnelles traitées par ces technologies, consultez la {privacy} et les coordonnées qui y figurent."],
		},
	},
	accessibility_statement: {
		en: {
			metadataTitle: "Accessibility Statement | Alban Andrieu",
			metadataDescription:
				"Accessibility statement for albanandrieu.com: WCAG 2.1 AA target, keyboard support, responsive content and feedback channels.",
			title: "Accessibility Statement",
			lastUpdatedLabel: "Last updated",
			lastUpdated: PUBLIC_POLICY_LAST_UPDATED,
			intro: ["We are committed to making albanandrieu.com accessible to as many people as possible, including people with disabilities. This statement describes the current target, measures and feedback path."],
			links: { privacy: "Privacy Policy", home: "homepage", wcag: "Web Content Accessibility Guidelines (WCAG) 2.1", defender: "Défenseur des droits" },
			sections: [
				{ heading: "1. Standards and commitment", paragraphs: ["We aim to conform to the {wcag} at Level AA where practicable."], items: [
					{ text: "sufficient colour contrast between text and background;" },
					{ text: "text resizing and responsive layouts that work on small screens;" },
					{ text: "keyboard navigation and visible focus;" },
					{ text: "meaningful alternative text and labels for controls;" },
					{ text: "clear headings and semantic landmarks;" },
					{ text: "light and dark theme support where provided." },
				] },
				{ heading: "2. Measures taken", paragraphs: ["The site uses semantic HTML, ARIA where native semantics are insufficient, responsive layouts and styles that respect user preferences such as reduced motion and theme. Automated and browser tests cover important accessibility contracts, while manual assistive-technology coverage is improved progressively."] },
				{ heading: "3. Known limitations", paragraphs: ["Some third-party widgets, external services, legacy pages, PDFs or other documents are not fully controlled by this site and may not meet the same accessibility level. Where practical, the site aims to replace, supplement or improve those surfaces during migration."] },
				{ heading: "4. Feedback and contact", paragraphs: ["If you encounter an accessibility barrier or have a suggestion, use the contact options on the {home}. We will review actionable reports and, where appropriate, fix the issue or provide an alternative."] },
				{ heading: "5. Enforcement and complaints", paragraphs: ["If you are not satisfied with the response, you may contact an appropriate authority. In France, information is available from the {defender}."] },
			],
			closing: ["This statement may be updated as the site migration and accessibility work continue."],
		},
		fr: {
			metadataTitle: "Déclaration d’accessibilité | Alban Andrieu",
			metadataDescription:
				"Déclaration d’accessibilité d’albanandrieu.com : objectif WCAG 2.1 AA, navigation clavier, responsive et canal de retour.",
			title: "Déclaration d’accessibilité",
			lastUpdatedLabel: "Dernière mise à jour",
			lastUpdated: PUBLIC_POLICY_LAST_UPDATED,
			intro: ["Nous nous engageons à rendre albanandrieu.com accessible au plus grand nombre, notamment aux personnes en situation de handicap. Cette déclaration décrit l’objectif actuel, les mesures mises en œuvre et le canal de retour."],
			links: { privacy: "Politique de confidentialité", home: "page d’accueil", wcag: "Web Content Accessibility Guidelines (WCAG) 2.1", defender: "Défenseur des droits" },
			sections: [
				{ heading: "1. Normes et engagement", paragraphs: ["Nous visons la conformité aux {wcag} au niveau AA lorsque cela est praticable."], items: [
					{ text: "contraste suffisant entre le texte et l’arrière-plan ;" },
					{ text: "redimensionnement du texte et mises en page responsives sur petits écrans ;" },
					{ text: "navigation au clavier et focus visible ;" },
					{ text: "textes alternatifs pertinents et libellés des contrôles ;" },
					{ text: "titres clairs et repères sémantiques ;" },
					{ text: "prise en charge des thèmes clair et sombre lorsque proposée." },
				] },
				{ heading: "2. Mesures mises en œuvre", paragraphs: ["Le site utilise du HTML sémantique, ARIA lorsque les sémantiques natives sont insuffisantes, des mises en page responsives et des styles respectant des préférences utilisateur telles que la réduction des animations et le thème. Des tests automatisés et navigateur couvrent des contrats importants d’accessibilité, tandis que la couverture manuelle par technologies d’assistance est améliorée progressivement."] },
				{ heading: "3. Limites connues", paragraphs: ["Certains widgets tiers, services externes, pages legacy, PDF ou autres documents ne sont pas entièrement contrôlés par ce site et peuvent ne pas atteindre le même niveau d’accessibilité. Lorsque cela est praticable, le site vise à remplacer, compléter ou améliorer ces surfaces au cours de la migration."] },
				{ heading: "4. Retour et contact", paragraphs: ["Si vous rencontrez un obstacle d’accessibilité ou avez une suggestion, utilisez les moyens de contact proposés sur la {home}. Les signalements exploitables seront examinés et, lorsque cela est approprié, le problème sera corrigé ou une alternative proposée."] },
				{ heading: "5. Recours", paragraphs: ["Si la réponse ne vous satisfait pas, vous pouvez contacter une autorité appropriée. En France, des informations sont disponibles auprès du {defender}."] },
			],
			closing: ["Cette déclaration peut être mise à jour au fur et à mesure de la migration du site et des travaux d’accessibilité."],
		},
	},
} as const satisfies Record<PublicPolicySlug, Record<AppLocale, PublicPolicyCopy>>;

export function getPublicPolicyCopy(policy: PublicPolicySlug, locale: AppLocale) {
	return PUBLIC_POLICY_COPY[policy][locale];
}
