export type PfSenseEndpointEvidence = {
	observed: boolean;
	error?: string;
};

export type PfSenseObservedService = {
	identity: string;
	runtime_state: string;
};

export type PfSenseServiceSummary = {
	running?: number;
	stopped?: number;
	unknown?: number;
	total?: number;
};

export type PfSenseCacheEvidence = {
	cache_layer?: string;
	cached?: boolean;
	stale?: boolean;
	refresh_in_progress?: boolean;
	redis_available?: boolean;
	cache_age_seconds?: number;
};

export type PfSenseOperatorEvidence = {
	api_evidence_state?: string;
	successful_endpoint_count?: number;
	endpoint_count?: number;
	endpoint_status?: Record<string, PfSenseEndpointEvidence>;
	services_observed?: boolean;
	services?: PfSenseObservedService[];
	service_summary?: PfSenseServiceSummary;
	stale?: boolean;
	last_good_available?: boolean;
	refresh_error?: string;
	refresh_error_stage?: string;
	cache?: PfSenseCacheEvidence;
};
