import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import AnchoredHeading from "@/components/AnchoredHeading";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { type AppLocale, routing } from "@/i18n/routing";
import {
	getPolicyPage,
	POLICY_PAGE_SLUGS,
	type PolicyPageSlug,
} from "@/lib/policyPages";
import styles from "./page.module.css";

type IndexCopy = Readonly<{
	metadataTitle: string;
	metadataDescription: string;
	title: string;
	lead: string;
	labels: Record<PolicyPageSlug, Readonly<{ title: string; description: string }>>;
}>;

const COPY: Record<AppLocale, IndexCopy> = {
	en: {
		metadataTitle: "Policies and legal information | Alban Andrieu",
		metadataDescription:
			"Legal notices, privacy, cookies, service terms, accessibility and German publisher information for albanandrieu.com.",
		title: "Policies and legal information",
		lead: "The six documents below are the current native policy pages for albanandrieu.com. Legacy .html URLs permanently redirect to these canonical routes.",
		labels: {
			legal: { title: "Legal notices", description: "Publisher, hosting and general legal information." },
			privacy_policy: { title: "Privacy Policy", description: "Personal-data processing, GDPR rights, retention and recipients." },
			cookie_policy: { title: "Cookie Policy", description: "Browser storage, analytics, optional providers and preference controls." },
			service_terms: { title: "Terms of Service", description: "Rules governing use of the website and its public services." },
			accessibility_statement: { title: "Accessibility Statement", description: "Accessibility target, known limitations and contact options." },
			impressum: { title: "Impressum", description: "German publisher information and the applicable § 5 DDG framing." },
		},
	},
	fr: {
		metadataTitle: "Politiques et informations légales | Alban Andrieu",
		metadataDescription:
			"Mentions légales, confidentialité, cookies, conditions de service, accessibilité et Impressum d’albanandrieu.com.",
		title: "Politiques et informations légales",
		lead: "Les six documents ci-dessous sont les pages de politique natives actuelles d’albanandrieu.com. Les anciennes URL .html redirigent définitivement vers ces routes canoniques.",
		labels: {
			legal: { title: "Mentions légales", description: "Éditeur, hébergement et informations légales générales." },
			privacy_policy: { title: "Politique de confidentialité", description: "Traitements de données, droits RGPD, conservation et destinataires." },
			cookie_policy: { title: "Politique relative aux cookies", description: "Stockage navigateur, analytics, fournisseurs optionnels et préférences." },
			service_terms: { title: "Conditions de service", description: "Règles applicables à l’utilisation du site et de ses services publics." },
			accessibility_statement: { title: "Déclaration d’accessibilité", description: "Objectif d’accessibilité, limites connues et moyens de contact." },
			impressum: { title: "Impressum", description: "Informations éditeur pour l’Allemagne et cadre applicable du § 5 DDG." },
		},
	},
};

function localizedIndexPath(locale: AppLocale) {
	return locale === routing.defaultLocale ? "/policy" : `/${locale}/policy`;
}

function localizedPolicyPath(policy: PolicyPageSlug, locale: AppLocale) {
	const path = getPolicyPage(policy).canonicalPath;
	return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/policy">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const copy = COPY[locale];
	const canonical = localizedIndexPath(locale);
	const languages = Object.fromEntries(
		routing.locales.map((candidate) => [candidate, localizedIndexPath(candidate)]),
	);

	return {
		title: copy.metadataTitle,
		description: copy.metadataDescription,
		alternates: {
			canonical,
			languages: {
				...languages,
				"x-default": localizedIndexPath(routing.defaultLocale),
			},
		},
		openGraph: {
			type: "website",
			url: canonical,
			title: copy.metadataTitle,
			description: copy.metadataDescription,
			siteName: "Alban Andrieu",
		},
		twitter: {
			card: "summary",
			title: copy.metadataTitle,
			description: copy.metadataDescription,
		},
	};
}

export default async function PolicyIndexPage({ params }: PageProps<"/[locale]/policy">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const copy = COPY[locale];

	return (
		<>
			<TopAnchor />
			<SkipToMainContent />
			<main id="main-content" className={`site-content-page container py-5 ${styles.main}`} lang={locale}>
				<header className={styles.header}>
					<AnchoredHeading id="policy-index-title" className={styles.title}>
						{copy.title}
					</AnchoredHeading>
					<p className={styles.lead}>{copy.lead}</p>
				</header>
				<div className={styles.grid} aria-label={copy.title}>
					{POLICY_PAGE_SLUGS.map((policy) => {
						const item = copy.labels[policy];
						return (
							<article className={styles.card} key={policy}>
								<h2 className={styles.cardTitle}>
									<Link href={localizedPolicyPath(policy, locale)}>{item.title}</Link>
								</h2>
								<p>{item.description}</p>
								<code className={styles.slug}>{getPolicyPage(policy).canonicalPath}</code>
							</article>
						);
					})}
				</div>
			</main>
		</>
	);
}
