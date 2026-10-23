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
