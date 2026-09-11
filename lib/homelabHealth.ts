import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
} from "./homelabHealthTypes";
import { normalizeHomelabHealthUrl } from "./homelabHealthValidation";

export { parseHomelabHealthSnapshot } from "./homelabHealthParser";
export {
	HOMELAB_HEALTH_DEFAULT_API_URL,
	HOMELAB_PROBES_DEFAULT_API_URL,
	loadHomelabHealthSnapshot,
	loadHomelabProbeSnapshot,
} from "./homelabHealthTransport";
export * from "./homelabHealthTypes";
export { normalizeHomelabHealthUrl } from "./homelabHealthValidation";

export function homelabHealthForUrl(
	snapshot: HomelabHealthSnapshot | null,
	url?: string,
): HomelabHealthEntry | undefined {
	const normalized = normalizeHomelabHealthUrl(url);
	if (!snapshot || !normalized) return undefined;
	return snapshot.services.find(
		(entry) => normalizeHomelabHealthUrl(entry.url) === normalized,
	);
}
