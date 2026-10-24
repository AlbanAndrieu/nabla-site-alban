"use client";

import { useLocale } from "next-intl";
import type { HomelabHealthEntry, HomelabHealthSnapshot } from "@/lib/homelabHealth";
import styles from "./HomelabServicesBlock.module.css";

function observedTime(entry: HomelabHealthEntry): string | null {
  for (const value of [
    entry.probe_observed_at, entry.direct_probe_observed_at,
    entry.internal_probe_observed_at, entry.observed_at,
  ]) {
    if (typeof value === "string" && Number.isFinite(Date.parse(value)))
      return new Date(value).toISOString();
  }
  return null;
}

type Metric = { key: string; icon: string; label: string; value: string; state: string };

export default function ServiceOwnerEvidenceSummary({
  entry, snapshot,
}: Readonly<{
  entry?: HomelabHealthEntry;
  snapshot: HomelabHealthSnapshot;
}>) {
  const fr = useLocale() === "fr";
  const stale = snapshot.health_board?.state === "stale" ||
    snapshot.truenas_runtime_stale === true || entry?.observation_stale === true ||
    entry?.probe_stale === true;
  const observed = entry ? observedTime(entry) : null;
  const https = entry?.url.startsWith("https://") === true;
  const metrics: Metric[] = [
    {
      key: "docker", icon: "fa-brands fa-docker", label: "Docker/TrueNAS",
      value: entry?.runtime_state ??
        (fr ? "non observé" : "not observed"),
      state: !entry?.runtime_state || stale ? "unknown" :
        ["RUNNING", "HEALTHY", "ACTIVE"].includes(entry.runtime_state.toUpperCase()) ? "ok" : "warn",
    },
    {
      key: "https", icon: "fas fa-lock", label: "HTTPS/TLS",
      value: !https ? (fr ? "non sondé" : "not probed") :
        entry?.tls_trusted === true ? (fr ? "certificat valide" : "trusted certificate") :
        entry?.tls_trusted === false ? (fr ? "certificat invalide" : "invalid certificate") :
        (fr ? "non vérifié" : "unverified"),
      state: !stale && https && entry?.tls_trusted === true ? "ok" :
        !stale && https && entry?.tls_trusted === false ? "fail" : "unknown",
    },
    {
      key: "cloudflare", icon: "fas fa-cloud", label: "Cloudflare",
      value: entry?.tunnel_status ?
        `${entry.tunnel_status}${entry.tunnel_name ? ` · ${entry.tunnel_name}` : ""}` :
        (fr ? "non observé" : "not observed"),
      state: stale || !entry?.tunnel_status || entry.cloudflare_status_confirmed !== true ? "unknown" :
        ["UP", "ACTIVE", "HEALTHY", "OK"].includes(entry.tunnel_status.toUpperCase()) ? "ok" : "warn",
    },
    {
      key: "http", icon: "fas fa-globe", label: "HTTP",
      value: entry?.http_status && entry.http_status > 0 ? String(entry.http_status) :
        (fr ? "non sondé" : "not probed"),
      state: stale || !entry?.http_status ? "unknown" :
        entry.http_status < 400 ? "ok" : entry.http_status < 500 ? "warn" : "fail",
    },
    {
      key: "latency", icon: "fas fa-stopwatch", label: fr ? "Latence" : "Latency",
      value: typeof entry?.latency_ms === "number" && Number.isFinite(entry.latency_ms)
        ? `${Math.round(entry.latency_ms)} ms` : "—",
      state: stale || typeof entry?.latency_ms !== "number" ? "unknown" : "observed",
    },
    {
      key: "prometheus", icon: "fas fa-chart-line", label: "Prometheus",
      value: fr ? "preuve absente du DTO" : "no metric in DTO",
      state: "unknown",
    },
    {
      key: "probe", icon: "fas fa-satellite-dish", label: fr ? "Dernière sonde" : "Last probe",
      value: observed ? observed.replace("T", " ").slice(0, 19) + " UTC" :
        fr ? "horodatage absent" : "timestamp missing",
      state: !observed || stale ? "unknown" : "observed",
    },
  ];
  return (
    <div className={styles.ownerEvidenceSummary} data-owner-service-evidence
      data-evidence-stale={String(stale)} aria-label={fr ? "Diagnostics observés" : "Observed diagnostics"}>
      {metrics.map((metric) => (
        <span key={metric.key} className={styles.ownerEvidenceMetric}
          data-evidence-key={metric.key} data-evidence-state={metric.state}
          title={metric.label + ": " + metric.value}>
          <i className={metric.icon} aria-hidden="true" />
          <span className={styles.ownerEvidenceLabel}>{metric.label}</span>
          <strong>{metric.value}</strong>
        </span>
      ))}
      {stale ? <small className="text-warning" data-owner-evidence-stale>
        {fr ? "Preuves anciennes — aucun état sain confirmé" : "Stale evidence — no healthy state confirmed"}
      </small> : null}
    </div>
  );
}
