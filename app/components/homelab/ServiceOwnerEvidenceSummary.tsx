"use client";

import { useLocale } from "next-intl";
import type {
  HomelabHealthEntry, HomelabHealthSnapshot, TrueNasRuntimeApp,
} from "@/lib/homelabHealth";
import { describeServiceProbe, type ProbeDisplay } from "@/lib/homelabProbeEvidencePresentation";
import styles from "./HomelabServicesBlock.module.css";

function timestamp(value: string | null | undefined): string | null {
  return value && Number.isFinite(Date.parse(value)) ?
    new Date(value).toISOString() : null;
}

function primaryContainerState(
  entry: HomelabHealthEntry | undefined,
  snapshot: HomelabHealthSnapshot,
): string | null {
  if (entry?.runtime_primary_container_state) return entry.runtime_primary_container_state;
  if (!entry?.runtime_app) return null;
  const apps = snapshot.truenas?.api?.apps ?? [];
  const matches = apps.filter((app) => app.id === entry.runtime_app);
  if (matches.length !== 1) return null;
  const app: TrueNasRuntimeApp = matches[0];
  const normalized = (name: string | null | undefined) =>
    (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const names = new Set([normalized(app.id), normalized(entry.id)]);
  const primary = app.active_workloads?.container_details?.filter(
    (container) => Boolean(normalized(container.service_name)) &&
      names.has(normalized(container.service_name)),
  ) ?? [];
  return primary.length === 1 && primary[0].state ?
    primary[0].state.toUpperCase() : null;
}

type Metric = {
  key: string;
  icon: string;
  label: string;
  value: string;
  state: "ok" | "warn" | "fail" | "unknown" | "observed";
};

export default function ServiceOwnerEvidenceSummary({
  entry, snapshot, unavailable = false,
}: Readonly<{
  entry?: HomelabHealthEntry;
  snapshot: HomelabHealthSnapshot;
  unavailable?: boolean;
}>) {
  const fr = useLocale() === "fr";
  const boardStale = snapshot.health_board?.state === "stale";
  // Board metadata can lag behind a new TrueNAS/probe observation. Evaluate
  // evidence freshness independently; report stale board metadata separately.
  const stale = unavailable || snapshot.truenas_runtime_stale === true ||
    entry?.observation_stale === true || entry?.probe_stale === true ||
    entry?.direct_probe_stale === true || entry?.internal_probe_stale === true;
  const publicProbe = describeServiceProbe(entry, snapshot, "public");
  const internalProbe = describeServiceProbe(entry, snapshot, "internal");
  const probeAt = publicProbe.observedAt ?? internalProbe.observedAt;
  const runtimeAt = timestamp(entry?.observed_at);
  const primary = primaryContainerState(entry, snapshot);
  const primaryFailed = entry?.runtime_primary_container_issue === true ||
    (primary != null && !["RUNNING", "HEALTHY", "ACTIVE", "STARTED", "UP"].includes(primary));
  const runtime = entry?.runtime_state ?? null;
  const tls = entry?.tls_trusted;
  const tunnelState = entry?.tunnel_status?.toLowerCase() ?? "";
  const accessBlocked = entry?.public_probe_verification === "access_protected_origin_unverified";
  const tunnelConfirmed = !stale && entry?.tunnel_stale !== true &&
    entry?.cloudflare_status_confirmed !== false && Boolean(tunnelState);

  const probeLabel = (probe: ProbeDisplay): string => {
    switch (probe.state) {
      case "disabled": return fr ? "désactivée" : "disabled";
      case "not-configured": return fr ? "non configurée" : "not configured";
      case "not-run": return fr ? "non exécutée" : "not run";
      case "stale": return fr ? "mesure périmée" : "stale evidence";
      case "failed": return fr ? "échec confirmé" : "confirmed failure";
      case "observed": return probe.source === "memory" ?
        (fr ? "observée · cache" : "observed · cached") :
        (fr ? "observée" : "observed");
    }
  };
  const probeMetric = (key: string, label: string, probe: ProbeDisplay): Metric => ({
    key, icon: "fas fa-satellite-dish", label,
    value: `${probeLabel(probe)}${probe.observedAt ?
      ` · ${probe.observedAt.replace("T", " ").slice(0, 19)} UTC` : ""}`,
    state: probe.state === "failed" ? "fail" :
      probe.state === "stale" ? "warn" :
      probe.state === "observed" ? "observed" : "unknown",
  });
  const metrics: Metric[] = [
    {
      key: "docker", icon: "fas fa-server", label: "Docker/TrueNAS",
      value: runtime ? primary ? `${runtime} · container ${primary}` : runtime :
        (fr ? "non observé" : "not observed"),
      state: stale || !runtime ? "unknown" : primaryFailed ? "warn" :
        ["RUNNING", "HEALTHY", "ACTIVE"].includes(runtime.toUpperCase()) ? "ok" : "warn",
    },
    {
      key: "https", icon: "fas fa-lock", label: "HTTPS/TLS",
      value: tls === true ? (fr ? "certificat valide" : "trusted certificate") :
        tls === false ? (fr ? "certificat invalide" : "invalid certificate") :
        (fr ? "non vérifié" : "not verified"),
      state: stale || tls == null ? "unknown" : tls ? "ok" : "fail",
    },
    {
      key: "cloudflare", icon: "fas fa-cloud", label: "Cloudflare Tunnel",
      value: entry?.tunnel_status ?
        `${entry.tunnel_status}${entry.tunnel_name ? ` · ${entry.tunnel_name}` : ""}` :
        (fr ? "non observé" : "not observed"),
      state: !tunnelConfirmed ? "unknown" :
        ["up", "active", "healthy", "ok"].includes(tunnelState) ? "ok" : "warn",
    },
    {
      key: "http", icon: "fas fa-globe", label: "HTTP",
      value: entry?.http_status && entry.http_status > 0 ?
        `${entry.http_status}${accessBlocked ? " · Cloudflare Access" : ""}` :
        (fr ? "non sondé" : "not probed"),
      state: stale || !entry?.http_status ? "unknown" :
        accessBlocked ? "warn" : entry.http_status < 400 ? "ok" : entry.http_status < 500 ? "warn" : "fail",
    },
    {
      key: "latency", icon: "fas fa-stopwatch", label: fr ? "Latence" : "Latency",
      value: typeof entry?.latency_ms === "number" && Number.isFinite(entry.latency_ms)
        ? `${Math.round(entry.latency_ms)} ms` : "—",
      state: stale || typeof entry?.latency_ms !== "number" ? "unknown" : "observed",
    },
    {
      key: "prometheus", icon: "fas fa-chart-line", label: "Prometheus",
      value: fr ? "scrape non fourni" : "scrape unavailable",
      state: "unknown",
    },
    probeMetric("probe", fr ? "Sonde HTTPS publique" : "Public HTTPS probe", publicProbe),
    probeMetric("lan", fr ? "Sonde TCP LAN" : "LAN TCP probe", internalProbe),
  ];

  return (
    <div className={styles.ownerEvidenceSummary} data-owner-service-evidence
      data-evidence-stale={String(stale)}
      aria-label={fr ? "Diagnostics observés" : "Observed diagnostics"}>
      {metrics.map((metric) => (
        <span key={metric.key} className={styles.ownerEvidenceMetric}
          data-evidence-key={metric.key} data-evidence-state={metric.state} data-evidence-key={metric.key}
          title={metric.label + ": " + metric.value}>
          <i className={metric.icon} aria-hidden="true" />
          <span className={styles.ownerEvidenceLabel}>{metric.label}</span>
          <strong>{metric.value}</strong>
        </span>
      ))}
      {!probeAt && runtimeAt ? (
        <small data-owner-runtime-observed>
          {fr ? "Inventaire runtime" : "Runtime inventory"}:{" "}
          {runtimeAt.replace("T", " ").slice(0, 19)} UTC
        </small>
      ) : null}
      {snapshot.internal_probes_enabled === false ? (
        <small data-owner-internal-disabled>
          {fr ? "Le collecteur FastAPI interrogé n'exécute pas les sondes LAN."
            : "The selected FastAPI collector does not run LAN probes."}
        </small>
      ) : null}
      {boardStale ? (
        <small className="text-warning" data-owner-board-stale>
          {fr ? "Health board en actualisation : état du tableau global ancien ; preuves locales datées séparément"
            : "Health board refreshing: global board is stale; individual evidence timestamps differ"}
        </small>
      ) : null}
      {stale ? (
        <small className="text-warning" data-owner-evidence-stale>
          {fr ? "Snapshot ancien — aucune preuve de santé récente confirmée"
            : "Stale snapshot — no recent health confirmation"}
        </small>
      ) : null}
    </div>
  );
}
