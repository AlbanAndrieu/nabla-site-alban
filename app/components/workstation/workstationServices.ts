export type WorkstationService = Readonly<{
	key: string;
	name: string;
	href?: string;
	port: string;
	iconClassName: string;
	actionTone?: "primary" | "secondary";
	disabled?: boolean;
}>;

export type WorkstationSection = Readonly<{
	key: string;
	id: string;
	iconClassName: string;
	alternate?: boolean;
	services: readonly WorkstationService[];
}>;

export const WORKSTATION_SECTIONS: readonly WorkstationSection[] = [
	{
		key: "edge",
		id: "edge-heading",
		iconClassName: "fas fa-shield-halved",
		services: [
			{
				key: "traefik",
				name: "Traefik",
				href: "http://localhost:80",
				port: ":80 / :443",
				iconClassName: "fas fa-route",
			},
			{
				key: "portainer",
				name: "Portainer",
				href: "https://localhost:9443",
				port: ":9443",
				iconClassName: "fas fa-server",
			},
			{
				key: "dockge",
				name: "Dockge",
				href: "http://localhost:5001",
				port: ":5001",
				iconClassName: "fas fa-cubes",
			},
			{
				key: "watchtower",
				name: "Watchtower",
				port: "—",
				iconClassName: "fas fa-arrows-rotate",
				actionTone: "secondary",
				disabled: true,
			},
		],
	},
	{
		key: "observability",
		id: "obs-heading",
		iconClassName: "fas fa-chart-line",
		alternate: true,
		services: [
			{
				key: "grafana",
				name: "Grafana",
				href: "http://localhost:3009",
				port: ":3009",
				iconClassName: "fas fa-chart-area",
			},
			{
				key: "prometheus",
				name: "Prometheus",
				href: "http://localhost:9090",
				port: ":9090",
				iconClassName: "fas fa-database",
			},
			{
				key: "loki",
				name: "Loki",
				href: "http://localhost:3100",
				port: ":3100",
				iconClassName: "fas fa-stream",
			},
			{
				key: "graylog",
				name: "Graylog",
				href: "http://localhost:9000/",
				port: ":9000",
				iconClassName: "fas fa-magnifying-glass-chart",
			},
			{
				key: "jaeger",
				name: "Jaeger",
				href: "http://localhost:16686",
				port: ":16686",
				iconClassName: "fas fa-project-diagram",
			},
			{
				key: "githubExporter",
				name: "GitHub exporter",
				href: "http://localhost:9171/metrics",
				port: ":9171",
				iconClassName: "fab fa-github",
			},
			{
				key: "pyroscope",
				name: "Pyroscope",
				href: "http://localhost:4040",
				port: ":4040",
				iconClassName: "fas fa-fire",
			},
			{
				key: "cadvisor",
				name: "cAdvisor",
				href: "http://localhost:9092",
				port: ":9092",
				iconClassName: "fas fa-gauge-high",
			},
		],
	},
	{
		key: "nabla",
		id: "nabla-stack-heading",
		iconClassName: "fas fa-layer-group",
		services: [
			{
				key: "backend",
				name: "Backend API",
				href: "http://localhost:3003",
				port: ":3003",
				iconClassName: "fas fa-code",
			},
			{
				key: "frontend",
				name: "Frontend",
				href: "http://localhost:3001",
				port: ":3001",
				iconClassName: "fas fa-window-maximize",
			},
			{
				key: "jupyter",
				name: "Jupyter",
				href: "http://localhost:8889",
				port: ":8889",
				iconClassName: "fas fa-book",
			},
		],
	},
	{
		key: "utilities",
		id: "tools-heading",
		iconClassName: "fas fa-toolbox",
		alternate: true,
		services: [
			{
				key: "vaultwarden",
				name: "Vaultwarden",
				href: "http://127.0.0.1:8007",
				port: ":8007",
				iconClassName: "fas fa-key",
			},
			{
				key: "uptimeKuma",
				name: "Uptime Kuma",
				href: "http://localhost:3011",
				port: ":3011",
				iconClassName: "fas fa-heartbeat",
			},
			{
				key: "porttracker",
				name: "PortTracker",
				href: "http://localhost:4999",
				port: ":4999",
				iconClassName: "fas fa-network-wired",
			},
			{
				key: "stirlingPdf",
				name: "Stirling PDF",
				href: "http://localhost:8085",
				port: ":8085",
				iconClassName: "fas fa-file-pdf",
			},
			{
				key: "convertx",
				name: "ConvertX",
				href: "http://localhost:3444",
				port: ":3444",
				iconClassName: "fas fa-exchange-alt",
			},
			{
				key: "languageTool",
				name: "LanguageTool",
				href: "http://localhost:8010/v2/languages",
				port: ":8010",
				iconClassName: "fas fa-spell-check",
			},
			{
				key: "litellm",
				name: "LiteLLM",
				href: "http://localhost:4100/ui/login/",
				port: ":4100",
				iconClassName: "fas fa-robot",
			},
			{
				key: "mcpInspector",
				name: "MCP Inspector",
				href: "http://127.0.0.1:6274",
				port: ":6274",
				iconClassName: "fas fa-bug",
			},
			{
				key: "temporal",
				name: "Temporal",
				href: "http://localhost:8005",
				port: ":8005 · :7238",
				iconClassName: "fas fa-clock",
			},
		],
	},
	{
		key: "data",
		id: "data-heading",
		iconClassName: "fas fa-database",
		services: [
			{
				key: "postgresql",
				name: "PostgreSQL",
				href: "tcp://localhost:5432",
				port: ":5432",
				iconClassName: "fas fa-plug",
				actionTone: "secondary",
			},
			{
				key: "pgbouncer",
				name: "PgBouncer",
				href: "tcp://localhost:6432",
				port: ":6432",
				iconClassName: "fas fa-link",
				actionTone: "secondary",
			},
			{
				key: "postgresqlStandby",
				name: "PostgreSQL standby",
				href: "tcp://localhost:5433",
				port: ":5433",
				iconClassName: "fas fa-copy",
				actionTone: "secondary",
			},
			{
				key: "neo4j",
				name: "Neo4j Browser",
				href: "http://localhost:7474",
				port: ":7474 · Bolt :7687",
				iconClassName: "fas fa-circle-nodes",
			},
		],
	},
	{
		key: "network",
		id: "net-heading",
		iconClassName: "fas fa-wifi",
		alternate: true,
		services: [
			{
				key: "ntopng",
				name: "ntopng",
				href: "http://localhost:4000",
				port: ":4000",
				iconClassName: "fas fa-chart-pie",
			},
			{
				key: "netalertx",
				name: "NetAlertX",
				href: "http://localhost:20211",
				port: ":20211",
				iconClassName: "fas fa-tower-broadcast",
			},
			{
				key: "scrutiny",
				name: "Scrutiny",
				port: "—",
				iconClassName: "fas fa-hard-drive",
				actionTone: "secondary",
				disabled: true,
			},
		],
	},
	{
		key: "sentry",
		id: "sentry-heading",
		iconClassName: "fas fa-life-ring",
		services: [
			{
				key: "web",
				name: "Sentry web",
				href: "http://localhost:9000",
				port: ":9000",
				iconClassName: "fas fa-triangle-exclamation",
			},
		],
	},
];

export const WORKSTATION_BOM = {
	reused: [
		{
			name: "Workstation",
			href: "https://www.amazon.fr/dp/B0C3T39N6P",
			details:
				"Intel Core i7-9700K + ASUS ROG STRIX Z390-F GAMING + Samsung 860 EVO M.2 500 Go. 767,77 €",
			iconClassName: "fas fa-server",
		},
		{
			name: "Gigabyte GeForce RTX 2060",
			href: "https://www.amazon.fr/dp/B0C3T39N6P",
			details: "3.8 GHz, 32 MB L3. 212.75 €",
			iconClassName: "fas fa-microchip",
		},
	],
	purchases: [
		{
			name: "Storage",
			details: "2× Seagate BarraCuda — 2 TB each, SATA 6 Gb/s. 2×109,99 €",
			iconClassName: "fas fa-hdd",
		},
	],
} as const;
