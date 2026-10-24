/** Machine-readable, bounded provenance for server-to-server catalog reads. */
export type CatalogFailureStage =
  | "site_configuration"
  | "upstream_auth"
  | "upstream_http"
  | "upstream_network"
  | "upstream_timeout"
  | "catalog_validation"
  | "unknown";

const UPSTREAM_STAGES = new Set<CatalogFailureStage>([
  "upstream_auth", "upstream_http", "upstream_network",
  "upstream_timeout", "catalog_validation", "unknown",
]);

/** Never reflect an untrusted upstream header verbatim in a browser response. */
export function catalogHttpFailureStage(status: number, rawStage: string | null): CatalogFailureStage {
  if (status === 401 || status === 403) return "upstream_auth";
  if (status === 503 && rawStage && UPSTREAM_STAGES.has(rawStage as CatalogFailureStage))
    return rawStage as CatalogFailureStage;
  return "upstream_http";
}

export function catalogTransportFailureStage(error: unknown): CatalogFailureStage {
  if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError"))
    return "upstream_timeout";
  return "upstream_network";
}
