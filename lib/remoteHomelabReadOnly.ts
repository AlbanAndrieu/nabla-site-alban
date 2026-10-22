/**
 * Temporary anonymous read-only window for already allowlisted Backstage v2
 * projections. NEVER authorize raw OWNER probes, network evidence or mutations.
 * Set HOMELAB_PUBLIC_READONLY_ENABLED=false to restore CIDR/Access-only paths.
 */
const PUBLIC_READONLY_PATHS = new Set([
	"/api/homelab-services",
	"/api/homelab-catalog-v2",
	"/api/homelab-health-v2",
]);

export function publicRemoteReadOnlyEnabled(
	env: Record<string, string | undefined> = process.env,
): boolean {
	const setting = env.HOMELAB_PUBLIC_READONLY_ENABLED;
	return setting === undefined || setting.trim().toLowerCase() === "true";
}

export function allowPublicHomelabProjection(
	request: Request,
	env: Record<string, string | undefined> = process.env,
): boolean {
	const url = new URL(request.url);
	return (
		publicRemoteReadOnlyEnabled(env) &&
		(request.method === "GET" || request.method === "HEAD") &&
		PUBLIC_READONLY_PATHS.has(url.pathname)
	);
}
