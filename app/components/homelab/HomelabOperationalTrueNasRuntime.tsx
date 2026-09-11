"use client";

import { useTranslations } from "next-intl";
import type { HomelabObservabilitySnapshot } from "@/lib/homelabObservability";
import styles from "./HomelabOperationalEvidence.module.css";

export default function HomelabOperationalTrueNasRuntime({
	evidence,
}: Readonly<{ evidence: HomelabObservabilitySnapshot }>) {
	const t = useTranslations("operations");
	const truenasApi = evidence.diagnostics?.truenas_api;

	return (
		<div data-truenas-api-diagnostics>
			<h3>{t("runtime.truenas")}</h3>
			{truenasApi ? (
				<ul className={styles.compactList}>
					<li
						className={truenasApi.reachable ? styles.stateOk : styles.stateWarn}
						data-current-probe-failure={truenasApi.reachable ? undefined : true}
					>
						{truenasApi.reachable
							? t("runtime.reachable")
							: t("runtime.unreachable")}
						{truenasApi.phase || truenasApi.stage
							? ` · ${truenasApi.phase ?? "?"}/${truenasApi.stage ?? "?"}`
							: ""}
					</li>
					{typeof truenasApi.elapsed_ms === "number" ? (
						<li>
							{t("components.latency", { milliseconds: truenasApi.elapsed_ms })}
						</li>
					) : null}
					{truenasApi.cached !== undefined ? (
						<li>
							{truenasApi.cached ? "cached" : "fresh"}
							{truenasApi.cache_layer ? ` · ${truenasApi.cache_layer}` : ""}
							{typeof truenasApi.cache_age_seconds === "number"
								? ` · ${Math.round(truenasApi.cache_age_seconds)}s`
								: ""}
							{truenasApi.stale ? " · stale" : ""}
						</li>
					) : null}
					{truenasApi.redis_available === true ? (
						<li>{t("cache.redisAvailable")}</li>
					) : null}
					{truenasApi.redis_available === false ? (
						<li>{t("cache.redisUnavailable")}</li>
					) : null}
					{truenasApi.refresh_in_progress ? <li>{t("cache.refreshing")}</li> : null}
					{truenasApi.last_success_at ? (
						<li>
							{t("components.lastSuccess", {
								timestamp: truenasApi.last_success_at,
							})}
						</li>
					) : null}
					{truenasApi.last_good ? (
						<li data-last-good-evidence>
							{t("runtime.lastGood")}
							{truenasApi.last_good.version
								? ` · ${truenasApi.last_good.version}`
								: ""}
							{typeof truenasApi.last_good.app_count === "number"
								? ` · ${truenasApi.last_good.running_app_count ?? 0}/${truenasApi.last_good.app_count} apps running`
								: ""}
							{truenasApi.last_good.last_success_at
								? ` · ${truenasApi.last_good.last_success_at}`
								: ""}
						</li>
					) : truenasApi.last_good_available ? (
						<li data-last-good-evidence>{t("runtime.lastGood")}</li>
					) : null}
					{truenasApi.error ? (
						<li className={styles.stateWarn} data-current-probe-failure>
							{[truenasApi.exception_type, truenasApi.error]
								.filter(Boolean)
								.join(" · ")}
						</li>
					) : null}
					{typeof truenasApi.retry_after_seconds === "number" ? (
						<li>
							{t("components.retry", {
								seconds: truenasApi.retry_after_seconds,
							})}
						</li>
					) : null}
				</ul>
			) : (
				<p>{t("runtime.unavailable")}</p>
			)}
		</div>
	);
}
