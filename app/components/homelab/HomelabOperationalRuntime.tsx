"use client";

import { useTranslations } from "next-intl";
import type { HomelabObservabilitySnapshot } from "@/lib/homelabObservability";
import styles from "./HomelabOperationalEvidence.module.css";
import HomelabOperationalFastApiRuntime from "./HomelabOperationalFastApiRuntime";
import HomelabOperationalTrueNasRuntime from "./HomelabOperationalTrueNasRuntime";

export default function HomelabOperationalRuntime({
	evidence,
}: Readonly<{ evidence: HomelabObservabilitySnapshot }>) {
	const t = useTranslations("operations");

	return (
		<details className={styles.details} data-runtime-transport-evidence>
			<summary>{t("runtime.title")}</summary>
			<div className={styles.detailsBody}>
				<p>{t("runtime.lead")}</p>
				<div className={styles.splitGrid}>
					<HomelabOperationalFastApiRuntime evidence={evidence} />
					<HomelabOperationalTrueNasRuntime evidence={evidence} />
				</div>
			</div>
		</details>
	);
}
