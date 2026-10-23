/** Declared criticality levels shared by the catalog, topology and cards. */
export const SERVICE_CRITICALITY_LEVELS = [
	"critical",
	"high",
	"medium",
	"low",
] as const;

export type ServiceCriticalityLevel =
	(typeof SERVICE_CRITICALITY_LEVELS)[number];

export function isServiceCriticalityLevel(
	value: unknown,
): value is ServiceCriticalityLevel {
	return (SERVICE_CRITICALITY_LEVELS as readonly unknown[]).includes(value);
}
