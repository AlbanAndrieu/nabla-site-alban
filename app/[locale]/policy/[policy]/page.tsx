import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import LegalPolicyContent from "@/components/policy/LegalPolicyContent";
import PrivacyPolicyContent from "@/components/policy/PrivacyPolicyContent";
import PublicPolicyContent from "@/components/policy/PublicPolicyContent";
import ServiceTermsContent from "@/components/policy/ServiceTermsContent";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { type AppLocale, routing } from "@/i18n/routing";
import { getLegalPolicyCopy } from "@/lib/legalPolicies";
import {
	getPolicyPage,
	isPolicyPageSlug,
	POLICY_PAGE_SLUGS,
	type PolicyPageSlug,
} from "@/lib/policyPages";
import { getPrivacyPolicyCopy } from "@/lib/privacyPolicy";
import { getPublicPolicyCopy } from "@/lib/publicPolicies";
import { getServiceTermsCopy } from "@/lib/serviceTerms";

export const dynamicParams = false;

export function generateStaticParams() {
	return routing.locales.flatMap((locale) =>
		POLICY_PAGE_SLUGS.map((policy) => ({ locale, policy })),
	);
}

function localizedPolicyPath(policy: PolicyPageSlug, locale: AppLocale) {
	const basePath = getPolicyPage(policy).canonicalPath;
	return locale === routing.defaultLocale ? basePath : `/${locale}${basePath}`;
}

function localizedPolicyAlternates(policy: PolicyPageSlug) {
	return Object.fromEntries(
		routing.locales.map((locale) => [locale, localizedPolicyPath(policy, locale)]),
	);
}

function getNativePolicyCopy(policy: PolicyPageSlug, locale: AppLocale) {
	if (policy === "privacy_policy") return getPrivacyPolicyCopy(locale);
	if (policy === "service_terms") return getServiceTermsCopy(locale);
	if (policy === "legal" || policy === "impressum") return getLegalPolicyCopy(policy, locale);
	return getPublicPolicyCopy(policy, locale);
}

function NativePolicyContent({
	policy,
	locale,
}: Readonly<{ policy: PolicyPageSlug; locale: AppLocale }>) {
	if (policy === "privacy_policy") return <PrivacyPolicyContent locale={locale} />;
	if (policy === "service_terms") return <ServiceTermsContent locale={locale} />;
	if (policy === "legal" || policy === "impressum") {
		return <LegalPolicyContent locale={locale} policy={policy} />;
	}
	return <PublicPolicyContent locale={locale} policy={policy} />;
}

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/policy/[policy]">): Promise<Metadata> {
	const { locale, policy } = await params;
	if (!hasLocale(routing.locales, locale) || !isPolicyPageSlug(policy)) return {};

	const page = getPolicyPage(policy);
	const copy = getNativePolicyCopy(policy, locale);
	const canonical = localizedPolicyPath(policy, locale);

	return {
		title: copy.metadataTitle,
		description: copy.metadataDescription,
		alternates: {
			canonical,
			languages: {
				...localizedPolicyAlternates(policy),
				"x-default": localizedPolicyPath(policy, routing.defaultLocale),
			},
		},
		openGraph: {
			type: "website",
			url: canonical,
			title: copy.metadataTitle,
			description: copy.metadataDescription,
			siteName: page.siteName,
		},
		twitter: {
			card: "summary",
			title: copy.metadataTitle,
			description: copy.metadataDescription,
		},
	};
}

export default async function PolicyPage({
	params,
}: PageProps<"/[locale]/policy/[policy]">) {
	const { locale, policy } = await params;
	if (!hasLocale(routing.locales, locale) || !isPolicyPageSlug(policy)) notFound();
	setRequestLocale(locale);

	return (
		<>
			<TopAnchor />
			<SkipToMainContent />
			<main id="main-content" className="site-content-page policy-legal container py-4" lang={locale}>
				<NativePolicyContent policy={policy} locale={locale} />
			</main>
		</>
	);
}
