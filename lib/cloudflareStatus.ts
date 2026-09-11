export type CloudflareControlPlaneStatus = {
	present: boolean;
	statusConfirmed: boolean | null;
	state: "ok" | "warn" | "fail" | "unknown";
	reachable: boolean | null;
	apiReachable: boolean | null;
	httpStatus?: number;
	errorKind?: string;
	message?: string;
	warning?: string;
	lastKnownReachable: boolean | null;
	stale: boolean;
	tunnelCount?: number;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: undefined;
}

function nullableBoolean(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null;
}

function healthState(value: unknown): CloudflareControlPlaneStatus["state"] {
	return value === "ok" ||
		value === "warn" ||
		value === "fail" ||
		value === "unknown"
		? value
		: "unknown";
}

export function parseCloudflareControlPlaneStatus(
	payload: unknown,
): CloudflareControlPlaneStatus {
	const root = isRecord(payload) ? payload : {};
	const components = isRecord(root.components) ? root.components : {};
	const raw = isRecord(components.cloudflare) ? components.cloudflare : null;
	if (!raw) {
		return {
			present: false,
			statusConfirmed: null,
			state: "unknown",
			reachable: null,
			apiReachable: null,
			lastKnownReachable: null,
			stale: false,
		};
	}

	return {
		present: true,
		statusConfirmed:
			typeof raw.status_confirmed === "boolean" ? raw.status_confirmed : null,
		state: healthState(raw.state),
		reachable: nullableBoolean(raw.reachable),
		apiReachable: nullableBoolean(raw.api_reachable),
		...(optionalNumber(raw.http_status) !== undefined
			? { httpStatus: optionalNumber(raw.http_status) }
			: {}),
		...(optionalString(raw.error_kind)
			? { errorKind: optionalString(raw.error_kind) }
			: {}),
		...(optionalString(raw.error)
			? { message: optionalString(raw.error) }
			: {}),
		...(optionalString(raw.warning)
			? { warning: optionalString(raw.warning) }
			: {}),
		lastKnownReachable: nullableBoolean(raw.last_known_reachable),
		stale: raw.stale === true,
		...(optionalNumber(raw.tunnel_count) !== undefined
			? { tunnelCount: optionalNumber(raw.tunnel_count) }
			: {}),
	};
}

export function cloudflareStatusIsUnconfirmed(
	status: CloudflareControlPlaneStatus,
): boolean {
	if (!status.present) return true;
	if (status.statusConfirmed === true) return false;
	if (status.statusConfirmed === false) return true;
	if (status.state === "fail" || status.reachable === false) return false;
	return status.state === "unknown" || status.reachable === null;
}

export function cloudflareUnconfirmedReason(
	status: CloudflareControlPlaneStatus,
	french: boolean,
): string {
	if (!status.present) {
		return french
			? "La preuve du plan de contrôle Cloudflare est absente du snapshot FastAPI."
			: "Cloudflare control-plane evidence is missing from the FastAPI snapshot.";
	}
	if (status.errorKind === "empty_inventory") {
		return french
			? "L’API Cloudflare est joignable et authentifiée, mais l’API Tunnel a renvoyé un inventaire vide. Vérifier le compte et le scope du token avant de conclure à une panne."
			: "The Cloudflare API is reachable and authenticated, but the Tunnel API returned an empty inventory. Verify the account and token scope before treating this as an outage.";
	}
	if (status.errorKind === "not_configured") {
		return french
			? "Les identifiants de l’observateur Cloudflare ne sont pas configurés pour cette instance FastAPI."
			: "Cloudflare observer credentials are not configured for this FastAPI instance.";
	}
	if (status.apiReachable === false) {
		return french
			? "L’observateur FastAPI n’a pas pu joindre l’API Cloudflare ; le statut du fournisseur reste inconnu."
			: "The FastAPI observer could not reach the Cloudflare API; provider status remains unknown.";
	}
	if (status.apiReachable === true) {
		return french
			? "L’API Cloudflare a répondu, mais les données reçues ne suffisent pas à confirmer l’état global des tunnels."
			: "The Cloudflare API responded, but the returned evidence is insufficient to confirm global tunnel state.";
	}
	return french
		? "Le statut Cloudflare n’a pas pu être confirmé avec les preuves actuellement disponibles."
		: "Cloudflare status could not be confirmed from the currently available evidence.";
}
