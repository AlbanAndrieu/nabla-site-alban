"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ChangeEvent } from "react";
import Container from "@/components/ui/Container";
import styles from "./RouteHeader.module.css";

export const ROUTE_HEADER_LANGUAGE_SWITCHER_ENABLED =
	process.env.NEXT_PUBLIC_ENABLE_LOCALE_SWITCHER !== "false";

const ROUTE_HEADER_LABELS = {
	en: {
		breadcrumb: "Breadcrumb",
		home: "Home",
	},
	fr: {
		breadcrumb: "Fil d’Ariane",
		home: "Accueil",
	},
} as const;

function routeParts(pathname: string) {
	const parts = pathname.split("/").filter(Boolean);
	if (parts[0] === "en" || parts[0] === "fr") parts.shift();
	return parts.map((part) => part.replace(/\.html$/, ""));
}

function localizedPath(locale: string, parts: string[]) {
	return `/${locale}${parts.length ? `/${parts.join("/")}` : ""}`;
}

function parentLabel(segment: string, locale: string) {
	const labels: Record<string, { en: string; fr: string }> = {
		cv: { en: "CV", fr: "CV" },
		jm: { en: "Jus Mundi", fr: "Jus Mundi" },
	};
	return (
		labels[segment]?.[locale === "fr" ? "fr" : "en"] ??
		segment.replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase())
	);
}

export default function RouteHeader() {
	const locale = useLocale();
	const t = useTranslations("site");
	const pathname = usePathname();
	const router = useRouter();
	const parts = routeParts(pathname);
	const showNavigation = parts.length > 0;
	const showLanguageSwitcher = ROUTE_HEADER_LANGUAGE_SWITCHER_ENABLED;
	const labels = ROUTE_HEADER_LABELS[locale === "fr" ? "fr" : "en"];

	if (!showNavigation && !showLanguageSwitcher) return null;

	const parentParts = parts.slice(0, -1);
	const parentSegment = parentParts.at(-1);
	const homeHref = localizedPath(locale, []);
	const parentHref = parentParts.length
		? localizedPath(locale, parentParts)
		: null;

	function handleLocaleChange(event: ChangeEvent<HTMLSelectElement>) {
		const nextLocale = event.target.value;
		const hasHtmlSuffix = pathname.endsWith(".html");
		const targetParts = [...parts];
		if (hasHtmlSuffix && targetParts.length) {
			targetParts[targetParts.length - 1] += ".html";
		}
		router.replace(localizedPath(nextLocale, targetParts));
	}

	const headerClassName = showNavigation
		? styles.header
		: `${styles.header} ${styles.root}`;

	return (
		<header className={headerClassName}>
			<Container className={styles.inner}>
				{showNavigation ? (
					<nav className={styles.nav} aria-label={labels.breadcrumb}>
						<Link
							className={styles.home}
							href={homeHref}
							aria-label={labels.home}
						>
							<i className="fas fa-home" aria-hidden="true" />
							<span>{labels.home}</span>
						</Link>
						{parentHref && parentSegment ? (
							<>
								<span className={styles.separator} aria-hidden="true">
									/
								</span>
								<Link className={styles.parent} href={parentHref}>
									<i className="fas fa-arrow-left" aria-hidden="true" />
									<span>{parentLabel(parentSegment, locale)}</span>
								</Link>
							</>
						) : null}
					</nav>
				) : null}
				{showLanguageSwitcher ? (
					<label htmlFor="route-header-locale" className={styles.locale}>
						<span>{t("localeSwitcherLabel")}</span>
						<select
							id="route-header-locale"
							value={locale}
							onChange={handleLocaleChange}
							aria-label={t("switchLanguage")}
							className={styles.select}
						>
							<option value="en">{t("languageName.en")}</option>
							<option value="fr">{t("languageName.fr")}</option>
						</select>
					</label>
				) : null}
			</Container>
		</header>
	);
}