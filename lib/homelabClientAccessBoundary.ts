/** Client-side presentation isolation; server route access checks remain authoritative. */
export type CatalogScope = "owner" | "public" | null;
export type CatalogFailureReason = "key-missing" | "access-denied" | "unavailable";
export type CatalogFailurePolicy = { reason: CatalogFailureReason; revokePublicCache: boolean };

/** An authorization or configuration denial is not an offline connectivity error. */
export function classifyCatalogFailure(status: number, body: unknown): CatalogFailurePolicy {
  const raw = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>).reason : null;
  const reason: CatalogFailureReason = raw === "key-missing" || raw === "access-denied"
    ? raw : "unavailable";
  return {
    reason,
    revokePublicCache: status === 401 || status === 403 || status === 404 ||
      reason === "key-missing" || reason === "access-denied",
  };
}

/** Synchronous render-time guard against an access mode changing before effect cleanup. */
export function catalogScopeMatches(scope: CatalogScope, readOnly: boolean): boolean {
  return scope === (readOnly ? "public" : "owner");
}
