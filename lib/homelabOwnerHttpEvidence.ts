import type { ProbeDisplay } from "./homelabProbeEvidencePresentation.ts";
import type { HomelabHealthState } from "./homelabHealthTypes.ts";

/** A recorded HTTP number alone is not evidence of a successful live probe. */
export function ownerHttpObservationState(
  probe: ProbeDisplay,
  httpStatus: unknown,
  overallStale: boolean,
  accessBlocked: boolean,
): HomelabHealthState {
  if (overallStale || !probe.observedAt || (probe.source !== "origin" && probe.source !== "memory") ||
      (probe.state !== "observed" && probe.state !== "failed") ||
      typeof httpStatus !== "number" || !Number.isInteger(httpStatus) ||
      httpStatus < 100 || httpStatus > 599) return "unknown";
  if (probe.state === "failed" && httpStatus < 400) return "unknown";
  if (accessBlocked) return "warn";
  if (httpStatus < 400) return "ok";
  return httpStatus < 500 ? "warn" : "fail";
}

/** Only a timed, fresh executed probe may substantiate a displayed latency. */
export function ownerLatencyObserved(probe: ProbeDisplay, overallStale: boolean): boolean {
  return !overallStale && probe.observedAt !== null && (probe.source === "origin" || probe.source === "memory") &&
    (probe.state === "observed" || probe.state === "failed") &&
    probe.latencyMs !== null;
}
