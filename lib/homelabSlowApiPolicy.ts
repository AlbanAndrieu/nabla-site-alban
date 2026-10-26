/**
 * Client-side deadlines protect a frozen origin from accumulating polls.
 * Timeouts mean "unknown", never "down" or "healthy".
 */
export const HOMELAB_REQUEST_DEADLINE_MS = 8_000;
export const HOMELAB_HEALTH_INTERVAL_MS = 30_000;
export const HOMELAB_MAX_BACKOFF_MS = 4 * 60_000;

export function homelabRetryDelayMs(consecutiveFailures: number): number {
  const failures = Number.isFinite(consecutiveFailures)
    ? Math.max(0, Math.floor(consecutiveFailures)) : 0;
  return Math.min(HOMELAB_MAX_BACKOFF_MS,
    HOMELAB_HEALTH_INTERVAL_MS * 2 ** Math.min(failures, 3));
}

export function boundedHomelabSignal(signal: AbortSignal): AbortSignal {
  // The caller's signal still cancels requests when the access scope changes.
  // A deadline additionally cancels stalled response bodies (including JSON).
  return AbortSignal.any([
    signal,
    AbortSignal.timeout(HOMELAB_REQUEST_DEADLINE_MS),
  ]);
}
