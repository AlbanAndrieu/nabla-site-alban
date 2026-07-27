"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ChangeEvent } from "react";

export const ROUTE_HEADER_LANGUAGE_SWITCHER_ENABLED =
	process.env.NEXT_PUBLIC_ENABLE_LOCALE_SWITCHER !== "false";

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

	return (
		<header
			className={`route-header${showNavigation ? "" : " route-header--root"}`}
		>
			{showNavigation ? (
				<nav className="route-header__nav container" aria-label="Breadcrumb">
					<Link
						className="route-header__home"
						href={homeHref}
						aria-label={locale === "fr" ? "Accueil" : "Home"}
					>
						<i className="fas fa-home" aria-hidden="true" />
						<span>{locale === "fr" ? "Accueil" : "Home"}</span>
					</Link>
					{parentHref && parentSegment ? (
						<>
							<span className="route-header__separator" aria-hidden="true">
								/
							</span>
							<Link className="route-header__parent" href={parentHref}>
								<i className="fas fa-arrow-left" aria-hidden="true" />
								<span>{parentLabel(parentSegment, locale)}</span>
							</Link>
						</>
					) : null}
				</nav>
			) : null}
			{showLanguageSwitcher ? (
				<label htmlFor="route-header-locale" className="route-header__locale">
					<span>{t("localeSwitcherLabel")}</span>
					<select
						id="route-header-locale"
						value={locale}
						onChange={handleLocaleChange}
						aria-label={t("switchLanguage")}
						className="form-select form-select-sm"
					>
						<option value="en">{t("languageName.en")}</option>
						<option value="fr">{t("languageName.fr")}</option>
					</select>
				</label>
			) : null}
		</header>
	);
}
