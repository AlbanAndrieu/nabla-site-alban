import { type AppLocale, routing } from "@/i18n/routing";
import {
	getLegalPolicyCopy,
	LEGAL_POLICY_EMAIL,
	type LegalPolicyLinkLabels,
	type LegalPolicySlug,
} from "@/lib/legalPolicies";

const INLINE_TOKEN_PATTERN =
	/(\{email\}|\{vercel\}|\{cnil\}|\{privacy\}|\{terms\}|\{home\}|\{ddg\})/g;

function localizedPath(locale: AppLocale, path: string) {
	return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

function InlineLegalText({
	text,
	locale,
	links,
}: Readonly<{
	text: string;
	locale: AppLocale;
	links: LegalPolicyLinkLabels;
}>) {
	return (
		<>
			{text.split(INLINE_TOKEN_PATTERN).map((part, index) => {
				if (part === "{email}") {
					return <a key={`email-${index}`} href={`mailto:${LEGAL_POLICY_EMAIL}`}>{LEGAL_POLICY_EMAIL}</a>;
				}
				if (part === "{vercel}") {
					return <a key={`vercel-${index}`} href="https://vercel.com/legal" rel="noopener noreferrer">vercel.com/legal</a>;
				}
				if (part === "{cnil}") {
					return <a key={`cnil-${index}`} href="https://www.cnil.fr/" rel="noopener noreferrer">CNIL</a>;
				}
				if (part === "{privacy}") {
					return <a key={`privacy-${index}`} href={localizedPath(locale, "/policy/privacy_policy")}>{links.privacy}</a>;
				}
				if (part === "{terms}") {
					return <a key={`terms-${index}`} href={localizedPath(locale, "/policy/service_terms")}>{links.terms}</a>;
				}
				if (part === "{home}") {
					return <a key={`home-${index}`} href={localizedPath(locale, "/")}>{links.home}</a>;
				}
				if (part === "{ddg}") {
					return (
						<a key={`ddg-${index}`} href="https://www.gesetze-im-internet.de/ddg/__5.html" rel="noopener noreferrer">
							§ 5 Digitale-Dienste-Gesetz (DDG)
						</a>
					);
				}
				return part;
			})}
		</>
	);
}

export default function LegalPolicyContent({
	locale,
	policy,
}: Readonly<{ locale: AppLocale; policy: LegalPolicySlug }>) {
	const copy = getLegalPolicyCopy(policy, locale);

	return (
		<>
			<h1>{copy.title}</h1>
			<p><strong>{copy.lastUpdatedLabel}:</strong> {copy.lastUpdated}</p>
			{copy.intro.map((paragraph) => (
				<p key={paragraph}><InlineLegalText text={paragraph} locale={locale} links={copy.links} /></p>
			))}
			{copy.sections.map((section) => (
				<section key={section.heading}>
					<h2>{section.heading}</h2>
					{section.paragraphs.map((paragraph) => (
						<p key={paragraph}><InlineLegalText text={paragraph} locale={locale} links={copy.links} /></p>
					))}
				</section>
			))}
		</>
	);
}
