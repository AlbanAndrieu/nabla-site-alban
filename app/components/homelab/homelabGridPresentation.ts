import type { HomelabHealthEntry, HomelabHealthSnapshot, HomelabHealthState } from "@/lib/homelabHealth";
import { reconcileHomelabHealth } from "@/lib/homelabHealthReconciliation";
import { type HomelabService, homelabServiceId } from "@/lib/homelabServices";

type HealthIndex = {
	byId: Map<string, HomelabHealthEntry>;
	byUrl: Map<string, HomelabHealthEntry>;
	byName: Map<string, HomelabHealthEntry>;
};

type RuntimePresentationState = HomelabHealthState | "missing";
type EffectiveHealthLabelKey =
	| "health.states.ok"
	| "health.states.warn"
	| "health.states.fail"
	| "health.states.unknown";

export const EFFECTIVE_HEALTH_LABEL_KEY: Record<
	HomelabHealthState,
	EffectiveHealthLabelKey
> = {
	ok: "health.states.ok",
	warn: "health.states.warn",
	fail: "health.states.fail",
	unknown: "health.states.unknown",
};

export const EFFECTIVE_HEALTH_ICON_CLASS: Record<HomelabHealthState, string> = {
	ok: "fas fa-circle-check",
	warn: "fas fa-triangle-exclamation",
	fail: "fas fa-circle-xmark",
	unknown: "fas fa-circle-question",
};

export const INTERNAL_HEALTH_CLASS: Record<HomelabHealthState, string> = {
	ok: "btn-outline-success",
	warn: "btn-outline-warning",
	fail: "btn-outline-danger",
	unknown: "btn-outline-secondary",
};

export const RUNTIME_ICON_CLASS: Record<RuntimePresentationState, string> = {
	ok: "fas fa-circle-check",
	warn: "fas fa-triangle-exclamation",
	fail: "fas fa-circle-xmark",
	unknown: "fas fa-circle-question",
	missing: "fas fa-skull-crossbones",
};

export function serviceIconPath(iconSrc?: string): string {
	if (!iconSrc) return "/assets/selfh-icons/generic-app.svg";
	if (/^https?:\/\//i.test(iconSrc)) return iconSrc;
	return `/${iconSrc}`;
}

export function endpointUrlHostIsPrivateS3(value?: string): boolean {
	try {
		return new URL(value ?? "").hostname === "s3.int.albandrieu.com";
	} catch {
		return false;
	}
}

function normalizedName(value: string): string {
	return value.trim().toLowerCase();
}

export function healthIndex(snapshot: HomelabHealthSnapshot | null): HealthIndex {
	const byId = new Map<string, HomelabHealthEntry>();
	const byUrl = new Map<string, HomelabHealthEntry>();
	const byName = new Map<string, HomelabHealthEntry>();
	for (const entry of snapshot?.services ?? []) {
		if (entry.id) byId.set(entry.id, entry);
		byName.set(normalizedName(entry.name), entry);
		try {
			const url = new URL(entry.url);
			url.hash = "";
			byUrl.set(url.href, entry);
		} catch {
			// The same-origin proxy validates FastAPI payloads; ignore malformed extras defensively.
		}
	}
	return { byId, byUrl, byName };
}

function lookupHealth(
	index: HealthIndex,
	service: HomelabService,
	url: string,
): HomelabHealthEntry | undefined {
	const stableId = homelabServiceId(service);
	const byId = index.byId.get(stableId);
	if (byId) return byId;

	try {
		const normalized = new URL(url);
		normalized.hash = "";
		const byUrl = index.byUrl.get(normalized.href);
		if (byUrl) return byUrl;
	} catch {
		// Continue with the name fallback below.
	}

	return index.byName.get(normalizedName(service.name));
}

export function serviceHealthEvidence(
	index: HealthIndex,
	service: HomelabService,
	url: string,
	snapshot: HomelabHealthSnapshot | null,
): HomelabHealthEntry | undefined {
	const generic = lookupHealth(index, service, url);
	if (homelabServiceId(service) !== "truenas" || !snapshot?.truenas?.public) {
		return generic;
	}

	const publicHealth = snapshot.truenas.public;
	return {
		...generic,
		...publicHealth,
		id: generic?.id ?? publicHealth.id ?? "truenas",
		name: generic?.name ?? publicHealth.name,
		url: publicHealth.url,
		// The clickable TrueNAS line represents only the direct public :7000
		// endpoint. Dependency/runtime health is deliberately kept out of this
		// navigation signal and remains visible through dedicated warnings.
		state: publicHealth.state,
		local_state: publicHealth.state,
		dependency_state: null,
		effective_state: publicHealth.state,
		required_dependencies: [],
		blocked_by: [],
		dependency_evidence: [],
		direct_state: publicHealth.state,
		internal_state:
			generic?.internal_state ?? snapshot.truenas.internal?.state ?? null,
	};
}

export function reconciledHealth(
	entry: HomelabHealthEntry | undefined,
	service: HomelabService,
	schemaVersion?: number,
): HomelabHealthEntry | undefined {
	if (!entry) return undefined;
	// Schema v4+ is already reconciled server-side from HTTP, TrueNAS runtime,
	// internal probes, Cloudflare and (from v5) required dependencies. Do not
	// apply a second browser policy that could contradict the authoritative state.
	if ((schemaVersion ?? 0) >= 4) return entry;

	const reconciliation = reconcileHomelabHealth(entry, {
		external: service.external === true,
		tunnelExpected: service.tunnelSecure === true,
	});
	return { ...entry, state: reconciliation.state };
}

function runtimeHealthState(state?: string | null): HomelabHealthState | null {
	const normalized = state?.trim().toUpperCase();
	if (!normalized) return null;
	if (["ACTIVE", "HEALTHY", "RUNNING", "STARTED", "UP"].includes(normalized)) {
		return "ok";
	}
	if (
		[
			"CRASHED",
			"DEPLOYING",
			"DOWN",
			"ERROR",
			"FAILED",
			"STOPPED",
			"STOPPING",
		].includes(normalized)
	) {
		return "fail";
	}
	return "warn";
}

export function internalPresentationState(
	entry: HomelabHealthEntry | undefined,
	runtimeStale: boolean,
): HomelabHealthState {
	return (
		entry?.internal_state ??
		(runtimeStale ? null : runtimeHealthState(entry?.runtime_state)) ??
		entry?.local_state ??
		entry?.state ??
		"unknown"
	);
}

export function runtimePresentationState(
	entry: HomelabHealthEntry | undefined,
	dependsOnTrueNas: boolean,
	serviceId: string,
	runtimeUnavailable: boolean,
	runtimeStale: boolean,
): RuntimePresentationState | null {
	if (!dependsOnTrueNas || serviceId === "truenas") return null;
	if (
		runtimeUnavailable ||
		runtimeStale ||
		entry?.runtime_stale === true ||
		entry?.runtime_reachable === false
	) {
		return "missing";
	}
	return runtimeHealthState(entry?.runtime_state) ?? "missing";
}
