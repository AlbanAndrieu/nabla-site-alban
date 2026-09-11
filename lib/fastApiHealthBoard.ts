export type FastApiHealthBoardState = "pending" | "fresh" | "stale";

export type FastApiHealthBoardSnapshot = {
	schema_version: number;
	state: FastApiHealthBoardState;
	refreshing: boolean;
	generated_at: string | null;
	age_seconds?: number;
	retry_after_seconds?: number;
	error?: string | null;
	runtime: unknown | null;
	healthz: unknown | null;
	homelab: unknown | null;
	platform_metrics: unknown | null;
	sickz: unknown | null;
};

export type FastApiHealthBoardLoadResult = {
	board: FastApiHealthBoardSnapshot | null;
	primaryUrl: string;
	error: string | null;
};

export const FASTAPI_HEALTH_BOARD_DEFAULT_API_URL =
	"https://fastapi-sample.fastapicloud.dev/api/health-board";

const HEALTH_BOARD_TIMEOUT_MS = 8_000;
const HEALTH_BOARD_FRESH_CACHE_MS = 5_000;
const HEALTH_BOARD_REFRESHING_CACHE_MS = 2_000;
const HEALTH_BOARD_STALE_CACHE_MS = 1_000;

type HealthBoardCacheEntry = {
	primaryUrl: string;
	expiresAt: number;
	result: FastApiHealthBoardLoadResult;
};

type HealthBoardInFlight = {
	primaryUrl: string;
	promise: Promise<FastApiHealthBoardLoadResult>;
};

let cachedHealthBoard: HealthBoardCacheEntry | null = null;
let inFlightHealthBoard: HealthBoardInFlight | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isState(value: unknown): value is FastApiHealthBoardState {
	return value === "pending" || value === "fresh" || value === "stale";
}

function optionalNonNegativeNumber(
	value: unknown,
): value is number | undefined {
	return (
		value === undefined ||
		(typeof value === "number" && Number.isFinite(value) && value >= 0)
	);
}

export function parseFastApiHealthBoard(
	value: unknown,
): FastApiHealthBoardSnapshot | null {
	if (!isRecord(value)) return null;
	if (
		typeof value.schema_version !== "number" ||
		!Number.isFinite(value.schema_version) ||
		!isState(value.state) ||
		typeof value.refreshing !== "boolean" ||
		(value.generated_at !== null && typeof value.generated_at !== "string") ||
		!optionalNonNegativeNumber(value.age_seconds) ||
		!optionalNonNegativeNumber(value.retry_after_seconds) ||
		(value.error !== undefined &&
			value.error !== null &&
			typeof value.error !== "string")
	) {
		return null;
	}

	return {
		schema_version: value.schema_version,
		state: value.state,
		refreshing: value.refreshing,
		generated_at: value.generated_at,
		...(typeof value.age_seconds === "number"
			? { age_seconds: value.age_seconds }
			: {}),
		...(typeof value.retry_after_seconds === "number"
			? { retry_after_seconds: value.retry_after_seconds }
			: {}),
		...(typeof value.error === "string" || value.error === null
			? { error: value.error }
			: {}),
		runtime: value.runtime ?? null,
		healthz: value.healthz ?? null,
		homelab: value.homelab ?? null,
		platform_metrics: value.platform_metrics ?? null,
		sickz: value.sickz ?? null,
	};
}

export function fastApiHealthBoardCacheTtlMs(
	board: FastApiHealthBoardSnapshot | null,
): number {
	if (!board) return 0;
	if (board.refreshing) return HEALTH_BOARD_REFRESHING_CACHE_MS;
	if (board.state === "fresh") return HEALTH_BOARD_FRESH_CACHE_MS;
	return HEALTH_BOARD_STALE_CACHE_MS;
}

function healthBoardApiUrl(): string {
	return (
		process.env.HOMELAB_HEALTH_BOARD_API_URL?.trim() ||
		FASTAPI_HEALTH_BOARD_DEFAULT_API_URL
	);
}

async function loadFastApiHealthBoardUncached(
	primaryUrl: string,
): Promise<FastApiHealthBoardLoadResult> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), HEALTH_BOARD_TIMEOUT_MS);

	try {
		const response = await fetch(primaryUrl, {
			headers: {
				Accept: "application/json",
				"User-Agent": "nabla-site-health-board/1.0",
			},
			signal: controller.signal,
			cache: "no-store",
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const board = parseFastApiHealthBoard(await response.json());
		if (!board) throw new Error("Invalid FastAPI health board payload");
		return { board, primaryUrl, error: null };
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		console.warn(
			`[health-board] FastAPI aggregate unavailable (${primaryUrl}): ${reason}`,
		);
		return { board: null, primaryUrl, error: reason };
	} finally {
		clearTimeout(timeout);
	}
}

export async function loadFastApiHealthBoard(): Promise<FastApiHealthBoardLoadResult> {
	const primaryUrl = healthBoardApiUrl();
	const now = Date.now();

	if (
		cachedHealthBoard?.primaryUrl === primaryUrl &&
		cachedHealthBoard.expiresAt > now
	) {
		return cachedHealthBoard.result;
	}
	if (inFlightHealthBoard?.primaryUrl === primaryUrl) {
		return inFlightHealthBoard.promise;
	}

	const promise = loadFastApiHealthBoardUncached(primaryUrl).then((result) => {
		const ttlMs = fastApiHealthBoardCacheTtlMs(result.board);
		if (ttlMs > 0) {
			cachedHealthBoard = {
				primaryUrl,
				expiresAt: Date.now() + ttlMs,
				result,
			};
		}
		return result;
	});
	inFlightHealthBoard = { primaryUrl, promise };
	try {
		return await promise;
	} finally {
		if (inFlightHealthBoard?.promise === promise) {
			inFlightHealthBoard = null;
		}
	}
}
