import type { OperationalHealthState } from "./homelabOperationalEvidenceTypes";

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function optionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function optionalNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: undefined;
}

export function optionalBoolean(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null;
}

export function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
		: [];
}

export function healthState(value: unknown): OperationalHealthState | null {
	return value === "ok" || value === "warn" || value === "fail" || value === "unknown"
		? value
		: null;
}
