/**
 * Only an already-verified OWNER browser request may reach these server routes.
 * The existing FastAPI diagnostics key authenticates Vercel's outbound request.
 * Setting HOMELAB_OWNER_RAW_UPSTREAM_ENABLED=false explicitly disables this path.
 */
export const OWNER_BOUNDARY_REASON = "owner-boundary" as const;

export function ownerUpstreamBlocked(
	vercelEnvironment: string | undefined,
	rawOwnerEnabled: string | undefined,
	diagnosticsKey?: string,
): boolean {
	if (rawOwnerEnabled === "false") return true;
	// Remote FastAPI temporarily permits off-LAN OWNER only with a valid key.
	// Never let Vercel egress behave as a human/home CIDR by itself.
	return Boolean(vercelEnvironment) && !diagnosticsKey?.trim();
}

export function ownerDiagnosticHeaders(key: string | undefined): Record<string, string> {
	const trimmed = key?.trim();
	return trimmed ? { "X-Diagnostics-Key": trimmed } : {};
}
