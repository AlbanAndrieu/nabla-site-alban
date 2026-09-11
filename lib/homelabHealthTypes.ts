export type VerifiedHomelabHealthState = "ok" | "warn" | "fail";
export type HomelabHealthState = VerifiedHomelabHealthState | "unknown";
export type HomelabProbeSource = "origin" | "memory" | "deadline";

export type HomelabDependencyEvidence = {
	target: string;
	target_name?: string;
	relation_type: string;
	target_state: HomelabHealthState;
	target_effective_state?: HomelabHealthState;
	target_observed_at?: string | null;
	target_observation_age_seconds?: number | null;
	target_observation_stale?: boolean;
	evidence: string[];
	description?: string;
};

export type HomelabRollingProbeEvidence = {
	probe_source?: HomelabProbeSource;
	probe_observed_at?: string | null;
	probe_age_seconds?: number | null;
	probe_stale?: boolean;
	probe_stale_after_seconds?: number;
	probe_interval_seconds?: number;
	next_probe_in_seconds?: number;
	probe_refresh_error?: string;
	last_known_state?: HomelabHealthState | null;
	last_known_reachable?: boolean | null;
	last_known_http_status?: number | null;
	warning?: string;
	timed_out?: boolean;
	error_kind?: string;
};

export type HomelabHealthEntry = HomelabRollingProbeEvidence & {
	id?: string;
	name: string;
	url: string;
	url_derived?: boolean;
	reachable: boolean | null;
	http_status: number;
	state: HomelabHealthState;
	local_state?: HomelabHealthState;
	dependency_state?: HomelabHealthState | null;
	effective_state?: HomelabHealthState;
	required_dependencies?: string[];
	blocked_by?: string[];
	dependency_cycle?: string[];
	dependency_evidence?: HomelabDependencyEvidence[];
	observed_at?: string | null;
	observation_age_seconds?: number | null;
	observation_stale?: boolean;
	tls_trusted?: boolean | null;
	latency_ms?: number;
	error?: string;
	application_error?: string | null;
	tunnel_status?: string | null;
	tunnel_name?: string | null;
	direct_state?: HomelabHealthState | null;
	internal_state?: HomelabHealthState | null;
	runtime_state?: string | null;
	runtime_app?: string | null;
	runtime_reachable?: boolean | null;
	runtime_missing?: boolean;
	runtime_stale?: boolean;
	tunnel_stale?: boolean;
};

export type HomelabInternalHealthEntry = HomelabRollingProbeEvidence & {
	id?: string;
	name: string;
	host: string;
	port: number;
	reachable: boolean | null;
	state: VerifiedHomelabHealthState;
	latency_ms?: number;
	error?: string;
};

export type TrueNasApiHealth = {
	reachable: boolean;
	error?: string;
};

export type TrueNasHealth = {
	state: VerifiedHomelabHealthState;
	public?: HomelabHealthEntry | null;
	internal?: HomelabInternalHealthEntry | null;
	api?: TrueNasApiHealth | null;
	internal_probe_enabled?: boolean;
	verify_ssl?: boolean;
};

export type PfSenseDnsResolverPosture = {
	enabled?: boolean | null;
	running?: boolean | null;
	forwarding?: boolean | null;
	forward_tls_upstream?: boolean | null;
	port?: number | null;
};

export type PfSenseDnsUpstreamPosture = {
	count: number;
	independent_from_truenas?: boolean | null;
	truenas_only?: boolean | null;
};

export type PfSenseSecurityFilterObservation = {
	id: string;
	label: string;
	state: string;
	detail: string;
};

export type PfSenseIngressEndpoint = {
	ip?: string | null;
	port?: number;
	role?: string;
};

export type PfSenseIngressControlPath = {
	mode: string;
	independent_from_wan_filter: boolean;
	blind_spot: boolean;
	detail: string;
};

export type PfSenseIngressBlockObservation = {
	state: string;
	telemetry_available: boolean;
	attribution_available: boolean;
	engine?: string;
	firewall?: string;
	mechanism?: string;
	evidence: string;
	source?: PfSenseIngressEndpoint;
	destination?: PfSenseIngressEndpoint;
	table_entry_count?: number;
	control_path?: PfSenseIngressControlPath;
};

export type PfSenseDnsPosture = {
	configured: boolean;
	reachable: boolean | null;
	policy_state: HomelabHealthState;
	reason: string;
	resolver?: PfSenseDnsResolverPosture;
	upstream?: PfSenseDnsUpstreamPosture;
	security_filters?: PfSenseSecurityFilterObservation[];
	ingress_block?: PfSenseIngressBlockObservation;
	error_stage?: string;
	error?: string;
};

export type HomelabProbeStateCounts = {
	ok?: number;
	warn?: number;
	fail?: number;
};

export type HomelabProbeEvidenceSummary = {
	known?: number;
	fresh?: number;
	cached?: number;
	coverage_percent?: number;
	evidence_ttl_seconds?: number;
	evidence_max_retention_seconds?: number;
};

export type HomelabProbeScopeSummary = {
	scope?: string;
	enabled?: boolean;
	eligible?: number;
	sampled?: number;
	scheduled?: number;
	completed?: number;
	timed_out?: number;
	rotating_sample?: boolean;
	budget_seconds?: number;
	per_probe_timeout_seconds?: number;
	max_concurrency?: number;
	elapsed_ms?: number;
	states?: HomelabProbeStateCounts;
	evidence?: HomelabProbeEvidenceSummary;
};

export type HomelabProbeSampling = {
	strategy?: string;
	cache_ttl_seconds?: number;
};

export type HomelabProbeSummary = {
	public?: HomelabProbeScopeSummary;
	internal?: HomelabProbeScopeSummary;
	catalog_service_count?: number;
	sampling?: HomelabProbeSampling;
};

export type HomelabProbeCache = {
	source?: "origin" | "memory";
	age_seconds?: number;
	ttl_seconds?: number;
	stale?: boolean;
};

export type HomelabHealthBoardMetadata = {
	state: "pending" | "fresh" | "stale";
	refreshing: boolean;
	generated_at: string | null;
	age_seconds?: number;
	retry_after_seconds?: number;
	error?: string | null;
};

export type HomelabReconciliationMetadata = {
	provider_reads_reused?: boolean;
	truenas_runtime_source?: string;
};

export type HomelabHealthSnapshot = {
	schema_version: number;
	checked_at: string;
	refresh_elapsed_ms?: number;
	services: HomelabHealthEntry[];
	truenas?: TrueNasHealth | null;
	internal_probes_enabled?: boolean;
	internal_services?: HomelabInternalHealthEntry[];
	probe_summary?: HomelabProbeSummary;
	probe_cache?: HomelabProbeCache;
	health_board?: HomelabHealthBoardMetadata;
	reconciliation?: HomelabReconciliationMetadata;
	truenas_runtime_reachable?: boolean;
	truenas_runtime_stale?: boolean;
	cloudflare_configured?: boolean;
	cloudflare_tunnels_observed?: number;
	pfsense?: {
		dns?: PfSenseDnsPosture;
	};
};

export type HomelabHealthSource = "fastapi" | "fastapi-probes" | "unavailable";
