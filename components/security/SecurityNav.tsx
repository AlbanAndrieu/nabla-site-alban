import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import styles from "./SecurityNav.module.css";

const links = [
	["overview", "/security"],
	["ciso", "/ciso"],
	["ctem", "/security/ctem"],
	["ctid", "/ctid.html"],
	["compliance", "/security/compliance"],
	["glossary", "/security/lexique"],
	["dsomm", "/security/dsomm"],
	["yubikey", "/security/yubikey"],
] as const;

export default async function SecurityNav({
	locale,
	active,
}: {
	locale: AppLocale;
	active: (typeof links)[number][0];
}) {
	const t = await getTranslations({ locale, namespace: "securityNav" });
	return (
		<nav aria-label={t("label")} className={styles.nav}>
			{links.map(([key, path]) => (
				<a
					key={key}
					href={`${locale === "fr" ? "/fr" : ""}${path}`}
					aria-current={active === key ? "page" : undefined}
				>
					{t(key)}
				</a>
			))}
		</nav>
	);
}
