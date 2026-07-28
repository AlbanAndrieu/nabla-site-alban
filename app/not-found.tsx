import Script from "next/script";
import { getTranslations } from "next-intl/server";
import styles from "./404.module.css";

export default async function NotFound() {
	const t = await getTranslations("404");
	return (
		<div className={styles.pageDark}>
			<h1 className={styles.error404}>404</h1>
			<div className={styles.cloakWrapper}>
				<div className={styles.cloakContainer}>
					<div className={styles.cloak}></div>
				</div>
			</div>
			<div className={styles.info}>
				<h2>{t("heading")}</h2>
				<p>{t("message")}</p>
				<a href="/" rel="noreferrer noopener" className={styles.homeLink}>
					<i className="fas fa-home" aria-hidden="true"></i> {t("backHome")}
				</a>
			</div>
			<Script
				src="/site-widgets.js"
				strategy="afterInteractive"
				data-minimal-chrome=""
			/>
		</div>
	);
}
