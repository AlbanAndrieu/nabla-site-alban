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
/** Do not show an incident unless both fields match allowlisted shapes. */
export function parseOwnerCatalogIncident(
  stage: unknown,
  requestId: unknown,
): { stage: CatalogFailureStage; requestId: string } | null {
  if (typeof stage !== "string" ||
      !([...UPSTREAM_STAGES, "site_configuration"] as string[]).includes(stage) ||
      typeof requestId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) return null;
  return { stage: stage as CatalogFailureStage, requestId };
}
