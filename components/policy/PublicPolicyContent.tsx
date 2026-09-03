import { type AppLocale, routing } from "@/i18n/routing";
import {
	getPublicPolicyCopy,
	type PublicPolicyLinkLabels,
	type PublicPolicySlug,
} from "@/lib/publicPolicies";

const INLINE_TOKEN_PATTERN = /(\{privacy\}|\{home\}|\{wcag\}|\{defender\})/g;

function localizedPolicyPath(locale: AppLocale, path: string) {
	return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

function InlinePublicPolicyText({
	text,
	locale,
	links,
}: Readonly<{ text: string; locale: AppLocale; links: PublicPolicyLinkLabels }>) {
	return (
		<>
			{text.split(INLINE_TOKEN_PATTERN).map((part, index) => {
				if (part === "{privacy}") {
					return <a key={`privacy-${index}`} href={localizedPolicyPath(locale, "/policy/privacy_policy")}>{links.privacy}</a>;
				}
				if (part === "{home}") {
					return <a key={`home-${index}`} href={localizedPolicyPath(locale, "/")}>{links.home}</a>;
				}
				if (part === "{wcag}") {
					return <a key={`wcag-${index}`} href="https://www.w3.org/WAI/WCAG21/quickref/" rel="noopener noreferrer">{links.wcag}</a>;
				}
				if (part === "{defender}") {
					return <a key={`defender-${index}`} href="https://www.defenseurdesdroits.fr/" rel="noopener noreferrer">{links.defender}</a>;
				}
				return part;
			})}
		</>
	);
}

export default function PublicPolicyContent({
	locale,
	policy,
}: Readonly<{ locale: AppLocale; policy: PublicPolicySlug }>) {
	const copy = getPublicPolicyCopy(policy, locale);
	return (
		<>
			<h1>{copy.title}</h1>
			<p><strong>{copy.lastUpdatedLabel}:</strong> {copy.lastUpdated}</p>
			{copy.intro.map((paragraph) => <p key={paragraph}><InlinePublicPolicyText text={paragraph} locale={locale} links={copy.links} /></p>)}
			{copy.sections.map((section) => {
				const items = "items" in section ? section.items : undefined;
				return (
					<section key={section.heading}>
						<h2>{section.heading}</h2>
						{section.paragraphs?.map((paragraph) => <p key={paragraph}><InlinePublicPolicyText text={paragraph} locale={locale} links={copy.links} /></p>)}
						{items ? (
							<ul>
								{items.map((item) => {
									const label = "label" in item ? item.label : undefined;
									return (
										<li key={`${label ?? "item"}-${item.text}`}>
											{label ? <strong>{label}: </strong> : null}
											<InlinePublicPolicyText text={item.text} locale={locale} links={copy.links} />
										</li>
									);
								})}
							</ul>
						) : null}
					</section>
				);
			})}
			{copy.closing?.map((paragraph) => <p key={paragraph}><InlinePublicPolicyText text={paragraph} locale={locale} links={copy.links} /></p>)}
		</>
	);
}
