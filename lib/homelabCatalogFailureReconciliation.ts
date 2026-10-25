import { catalogScopeMatches, type CatalogScope } from "./homelabClientAccessBoundary.ts";

type ScopedCatalogData = {
  catalog: unknown | null;
  topology: unknown | null;
  snapshot: unknown | null;
  siteHealth: unknown | null;
  catalogScope: CatalogScope;
};

/** A transient catalog failure may retain data only within its original access scope.
 * An OWNER -> SERVICE transition must also discard its dependent evidence. */
export function reconcileCatalogFailure<T extends ScopedCatalogData>(
  current: T,
  readOnly: boolean,
  revoked: boolean,
): { state: T; retained: boolean } {
  const retained = !revoked && current.catalog !== null &&
    catalogScopeMatches(current.catalogScope, readOnly);
  if (retained) return { state: current, retained: true };
  return {
    state: { ...current, catalog: null, topology: null, snapshot: null, siteHealth: null },
    retained: false,
  };
}
