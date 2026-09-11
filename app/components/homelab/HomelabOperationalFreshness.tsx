"use client";

import { useTranslations } from "next-intl";
import type { HomelabObservabilitySnapshot } from "@/lib/homelabObservability";
import styles from "./HomelabOperationalEvidence.module.css";

export default function HomelabOperationalFreshness({
	evidence,
}: Readonly<{ evidence: HomelabObservabilitySnapshot }>) {
	const t = useTranslations("operations");

	return (
		<>
			<details className={styles.details} data-evidence-freshness>
				<summary>{t("freshness.title")}</summary>
				<div className={styles.detailsBody}>
					{evidence.staleServices.length === 0 &&
					evidence.dependencyCycles.length === 0 ? (
						<p>{t("freshness.none")}</p>
					) : null}
					{evidence.staleServices.length ? (
						<>
							<strong>
								{t("freshness.stale", { count: evidence.staleServices.length })}
							</strong>
							<ul>
								{evidence.staleServices.map((service) => (
									<li key={service.id}>
										{service.name}
										{typeof service.observationAgeSeconds === "number"
											? ` · ${t("freshness.age", {
													seconds: service.observationAgeSeconds,
												})}`
											: ""}
									</li>
								))}
							</ul>
						</>
					) : null}
					{evidence.dependencyCycles.length ? (
						<>
							<strong>
								{t("freshness.cycles", {
									count: evidence.dependencyCycles.length,
								})}
							</strong>
							<ul>
								{evidence.dependencyCycles.map((cycle) => (
									<li key={cycle.members.join("→")}>
										{cycle.members.join(" → ")}
									</li>
								))}
							</ul>
						</>
					) : null}
				</div>
			</details>

			{evidence.providerCredentials.length ? (
				<details className={styles.details} data-provider-credential-evidence>
					<summary>{t("credentials.title")}</summary>
					<div className={styles.detailsBody}>
						<p>{t("credentials.lead")}</p>
						<ul className={styles.evidenceList}>
							{evidence.providerCredentials.map((credential) => (
								<li key={credential.provider}>
									<strong>{credential.provider}</strong>{" "}
									<span className={styles.badge}>
										{credential.configured
											? t("credentials.configured")
											: t("credentials.missing")}
									</span>
									{credential.credentialMode ? (
										<small>
											{t("credentials.mode", { mode: credential.credentialMode })}
										</small>
									) : null}
									{credential.missingVariables.length ? (
										<small>
											{t("credentials.missingVariables", {
												variables: credential.missingVariables.join(", "),
											})}
										</small>
									) : null}
									{credential.requiredPrivilege ? (
										<small>
											{t("credentials.privilege", {
												privilege: credential.requiredPrivilege,
											})}
										</small>
									) : null}
									{credential.writePrivilegesRequired === false ? (
										<small>{t("credentials.readOnly")}</small>
									) : null}
								</li>
							))}
						</ul>
					</div>
				</details>
			) : null}
		</>
	);
}
