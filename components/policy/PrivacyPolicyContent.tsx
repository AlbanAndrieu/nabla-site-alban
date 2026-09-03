import type { AppLocale } from "@/i18n/routing";
import {
	getPrivacyPolicyCopy,
	PRIVACY_POLICY_EMAIL,
	PRIVACY_POLICY_LAST_UPDATED,
} from "@/lib/privacyPolicy";

function InlinePrivacyText({ text }: Readonly<{ text: string }>) {
	return (
		<>
			{text.split(/(\{email\}|\{cnil\})/g).map((part, index) => {
				if (part === "{email}") {
					return <a key={`email-${index}`} href={`mailto:${PRIVACY_POLICY_EMAIL}`}>{PRIVACY_POLICY_EMAIL}</a>;
				}
				if (part === "{cnil}") {
					return <a key={`cnil-${index}`} href="https://www.cnil.fr/" rel="noopener noreferrer">CNIL</a>;
				}
				return part;
			})}
		</>
	);
}

export default function PrivacyPolicyContent({ locale }: Readonly<{ locale: AppLocale }>) {
	const copy = getPrivacyPolicyCopy(locale);
	return (
		<>
			<h1>{copy.title}</h1>
			<p><strong>{copy.lastUpdatedLabel}:</strong> {PRIVACY_POLICY_LAST_UPDATED}</p>
			{copy.sections.map((section) => (
				<section key={section.heading}>
					<h2>{section.heading}</h2>
					{section.paragraphs?.map((paragraph) => <p key={paragraph}><InlinePrivacyText text={paragraph} /></p>)}
					{section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
				</section>
			))}
		</>
	);
}
