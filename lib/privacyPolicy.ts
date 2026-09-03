import type { AppLocale } from "@/i18n/routing";

export const PRIVACY_POLICY_EMAIL = "job@albandrieu.com";
export const PRIVACY_POLICY_LAST_UPDATED = "2026-09-03";

export type PrivacyPolicySection = Readonly<{
	heading: string;
	paragraphs?: readonly string[];
	bullets?: readonly string[];
}>;

export type PrivacyPolicyCopy = Readonly<{
	metadataTitle: string;
	metadataDescription: string;
	title: string;
	lastUpdatedLabel: string;
	sections: readonly PrivacyPolicySection[];
}>;

const PRIVACY_POLICY_COPY = {
	en: {
		metadataTitle: "Privacy Policy | Alban Andrieu",
		metadataDescription:
			"Privacy Policy for albanandrieu.com: how personal data is collected, used and protected under the GDPR and applicable French data-protection law.",
		title: "Privacy Policy",
		lastUpdatedLabel: "Last updated",
		sections: [
			{ heading: "1. Controller", paragraphs: ["The data controller is Nabla, located in the Paris area, France. Contact: {email}."] },
			{ heading: "2. Scope", paragraphs: ["This Privacy Policy explains how personal data is collected, used and protected when using this website or related services, in accordance with Regulation (EU) 2016/679 (GDPR) and applicable French data-protection law."] },
			{ heading: "3. Personal data collected", paragraphs: ["Depending on usage, the following categories of personal data may be processed:"], bullets: ["identification data such as name and email address;", "technical data such as IP address, browser, device and logs;", "usage data such as pages visited and interactions."] },
			{ heading: "4. Legal basis for processing", paragraphs: ["Processing relies on one or more legal grounds under Article 6 GDPR, depending on the purpose:"], bullets: ["consent;", "performance of a contract or steps requested before a contract;", "compliance with a legal obligation;", "legitimate interests where those interests are not overridden by applicable rights and freedoms."] },
			{ heading: "5. Purpose of processing", bullets: ["providing and operating the site and related services;", "responding to professional or commercial enquiries;", "security and fraud prevention;", "service improvement and usage analytics where lawfully enabled;", "legal and regulatory compliance."] },
			{ heading: "6. Data retention", paragraphs: ["Personal data is retained only for as long as needed for the relevant purpose or to meet applicable legal obligations. Retention periods may differ according to the data category and legal basis."] },
			{ heading: "7. Data recipients", paragraphs: ["Data may be shared only where relevant with:"], bullets: ["authorised persons;", "processors and hosting or technical providers acting under appropriate obligations;", "public authorities where disclosure is legally required."] },
			{ heading: "8. International transfers", paragraphs: ["Where personal data is transferred outside the European Economic Area, appropriate safeguards are applied where required, such as an adequacy decision, Standard Contractual Clauses or another transfer mechanism recognised by applicable law."] },
			{ heading: "9. Data subject rights", paragraphs: ["Depending on the circumstances, GDPR rights may include:", "Requests can be sent to {email}."], bullets: ["access, rectification and erasure;", "restriction of processing and objection;", "data portability;", "withdrawal of consent at any time where processing is based on consent."] },
			{ heading: "10. Cookies and analytics", paragraphs: ["This website may use cookies, browser storage and similar technologies. Where consent is legally required, non-essential technologies are enabled only with an appropriate legal basis. Details are provided in the Cookie Policy."] },
			{ heading: "11. Security", paragraphs: ["Appropriate technical and organisational measures are used to protect personal data against unauthorised access, accidental loss, alteration or disclosure, taking into account the nature of the processing and associated risks."] },
			{ heading: "12. Complaints", paragraphs: ["In France, a complaint may be lodged with the competent supervisory authority, the {cnil}. Depending on your situation, another competent European supervisory authority may also be available."] },
			{ heading: "13. Changes", paragraphs: ["This Privacy Policy may be updated periodically to reflect changes in the site, processing activities or applicable rules. The current version and revision date are published on this page."] },
		],
	},
	fr: {
		metadataTitle: "Politique de confidentialité | Alban Andrieu",
		metadataDescription:
			"Politique de confidentialité d’albanandrieu.com : collecte, utilisation et protection des données personnelles conformément au RGPD et au droit français applicable.",
		title: "Politique de confidentialité",
		lastUpdatedLabel: "Dernière mise à jour",
		sections: [
			{ heading: "1. Responsable du traitement", paragraphs: ["Le responsable du traitement est Nabla, situé dans la région parisienne, France. Contact : {email}."] },
			{ heading: "2. Champ d’application", paragraphs: ["La présente Politique de confidentialité explique comment les données personnelles sont collectées, utilisées et protégées lors de l’utilisation de ce site ou de services associés, conformément au règlement (UE) 2016/679 (RGPD) et au droit français applicable en matière de protection des données."] },
			{ heading: "3. Données personnelles collectées", paragraphs: ["Selon l’utilisation du site, les catégories suivantes de données personnelles peuvent être traitées :"], bullets: ["données d’identification telles que le nom et l’adresse électronique ;", "données techniques telles que l’adresse IP, le navigateur, l’appareil et les journaux ;", "données d’utilisation telles que les pages consultées et les interactions."] },
			{ heading: "4. Base juridique du traitement", paragraphs: ["Selon la finalité, le traitement repose sur un ou plusieurs fondements juridiques prévus à l’article 6 du RGPD :"], bullets: ["consentement ;", "exécution d’un contrat ou mesures précontractuelles demandées ;", "respect d’une obligation légale ;", "intérêts légitimes lorsqu’ils ne sont pas supplantés par les droits et libertés applicables."] },
			{ heading: "5. Finalités du traitement", bullets: ["fourniture et fonctionnement du site et des services associés ;", "réponse aux demandes professionnelles ou commerciales ;", "sécurité et prévention de la fraude ;", "amélioration du service et analyse de l’utilisation lorsqu’elles sont légalement activées ;", "respect des obligations légales et réglementaires."] },
			{ heading: "6. Conservation des données", paragraphs: ["Les données personnelles sont conservées uniquement pendant la durée nécessaire à la finalité concernée ou au respect des obligations légales applicables. Les durées peuvent varier selon la catégorie de données et la base juridique."] },
			{ heading: "7. Destinataires des données", paragraphs: ["Les données peuvent être communiquées, lorsque cela est pertinent, uniquement à :"], bullets: ["des personnes autorisées ;", "des sous-traitants, hébergeurs ou prestataires techniques soumis aux obligations appropriées ;", "des autorités publiques lorsqu’une divulgation est légalement requise."] },
			{ heading: "8. Transferts internationaux", paragraphs: ["Lorsque des données personnelles sont transférées hors de l’Espace économique européen, les garanties appropriées sont appliquées lorsque cela est requis, par exemple une décision d’adéquation, des clauses contractuelles types ou un autre mécanisme reconnu par le droit applicable."] },
			{ heading: "9. Droits des personnes concernées", paragraphs: ["Selon les circonstances, les droits prévus par le RGPD peuvent notamment comprendre :", "Les demandes peuvent être adressées à {email}."], bullets: ["accès, rectification et effacement ;", "limitation du traitement et opposition ;", "portabilité des données ;", "retrait du consentement à tout moment lorsque le traitement repose sur celui-ci."] },
			{ heading: "10. Cookies et mesure d’audience", paragraphs: ["Le site peut utiliser des cookies, du stockage navigateur et des technologies similaires. Lorsqu’un consentement est légalement requis, les technologies non essentielles ne sont activées qu’avec une base juridique appropriée. Les détails figurent dans la Politique relative aux cookies."] },
			{ heading: "11. Sécurité", paragraphs: ["Des mesures techniques et organisationnelles appropriées sont utilisées pour protéger les données personnelles contre l’accès non autorisé, la perte accidentelle, l’altération ou la divulgation, compte tenu de la nature du traitement et des risques associés."] },
			{ heading: "12. Réclamations", paragraphs: ["En France, une réclamation peut être introduite auprès de l’autorité de contrôle compétente, la {cnil}. Selon votre situation, une autre autorité européenne compétente peut également être saisie."] },
			{ heading: "13. Modifications", paragraphs: ["La présente Politique de confidentialité peut être mise à jour pour refléter les évolutions du site, des traitements ou des règles applicables. La version en vigueur et sa date de révision sont publiées sur cette page."] },
		],
	},
} as const satisfies Record<AppLocale, PrivacyPolicyCopy>;

export function getPrivacyPolicyCopy(locale: AppLocale) {
	return PRIVACY_POLICY_COPY[locale];
}
