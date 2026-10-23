/** Shared runtime guards for untrusted JSON payloads. */
export type UnknownRecord = Record<string, unknown>;

/** A plain JSON object: excludes `null` and arrays. */
export function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
