import type { HomelabService } from "@/lib/homelabServices";
import type { ServiceTopology } from "@/lib/serviceTopology";

export type ArchitectureEntity = {
	id: string;
	name: string;
	kind: string;
	category: string;
	url?: string;
	detail?: string;
	icon?: string;
	layer?: number;
};

export type ArchitectureRelation = {
	source: string;
	target: string;
	type: string;
	optional?: boolean;
};

export const AI_ENTITIES: ArchitectureEntity[] = [
	{ id: "openwebui", name: "Open WebUI", kind: "interface", category: "interfaces", layer: 0 },
	{ id: "openclaw", name: "OpenClaw", kind: "agent", category: "interfaces", layer: 0 },
	{ id: "opencode", name: "OpenCode", kind: "coding-agent", category: "interfaces", layer: 0 },
	{ id: "codex", name: "Codex", kind: "coding-agent", category: "interfaces", layer: 0 },
	{ id: "cursor", name: "Cursor", kind: "coding-agent", category: "interfaces", layer: 0 },
	{ id: "litellm", name: "LiteLLM", kind: "model-gateway", category: "control-plane", layer: 1 },
	{ id: "redis", name: "Redis", kind: "cache", category: "control-plane", layer: 1 },
	{ id: "ollama", name: "Ollama", kind: "local-inference", category: "inference", layer: 2 },
	{ id: "openai", name: "OpenAI API", kind: "remote-inference", category: "inference", layer: 2, url: "https://platform.openai.com" },
	{ id: "fastapi-mcp", name: "FastAPI MCP", kind: "mcp-server", category: "tools", layer: 3, url: "https://fastapi-sample.fastapicloud.dev/api" },
	{ id: "open-terminal", name: "Open Terminal", kind: "agent-tool", category: "tools", layer: 3 },
	{ id: "openrag", name: "OpenRAG", kind: "rag", category: "tools", layer: 3, url: "https://github.com/langflow-ai/openrag" },
	{ id: "searxng", name: "SearXNG", kind: "search", category: "tools", layer: 3 },
	{ id: "paperless", name: "Paperless-ngx", kind: "knowledge", category: "tools", layer: 3, url: "https://docs.paperless-ngx.com/" },
	{ id: "n8n", name: "n8n", kind: "workflow", category: "orchestration", layer: 4 },
	{ id: "temporal", name: "Temporal", kind: "workflow", category: "orchestration", layer: 4, url: "https://temporal.io/" },
	{ id: "langflow", name: "Langflow", kind: "workflow", category: "orchestration", layer: 4 },
	{ id: "langfuse", name: "Langfuse", kind: "llm-observability", category: "observability", layer: 5 },
	{ id: "opik", name: "Opik", kind: "evaluation", category: "observability", layer: 5, url: "https://www.comet.com/docs/opik/" },
	{ id: "prometheus", name: "Prometheus", kind: "metrics", category: "observability", layer: 5 },
];

export const AI_RELATIONS: ArchitectureRelation[] = [
	...(["openwebui", "openclaw", "opencode", "codex", "cursor"] as const).map((source) => ({
		source,
		target: "litellm",
		type: "model requests",
	})),
	{ source: "litellm", target: "redis", type: "cache", optional: true },
	{ source: "litellm", target: "ollama", type: "routesTo" },
	{ source: "litellm", target: "openai", type: "routesTo", optional: true },
	{ source: "litellm", target: "langfuse", type: "telemetry", optional: true },
	{ source: "litellm", target: "prometheus", type: "metrics", optional: true },
	{ source: "openwebui", target: "fastapi-mcp", type: "tool calls", optional: true },
	{ source: "openwebui", target: "openrag", type: "RAG", optional: true },
	{ source: "fastapi-mcp", target: "open-terminal", type: "tool boundary", optional: true },
	{ source: "fastapi-mcp", target: "searxng", type: "search", optional: true },
	{ source: "paperless", target: "openrag", type: "knowledge flow", optional: true },
	{ source: "n8n", target: "fastapi-mcp", type: "automates", optional: true },
	{ source: "temporal", target: "paperless", type: "document workflow", optional: true },
	{ source: "langflow", target: "openrag", type: "workflow" },
	{ source: "openrag", target: "langfuse", type: "traces", optional: true },
	{ source: "openrag", target: "opik", type: "evaluation", optional: true },
];

