/** Do not attach legacy name/URL-only observations to canonical Backstage v2 identities. */
export function compatibleHomelabEvidence<T extends { id?: string }>(
	entityRef: unknown,
	serviceId: string,
	evidence: T | undefined,
): T | undefined {
	if (typeof entityRef === "string" && evidence?.id !== serviceId) {
		return undefined;
	}
	return evidence;
}

/** Never pick an arbitrary observation when FastAPI publishes duplicate keys. */
export type UniqueHomelabEvidenceIndex<T> = {
  byId: Map<string, T>;
  byName: Map<string, T>;
  byUrl: Map<string, T>;
  ambiguousIds: Set<string>;
};

export function uniqueHomelabEvidenceIndex<T extends {
  id?: string;
  name: string;
  url?: string;
}>(entries: readonly T[]): UniqueHomelabEvidenceIndex<T> {
  const byId = new Map<string, T>();
  const byName = new Map<string, T>();
  const byUrl = new Map<string, T>();
  const ambiguousIds = new Set<string>();
  const ambiguousNames = new Set<string>();
  const ambiguousUrls = new Set<string>();
  const addUnique = (
    map: Map<string, T>, ambiguous: Set<string>, key: string | undefined, entry: T,
  ) => {
    if (!key || ambiguous.has(key)) return;
    if (map.has(key)) {
      map.delete(key);
      ambiguous.add(key);
    } else {
      map.set(key, entry);
    }
  };

  for (const entry of entries) {
    addUnique(byId, ambiguousIds, entry.id, entry);
    addUnique(byName, ambiguousNames, entry.name.trim().toLowerCase(), entry);
    try {
      const url = new URL(entry.url ?? "");
      url.hash = "";
      addUnique(byUrl, ambiguousUrls, url.href, entry);
    } catch {
      // Malformed URLs cannot establish an identity.
    }
  }
  return { byId, byName, byUrl, ambiguousIds };
}
