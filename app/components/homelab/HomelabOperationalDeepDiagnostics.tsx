"use client";

import { useTranslations } from "next-intl";
import type {
	DeepDiagnosticCategory,
	DeepDiagnosticCheckEvidence,
	HomelabObservabilitySnapshot,
	ProbeCacheEvidence,
} from "@/lib/homelabObservability";
import type { OperationalHealthState } from "@/lib/homelabOperationalEvidence";
import styles from "./HomelabOperationalEvidence.module.css";

const STATE_ICON: Record<OperationalHealthState, string> = {
	ok: "fas fa-circle-check",
	warn: "fas fa-triangle-exclamation",
	fail: "fas fa-circle-xmark",
	unknown: "fas fa-circle-question",
};

const CATEGORY_KEY: Record<DeepDiagnosticCategory, string> = {
	required: "deep.required",
	"control-plane": "deep.control-plane",
	integration: "deep.integration",
	homelab: "deep.homelab",
};

function stateClass(state: OperationalHealthState): string {
	return state === "ok"
		? styles.stateOk
		: state === "warn"
			? styles.stateWarn
			: state === "fail"
				? styles.stateFail
				: styles.stateUnknown;
}

function cacheDetails(
	cache: ProbeCacheEvidence | undefined,
	t: ReturnType<typeof useTranslations>,
): string[] {
	if (!cache) return [];
	const rows: string[] = [];
	if (cache.layer) rows.push(t("cache.layer", { layer: cache.layer }));
	if (typeof cache.ageSeconds === "number") {
		rows.push(t("cache.age", { seconds: Math.round(cache.ageSeconds) }));
	}
	if (cache.redisAvailable === true) rows.push(t("cache.redisAvailable"));
	if (cache.redisAvailable === false) rows.push(t("cache.redisUnavailable"));
	if (cache.refreshInProgress) rows.push(t("cache.refreshing"));
	return rows;
}

function DeepCheckRow({
	check,
	t,
}: Readonly<{
	check: DeepDiagnosticCheckEvidence;
	t: ReturnType<typeof useTranslations>;
}>) {
	const metadata = [
		check.skipped ? t("deep.skipped") : null,
		typeof check.httpStatus === "number"
			? t("deep.http", { status: check.httpStatus })
			: null,
		check.tlsTrusted === true ? t("deep.tlsTrusted") : null,
		check.tlsTrusted === false ? t("deep.tlsUntrusted") : null,
		typeof check.elapsedMs === "number"
			? t("deep.latency", { milliseconds: check.elapsedMs })
			: null,
		check.probe ? t("deep.probe", { probe: check.probe }) : null,
		check.authentication
			? t("deep.authentication", { authentication: check.authentication })
			: null,
		check.resource ? t("deep.resource", { resource: check.resource }) : null,
		check.path ? t("deep.path", { path: check.path }) : null,
		check.target ? t("deep.target", { target: check.target }) : null,
		...cacheDetails(check.cache, t),
	].filter((value): value is string => Boolean(value));

	return (
		<li
			data-deep-diagnostic-check={check.id}
			data-deep-diagnostic-state={check.state}
		>
			<div className={styles.evidenceHeading}>
				<strong>{check.label}</strong>
				<i
					className={`${STATE_ICON[check.state]} ${stateClass(check.state)}`}
					aria-hidden="true"
				/>
			</div>
			{metadata.length ? <small>{metadata.join(" · ")}</small> : null}
			{check.reason ? <small>{check.reason}</small> : null}
			{check.error ? (
				<small
					className={
						check.state === "fail" ? styles.stateFail : styles.stateWarn
					}
				>
					{[check.errorKind, check.exceptionType, check.error]
						.filter(Boolean)
						.join(" · ")}
				</small>
			) : null}
		</li>
	);
}

export default function HomelabOperationalDeepDiagnostics({
	evidence,
}: Readonly<{ evidence: HomelabObservabilitySnapshot }>) {
	const t = useTranslations("operations");
	const diagnostics = evidence.deepDiagnostics;

	return (
		<details className={styles.details} data-deep-diagnostics>
			<summary>
				{t("deep.title")}
				{diagnostics.status ? ` · ${diagnostics.status}` : ""}
			</summary>
			<div className={styles.detailsBody}>
				<p>{t("deep.lead")}</p>
				<div className={styles.badges}>
					{diagnostics.status ? (
						<span>{t("deep.status", { status: diagnostics.status })}</span>
					) : null}
					{diagnostics.contract ? (
						<span>
							{t("deep.contract", { contract: diagnostics.contract })}
						</span>
					) : null}
					{diagnostics.version ? (
						<span>{t("deep.version", { version: diagnostics.version })}</span>
					) : null}
				</div>
				{diagnostics.checks.length ? (
					(
						["required", "control-plane", "integration", "homelab"] as const
					).map((category) => {
						const checks = diagnostics.checks.filter(
							(check) => check.category === category,
						);
						if (!checks.length) return null;
						return (
							<section
								key={category}
								className={styles.diagnosticGroup}
								aria-labelledby={`deep-${category}`}
							>
								<h3 id={`deep-${category}`}>{t(CATEGORY_KEY[category])}</h3>
								<ul className={styles.evidenceList}>
									{checks.map((check) => (
										<DeepCheckRow check={check} t={t} key={check.id} />
									))}
								</ul>
							</section>
						);
					})
				) : (
					<p>{t("deep.none")}</p>
				)}
			</div>
		</details>
	);
}
