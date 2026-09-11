"use client";

import { useTranslations } from "next-intl";
import type { HomelabObservabilitySnapshot } from "@/lib/homelabObservability";
import styles from "./HomelabOperationalEvidence.module.css";

export default function HomelabOperationalFastApiRuntime({
	evidence,
}: Readonly<{ evidence: HomelabObservabilitySnapshot }>) {
	const t = useTranslations("operations");
	const runtime = evidence.runtimeTopology;

	return (
		<div>
			<h3>{t("runtime.fastapi")}</h3>
			{runtime ? (
				<>
					<ul className={styles.compactList}>
						<li>{t("runtime.provider", { provider: runtime.provider })}</li>
						{runtime.runtime_mode ? (
							<li>{t("runtime.mode", { mode: runtime.runtime_mode })}</li>
						) : null}
						<li>{t("runtime.observed", { timestamp: runtime.observed_at })}</li>
						<li>
							{t("runtime.instances", {
								count: runtime.observed_instance_count,
							})}
						</li>
						{runtime.aggregation ? (
							<li>
								{t("runtime.aggregation", {
									aggregation: runtime.aggregation,
								})}
								{runtime.degraded ? " · degraded" : ""}
							</li>
						) : null}
						<li>
							{t("runtime.activeEgress", {
								ips: runtime.active_egress_ips.join(" · ") || "none",
							})}
						</li>
						<li>
							{t("runtime.recentEgress", {
								ips: runtime.recent_egress_ips.join(" · ") || "none",
							})}
						</li>
						{runtime.heartbeat_interval_seconds &&
						runtime.active_window_seconds &&
						runtime.recent_egress_window_seconds ? (
							<li>
								{t("runtime.windows", {
									heartbeat: runtime.heartbeat_interval_seconds,
									active: runtime.active_window_seconds,
									recent: runtime.recent_egress_window_seconds,
								})}
							</li>
						) : null}
					</ul>
					{runtime.instances.length ? (
						<ul className={styles.evidenceList}>
							{runtime.instances.map((instance) => (
								<li key={instance.id}>
									{t("runtime.instance", {
										id: instance.id,
										lastSeen: instance.last_seen_at ?? "unknown",
										egress: instance.egress_ip ?? "unknown",
									})}
									{instance.egress_cached ? " · cached egress" : ""}
								</li>
							))}
						</ul>
					) : null}
					<small className={styles.detailText}>
						{runtime.count_semantics || t("runtime.countSemantics")}
					</small>
					{runtime.redis ? (
						<div data-runtime-redis-evidence>
							<h4>{t("runtime.redis.title")}</h4>
							<ul className={styles.compactList}>
								<li>
									{runtime.redis.telemetry_available
										? t("runtime.redis.available")
										: t("runtime.redis.unavailable")}
									{runtime.redis.backend ? ` · ${runtime.redis.backend}` : ""}
								</li>
								{runtime.redis.telemetry_scope ? (
									<li>
										{t("runtime.redis.scope", {
											scope: runtime.redis.telemetry_scope,
										})}
									</li>
								) : null}
								{runtime.redis.used_memory_human ? (
									<li>
										{t("runtime.redis.memory", {
											used: runtime.redis.used_memory_human,
											max:
												runtime.redis.maxmemory_human ??
												t("runtime.redis.unbounded"),
										})}
										{typeof runtime.redis.memory_utilization_percent ===
										"number"
											? ` · ${runtime.redis.memory_utilization_percent}%`
											: ""}
									</li>
								) : null}
								{typeof runtime.redis.connected_clients === "number" ? (
									<li>
										{t("runtime.redis.clients", {
											connected: runtime.redis.connected_clients,
											blocked: runtime.redis.blocked_clients ?? 0,
										})}
									</li>
								) : null}
								{typeof runtime.redis.keys === "number" ? (
									<li>
										{t("runtime.redis.keys", { count: runtime.redis.keys })}
									</li>
								) : null}
								{typeof runtime.redis.keyspace_hit_rate_percent === "number" ? (
									<li>
										{t("runtime.redis.hitRate", {
											percent: runtime.redis.keyspace_hit_rate_percent,
										})}
									</li>
								) : null}
								{typeof runtime.redis.instantaneous_ops_per_sec === "number" ? (
									<li>
										{t("runtime.redis.ops", {
											count: runtime.redis.instantaneous_ops_per_sec,
										})}
									</li>
								) : null}
								{typeof runtime.redis.evicted_keys === "number" ? (
									<li>
										{t("runtime.redis.evictions", {
											evicted: runtime.redis.evicted_keys,
											expired: runtime.redis.expired_keys ?? 0,
										})}
									</li>
								) : null}
								{runtime.redis.reason ? <li>{runtime.redis.reason}</li> : null}
								{runtime.redis.failure_stage ||
								runtime.redis.error_kind ||
								runtime.redis.exception_type ? (
									<li className={styles.stateWarn}>
										{[
											runtime.redis.failure_stage,
											runtime.redis.error_kind,
											runtime.redis.exception_type,
										]
											.filter(Boolean)
											.join(" / ")}
									</li>
								) : null}
							</ul>
						</div>
					) : null}
				</>
			) : (
				<p>{t("runtime.unavailable")}</p>
			)}
		</div>
	);
}
