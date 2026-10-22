/** OWNER raw FastAPI endpoints require an authenticated egress channel, not a SERVICE key. */
export const OWNER_BOUNDARY_REASON = "owner-boundary" as const;

export function ownerUpstreamBlocked(
	vercelEnvironment: string | undefined,
	rawOwnerEnabled: string | undefined,
): boolean {
	return Boolean(vercelEnvironment) && rawOwnerEnabled !== "true";
}
