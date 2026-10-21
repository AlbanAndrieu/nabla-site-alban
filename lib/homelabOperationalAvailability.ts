/** Only sanitized operational evidence outcomes may be shown in owner UI. */
export type OperationalEvidenceFailure =
	| "owner-boundary"
	| "access-denied"
	| "upstream-unavailable";

export function operationalEvidenceFailure(
	httpStatus: number,
	body: unknown,
): OperationalEvidenceFailure {
	if (httpStatus === 404) return "access-denied";
	if (
		httpStatus === 503 &&
		typeof body === "object" &&
		body !== null &&
		!Array.isArray(body) &&
		"reason" in body &&
		body.reason === "owner-boundary"
	) {
		return "owner-boundary";
	}
	return "upstream-unavailable";
}
