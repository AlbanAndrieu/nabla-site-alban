/**
 * Run a test under an explicit HOMELAB_PUBLIC_READONLY_ENABLED mode.
 *
 * The temporary public read-only window defaults to enabled; owner-boundary
 * contracts must assert the closed mode explicitly instead of relying on it.
 */
export async function withPublicReadOnly<T>(
	enabled: boolean,
	run: () => Promise<T>,
): Promise<T> {
	const original = process.env.HOMELAB_PUBLIC_READONLY_ENABLED;
	process.env.HOMELAB_PUBLIC_READONLY_ENABLED = enabled ? "true" : "false";
	try {
		return await run();
	} finally {
		if (original === undefined)
			delete process.env.HOMELAB_PUBLIC_READONLY_ENABLED;
		else process.env.HOMELAB_PUBLIC_READONLY_ENABLED = original;
	}
}
