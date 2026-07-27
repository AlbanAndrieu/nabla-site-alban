export type ResourceLink = { label: string; href: string };
export type ResourceSection = {
	key: string;
	icon: string;
	links: ResourceLink[];
};

export const AI_RESOURCE_SECTIONS: ResourceSection[] = [
	{
		key: "apis",
		icon: "fa-comments",
		links: [
			{ label: "OpenAI", href: "https://platform.openai.com/" },
			{ label: "Anthropic Claude", href: "https://www.anthropic.com/" },
			{ label: "Google Gemini", href: "https://ai.google.dev/" },
			{ label: "Mistral AI", href: "https://mistral.ai/" },
			{ label: "Groq", href: "https://groq.com/" },
			{
				label: "Azure OpenAI",
				href: "https://azure.microsoft.com/products/ai-services/openai-service",
			},
		],
	},
	{
		key: "coding",
		icon: "fa-code",
		links: [
			{ label: "GitHub Copilot", href: "https://github.com/features/copilot" },
			{ label: "Cursor", href: "https://www.cursor.com/" },
			{
				label: "Amazon Q Developer",
				href: "https://aws.amazon.com/q/developer/",
			},
			{ label: "Continue", href: "https://www.continue.dev/" },
		],
	},
	{
		key: "rag",
		icon: "fa-database",
		links: [
			{ label: "LangChain", href: "https://www.langchain.com/" },
			{ label: "pgvector", href: "https://github.com/pgvector/pgvector" },
			{ label: "Elasticsearch", href: "https://www.elastic.co/elasticsearch" },
			{ label: "Hugging Face", href: "https://huggingface.co/" },
		],
	},
	{
		key: "agents",
		icon: "fa-gears",
		links: [
			{ label: "n8n", href: "https://n8n.io/" },
			{ label: "LangGraph", href: "https://www.langchain.com/langgraph" },
			{ label: "CrewAI", href: "https://www.crewai.com/" },
			{ label: "Temporal", href: "https://temporal.io/" },
		],
	},
	{
		key: "observability",
		icon: "fa-chart-line",
		links: [
			{ label: "Langfuse", href: "https://langfuse.com/" },
			{ label: "Weights & Biases", href: "https://wandb.ai/" },
			{ label: "OpenTelemetry", href: "https://opentelemetry.io/" },
			{ label: "Opik", href: "https://www.comet.com/site/products/opik/" },
		],
	},
	{
		key: "local",
		icon: "fa-server",
		links: [
			{ label: "Ollama", href: "https://ollama.com/" },
			{ label: "LiteLLM", href: "https://www.litellm.ai/" },
			{ label: "vLLM", href: "https://vllm.ai/" },
			{ label: "LocalAI", href: "https://localai.io/" },
		],
	},
];

export const SECURITY_RESOURCE_SECTIONS: ResourceSection[] = [
	{
		key: "owasp",
		icon: "fa-shield-halved",
		links: [
			{ label: "OWASP Top 10", href: "https://owasp.org/www-project-top-ten/" },
			{
				label: "OWASP ASVS",
				href: "https://owasp.org/www-project-application-security-verification-standard/",
			},
			{
				label: "OWASP Cheat Sheet Series",
				href: "https://cheatsheetseries.owasp.org/",
			},
			{ label: "OWASP ZAP", href: "https://www.zaproxy.org/" },
		],
	},
	{
		key: "hardening",
		icon: "fa-lock",
		links: [
			{
				label: "CIS Benchmarks",
				href: "https://www.cisecurity.org/cis-benchmarks",
			},
			{ label: "Lynis", href: "https://cisofy.com/lynis/" },
			{
				label: "Mozilla SSH Guidelines",
				href: "https://infosec.mozilla.org/guidelines/openssh",
			},
			{ label: "DevSec Hardening Framework", href: "https://dev-sec.io/" },
		],
	},
	{
		key: "compliance",
		icon: "fa-certificate",
		links: [
			{
				label: "ISO/IEC 27001",
				href: "https://www.iso.org/isoiec-27001-information-security.html",
			},
			{
				label: "ISO/IEC 42001",
				href: "https://www.iso.org/standard/81230.html",
			},
			{
				label: "SOC 2",
				href: "https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services",
			},
			{ label: "GDPR", href: "https://gdpr.eu/" },
		],
	},
	{
		key: "vulnerability",
		icon: "fa-bug",
		links: [
			{ label: "Trivy", href: "https://trivy.dev/" },
			{ label: "OpenVAS", href: "https://www.openvas.org/" },
			{ label: "Nmap", href: "https://nmap.org/" },
			{ label: "Pentest-Tools.com", href: "https://pentest-tools.com/" },
		],
	},
	{
		key: "devsecops",
		icon: "fa-code-branch",
		links: [
			{ label: "Semgrep", href: "https://semgrep.dev/" },
			{ label: "Gitleaks", href: "https://gitleaks.io/" },
			{ label: "Snyk", href: "https://snyk.io/" },
			{ label: "Checkov", href: "https://www.checkov.io/" },
		],
	},
	{
		key: "cloud",
		icon: "fa-cloud",
		links: [
			{
				label: "AWS Security Hub",
				href: "https://aws.amazon.com/security-hub/",
			},
			{
				label: "Microsoft Defender for Cloud",
				href: "https://azure.microsoft.com/products/defender-for-cloud",
			},
			{
				label: "Cloud Security Alliance",
				href: "https://cloudsecurityalliance.org/",
			},
			{
				label: "Kubernetes Security",
				href: "https://kubernetes.io/docs/concepts/security/",
			},
		],
	},
];

export const CV_FORMATS = [
	{
		key: "latex",
		icon: "fa-file-pdf",
		links: [
			"cv-aandrieu-2026.pdf",
			"cv-aandrieu-2026-ts-en.pdf",
			"cv-aandrieu-2026-ts-fr.pdf",
		],
	},
	{
		key: "ats",
		icon: "fa-robot",
		links: ["cv-small-en.html", "cv-small-fr.html"],
	},
	{
		key: "html",
		icon: "fa-globe",
		links: [
			"cv-medium-en.html",
			"cv-medium-fr.html",
			"cv-medium-de.html",
			"cv-medium-no.html",
		],
	},
] as const;
