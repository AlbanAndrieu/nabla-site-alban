type UnknownRecord = Record<string, unknown>;

export type CircuitBreakerEvidence = {
	provider?: string;
	state?: string;
	failures?: number;
	retryAfterSeconds?: number;
	originSuppressed?: boolean;
	redisShared?: boolean;
};

export type TrueNasApiOperatorEvidence = {
	reachable?: boolean;
	phase?: string;
	stage?: string;
	elapsedMs?: number;
	error?: string;
	exceptionType?: string;
	retryAfterSeconds?: number;
	lastSuccessAt?: string;
	cacheLayer?: string;
	cached?: boolean;
	stale?: boolean;
	refreshInProgress?: boolean;
	redisAvailable?: boolean;
	cacheAgeSeconds?: number;
	circuitBreaker?: CircuitBreakerEvidence;
	usernameVariable?: string;
	apiKeyVariable?: string;
	shadowedUsernameVariables: string[];
	shadowedApiKeyVariables: string[];
};

export type TrueNasTransportStage = {
	id: string;
	label: string;
	state: string;
	elapsedMs?: number;
	detail?: string;
	httpStatus?: number;
	tlsTrusted?: boolean | null;
	failureStage?: string;
	resolved: string[];
};

export type TrueNasTransportEvidence = {
	target?: string;
	pathMode?: string;
	websocketUri?: string;
	verifySsl?: boolean;
	timedOut?: boolean;
	errorKind?: string;
	stages: TrueNasTransportStage[];
};

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function number(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: undefined;
}

function boolean(value: unknown): boolean | undefined {
	return typeof value === "boolean" ? value : undefined;
}

function strings(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter(
				(item): item is string =>
					typeof item === "string" && Boolean(item.trim()),
			)
		: [];
}

function readCircuitBreaker(
	value: unknown,
): CircuitBreakerEvidence | undefined {
	if (!isRecord(value)) return undefined;
	return {
		...(text(value.provider) ? { provider: text(value.provider) } : {}),
		...(text(value.state) ? { state: text(value.state) } : {}),
		...(number(value.failures) !== undefined
			? { failures: number(value.failures) }
			: {}),
		...(number(value.retry_after_seconds) !== undefined
			? { retryAfterSeconds: number(value.retry_after_seconds) }
			: {}),
		...(boolean(value.origin_suppressed) !== undefined
			? { originSuppressed: boolean(value.origin_suppressed) }
			: {}),
		...(boolean(value.redis_shared) !== undefined
			? { redisShared: boolean(value.redis_shared) }
			: {}),
	};
}

export function readTrueNasApiOperatorEvidence(
	value: unknown,
): TrueNasApiOperatorEvidence | undefined {
	if (!isRecord(value)) return undefined;
	const credentials = isRecord(value.credential_selection)
		? value.credential_selection
		: {};
	const circuitBreaker = readCircuitBreaker(value.circuit_breaker);
	return {
		...(boolean(value.reachable) !== undefined
			? { reachable: boolean(value.reachable) }
			: {}),
		...(text(value.phase) ? { phase: text(value.phase) } : {}),
		...(text(value.stage) ? { stage: text(value.stage) } : {}),
		...(number(value.elapsed_ms) !== undefined
			? { elapsedMs: number(value.elapsed_ms) }
			: {}),
		...(text(value.error) ? { error: text(value.error) } : {}),
		...(text(value.exception_type)
			? { exceptionType: text(value.exception_type) }
			: {}),
		...(number(value.retry_after_seconds) !== undefined
			? { retryAfterSeconds: number(value.retry_after_seconds) }
			: {}),
		...(text(value.last_success_at)
			? { lastSuccessAt: text(value.last_success_at) }
			: {}),
		...(text(value.cache_layer) ? { cacheLayer: text(value.cache_layer) } : {}),
		...(boolean(value.cached) !== undefined
			? { cached: boolean(value.cached) }
			: {}),
		...(boolean(value.stale) !== undefined
			? { stale: boolean(value.stale) }
			: {}),
		...(boolean(value.refresh_in_progress) !== undefined
			? { refreshInProgress: boolean(value.refresh_in_progress) }
			: {}),
		...(boolean(value.redis_available) !== undefined
			? { redisAvailable: boolean(value.redis_available) }
			: {}),
		...(number(value.cache_age_seconds) !== undefined
			? { cacheAgeSeconds: number(value.cache_age_seconds) }
			: {}),
		...(circuitBreaker ? { circuitBreaker } : {}),
		...(text(credentials.username_variable)
			? { usernameVariable: text(credentials.username_variable) }
			: {}),
		...(text(credentials.api_key_variable)
			? { apiKeyVariable: text(credentials.api_key_variable) }
			: {}),
		shadowedUsernameVariables: strings(credentials.shadowed_username_variables),
		shadowedApiKeyVariables: strings(credentials.shadowed_api_key_variables),
	};
}

export function readTrueNasTransportEvidence(
	value: unknown,
): TrueNasTransportEvidence | undefined {
	if (!isRecord(value)) return undefined;
	const stages = Array.isArray(value.stages)
		? value.stages.flatMap((item): TrueNasTransportStage[] => {
				if (
					!isRecord(item) ||
					!text(item.id) ||
					!text(item.label) ||
					!text(item.state)
				)
					return [];
				return [
					{
						id: text(item.id) as string,
						label: text(item.label) as string,
						state: text(item.state) as string,
						...(number(item.elapsed_ms) !== undefined
							? { elapsedMs: number(item.elapsed_ms) }
							: {}),
						...(text(item.detail) ? { detail: text(item.detail) } : {}),
						...(number(item.http_status) !== undefined
							? { httpStatus: number(item.http_status) }
							: {}),
						...(typeof item.tls_trusted === "boolean" ||
						item.tls_trusted === null
							? { tlsTrusted: item.tls_trusted }
							: {}),
						...(text(item.failure_stage)
							? { failureStage: text(item.failure_stage) }
							: {}),
						resolved: strings(item.resolved),
					},
				];
			})
		: [];
	return {
		...(text(value.target) ? { target: text(value.target) } : {}),
		...(text(value.path_mode) ? { pathMode: text(value.path_mode) } : {}),
		...(text(value.websocket_uri)
			? { websocketUri: text(value.websocket_uri) }
			: {}),
		...(boolean(value.verify_ssl) !== undefined
			? { verifySsl: boolean(value.verify_ssl) }
			: {}),
		...(boolean(value.timed_out) !== undefined
			? { timedOut: boolean(value.timed_out) }
			: {}),
		...(text(value.error_kind) ? { errorKind: text(value.error_kind) } : {}),
		stages,
	};
}
