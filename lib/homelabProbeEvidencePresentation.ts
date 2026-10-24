import type {
  HomelabHealthEntry,
  HomelabHealthSnapshot,
} from "./homelabHealthTypes";

/** A missing probe is never a failed probe. Only a timestamped probe can fail. */
export type ProbeDisplayState =
  | "disabled" | "not-configured" | "not-run" | "stale" | "failed" | "observed";

export type ProbeDisplay = {
  state: ProbeDisplayState;
  observedAt: string | null;
  source: "origin" | "memory" | "deadline" | null;
  latencyMs: number | null;
  status: string | null;
};

function observedTimestamp(value: string | null | undefined): string | null {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

function latency(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ?
    value : null;
}

/** Do not substitute service.observed_at: runtime/tunnel inventory is not a probe. */
export function describeServiceProbe(
  entry: HomelabHealthEntry | undefined,
  snapshot: HomelabHealthSnapshot,
  scope: "public" | "internal",
): ProbeDisplay {
  // A service without a LAN target is not merely disabled by this collector.
  if (scope === "internal" && entry?.internal_probe_execution === "not-configured")
    return { state: "not-configured", observedAt: null, source: null, latencyMs: null, status: null };
  if (scope === "internal" && snapshot.internal_probes_enabled === false)
    return { state: "disabled", observedAt: null, source: null, latencyMs: null, status: null };

  const source = scope === "public" ?
    entry?.direct_probe_source ?? null : entry?.internal_probe_source ?? null;
  const observedAt = observedTimestamp(scope === "public" ?
    entry?.direct_probe_observed_at : entry?.internal_probe_observed_at);
  const base = { observedAt, source, latencyMs: null, status: null };

  // "sampled" and "observed" are not synonyms: an eligible target can wait
  // several rotating windows before it is executed for the first time.
  if (!entry || !observedAt) return { ...base, state: "not-run" };

  const stale = scope === "public" ?
    entry.direct_probe_stale === true : entry.internal_probe_stale === true;
  if (stale || entry.observation_stale === true) return { ...base, state: "stale" };

  const scopeState = scope === "public" ? entry.direct_state : entry.internal_state;
  const failed = scopeState === "fail";
  return {
    observedAt, source,
    latencyMs: scope === "public" ? latency(entry.latency_ms) : null,
    status: scope === "public" && entry.http_status > 0 ?
      `HTTP ${entry.http_status}` : scopeState ?? null,
    state: failed ? "failed" : "observed",
  };
}
