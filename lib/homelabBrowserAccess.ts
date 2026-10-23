/** UI-only access hints. Server-side API gates remain authoritative. */
export type HomelabAccessState = "pending" | "trusted" | "readonly" | "denied";
export type HomelabAccessDecision = Exclude<HomelabAccessState, "pending">;

export const ACCESS_RECHECK_MS = 30_000;
export const ACCESS_FOCUS_RECHECK_MS = 2_000;

/** Fail closed on invalid API responses, including a missing mode or trusted flag. */
export function parseHomelabAccessDecision(body: unknown): HomelabAccessDecision {
	if (!body || typeof body !== "object" || Array.isArray(body)) return "denied";
	const result = body as { trusted?: unknown; mode?: unknown };
	if (result.trusted !== true) return "denied";
	if (result.mode === "public-readonly") return "readonly";
	return result.mode === undefined ? "trusted" : "denied";
}

/** Deduplicate simultaneous React gates while bounding how long access may be trusted. */
export function createHomelabAccessProbe(
	fetchDecision: () => Promise<HomelabAccessDecision>,
	now: () => number = Date.now,
) {
	let last: { state: HomelabAccessDecision; checkedAt: number } | null = null;
	let inFlight: Promise<HomelabAccessDecision> | null = null;

	const shouldRecheck = (onFocus = false): boolean => {
		if (inFlight !== null) return true;
		if (last === null) return true;
		const time = now();
		if (!Number.isFinite(time) || time < last.checkedAt) return true;
		return time - last.checkedAt >= (onFocus ? ACCESS_FOCUS_RECHECK_MS : ACCESS_RECHECK_MS);
	};

	const check = (onFocus = false): Promise<HomelabAccessDecision> => {
		if (inFlight !== null) return inFlight;
		if (!shouldRecheck(onFocus) && last !== null) return Promise.resolve(last.state);
		const request = fetchDecision()
			.catch((): HomelabAccessDecision => "denied")
			.then((state) => {
				// No stale OWNER approval survives a failed recheck.
				last = { state, checkedAt: now() };
				return state;
			})
			.finally(() => {
				if (inFlight === request) inFlight = null;
			});
		inFlight = request;
		return request;
	};

	return { shouldRecheck, check };
}