export const NABLA_EXTERNAL_ENTITIES: ArchitectureEntity[] = [
	{ id: "github", name: "GitHub", kind: "scm", category: "collaboration", url: "https://github.com/AlbanAndrieu" },
	{ id: "gitlab", name: "GitLab", kind: "scm", category: "collaboration", url: "https://gitlab.com/AlbanAndrieu" },
	{ id: "jira", name: "Jira", kind: "project-management", category: "collaboration", url: "https://www.atlassian.com/software/jira" },
	{ id: "asana", name: "Asana", kind: "project-management", category: "collaboration", url: "https://asana.com" },
	{ id: "slack", name: "Slack", kind: "collaboration", category: "collaboration", url: "https://slack.com" },
	{ id: "notion", name: "Notion", kind: "knowledge", category: "collaboration", url: "https://app.notion.com/p/albandrieu/Getting-Started-d588a6b720254a7baebd45357e8315a3" },
	{ id: "reactive-resume", name: "Reactive Resume", kind: "application", category: "portfolio", url: "https://reactive-resume.albandrieu.com" },
	{ id: "fastapi-cloud", name: "FastAPI Cloud", kind: "application-platform", category: "platform", url: "https://fastapi-sample.fastapicloud.dev/api" },
	{ id: "docker-hub", name: "Docker Hub / Nabla", kind: "registry", category: "platform", url: "https://hub.docker.com/u/nabla" },
	{ id: "ansible", name: "Ansible", kind: "configuration", category: "platform", url: "https://github.com/AlbanAndrieu" },
];

const TOPOLOGY_ID_BY_NAME: Record<string, string> = {
	"Open WebUI": "openwebui",
	LiteLLM: "litellm",
	Ollama: "ollama",
	Langfuse: "langfuse",
	Langflow: "langflow",
	Elasticsearch: "elasticsearch",
	Redis: "redis",
	ClickHouse: "clickhouse",
	MinIO: "minio",
	Prometheus: "prometheus",
	Traefik: "traefik",
	n8n: "n8n",
};

function serviceId(service: HomelabService): string {
	const explicit = typeof service.id === "string" ? service.id : undefined;
	if (explicit) return explicit;
	const mapped = TOPOLOGY_ID_BY_NAME[service.name];
	if (mapped) return mapped;
	if (service.tunnelUrl) {
		try {
			return new URL(service.tunnelUrl).hostname.split(".")[0] || service.name;
		} catch {
			// Fall through to a stable name slug for legacy fallback records.
		}
	}
	return service.name
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function serviceUrl(service: HomelabService): string | undefined {
	if (service.external && service.tunnelUrl) return service.tunnelUrl;
	if (!service.internalHost || !service.internalPort) return undefined;
	return `${service.internalSecure ? "https" : "http"}://${service.internalHost}:${service.internalPort}`;
}

export function buildNablaEntities(
	services: HomelabService[],
	topology: ServiceTopology,
): ArchitectureEntity[] {
	const entities = new Map<string, ArchitectureEntity>();

	for (const service of services) {
		const id = serviceId(service);
		entities.set(id, {
			id,
			name: service.name,
			kind: "homelab-service",
			category: "homelab",
			url: serviceUrl(service),
			detail: service.external ? "public endpoint" : "private/internal endpoint",
		});
	}
	for (const node of topology.nodes) {
		const current = entities.get(node.id);
		entities.set(node.id, {
			id: node.id,
			name: current?.name ?? node.name,
			kind: node.kind,
			category: node.category,
			url: current?.url ?? node.url,
			detail: node.description ?? current?.detail,
			icon: node.icon ?? current?.icon,
		});
	}
	for (const entity of NABLA_EXTERNAL_ENTITIES) entities.set(entity.id, entity);

	return [...entities.values()];
}

export function buildNablaRelations(topology: ServiceTopology): ArchitectureRelation[] {
	return topology.relations.map((relation) => ({
		source: relation.source,
		target: relation.target,
		type: relation.type,
		optional: relation.strength === "optional",
	}));
}
