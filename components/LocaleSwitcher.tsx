"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ChangeEvent } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import styles from "./LocaleSwitcher.module.css";

export default function LocaleSwitcher() {
	const locale = useLocale();
	const t = useTranslations("site");
	const pathname = usePathname();
	const router = useRouter();

	function handleLocaleChange(event: ChangeEvent<HTMLSelectElement>) {
		const nextLocale = event.target.value as "en" | "fr";
		// Shared routing (no `pathnames` map): `pathname` already reflects the active route.
		router.replace({ pathname }, { locale: nextLocale });
	}

	return (
		<label
			htmlFor="locale-switcher"
			className={`${styles.root} locale-switcher`}
		>
			<span>{t("localeSwitcherLabel")}</span>
			<select
				id="locale-switcher"
				name="locale"
				value={locale}
				onChange={handleLocaleChange}
				className={styles.select}
				aria-label={t("switchLanguage")}
			>
				<option value="en">{t("languageName.en")}</option>
				<option value="fr">{t("languageName.fr")}</option>
			</select>
		</label>
	);
}
