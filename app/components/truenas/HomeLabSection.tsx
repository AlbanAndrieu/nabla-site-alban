import { getTranslations } from "next-intl/server";
import AnchoredHeading from "@/components/AnchoredHeading";
import HomeLabNetworkFlow from "./HomeLabNetworkFlow";
import styles from "./HomeLabSection.module.css";

export default async function HomeLabSection() {
	const t = await getTranslations("truenas.page.homelab");

	return (
		<section className="py-4 page-truenas-secondary" aria-labelledby="homelab">
			<div className="container">
				<AnchoredHeading as="h2" id="homelab" className="h4 mb-3">
					<i
						className="fas fa-layer-group text-primary me-2"
						aria-hidden="true"
					></i>
					{t("title")}
				</AnchoredHeading>
				<p className="text-secondary mb-4">{t("intro")}</p>
				<p>{t("purpose")}</p>
				<aside className={styles.networkCard} aria-label={t("network.ariaLabel")}>
					<div className={styles.header}>
						<span className={styles.eyebrow}>{t("network.eyebrow")}</span>
						<strong>{t("network.path")}</strong>
					</div>
					<p className="small mb-3">{t("network.intro")}</p>
					<HomeLabNetworkFlow />
					<details className={styles.networkDetails}>
						<summary className={styles.networkSummary}>
							<i className="fas fa-shield-halved" aria-hidden="true" />{" "}
							{t("network.detailsSummary")}
						</summary>
						<div className={styles.factGroups}>
							<div className={styles.factGroup}>
								<h3>{t("network.exposureTitle")}</h3>
								<ul className={styles.factList}>
									<li>
										<strong>{t("network.tcp7000Label")}</strong>
										<span>{t("network.tcp7000")}</span>
									</li>
									<li>
										<strong>{t("network.tcp10443Label")}</strong>
										<span>{t("network.tcp10443")}</span>
									</li>
									<li>
										<strong>{t("network.tcp9922Label")}</strong>
										<span>{t("network.tcp9922")}</span>
									</li>
								</ul>
							</div>

							<div className={styles.factGroup}>
								<h3>{t("network.routingTitle")}</h3>
								<ul className={styles.factList}>
									<li>
										<strong>{t("network.cloudflareLabel")}</strong>
										<span>{t("network.cloudflare")}</span>
									</li>
									<li>
										<strong>{t("network.r7000Label")}</strong>
										<span>{t("network.r7000")}</span>
									</li>
								</ul>
							</div>

							<div className={styles.factGroup}>
								<h3>{t("network.resilienceTitle")}</h3>
								<ul className={styles.factList}>
									<li>
										<strong>{t("network.dnsLabel")}</strong>
										<span>{t("network.dns")}</span>
									</li>
								</ul>
							</div>

							<div className={styles.factGroup}>
								<h3>{t("network.sourcesTitle")}</h3>
								<ul className={styles.factList}>
									<li>
										<strong>{t("network.s24Label")}</strong>
										<span>{t("network.s24")}</span>
									</li>
									<li>
										<strong>{t("network.fastApiLabel")}</strong>
										<span>{t("network.fastApi")}</span>
									</li>
								</ul>
								<p className={styles.sourceNote}>
									<i className="fas fa-circle-info" aria-hidden="true" />{" "}
									{t("network.sourcesNote")}
								</p>
							</div>
						</div>
					</details>
				</aside>
			</div>
		</section>
	);
}
