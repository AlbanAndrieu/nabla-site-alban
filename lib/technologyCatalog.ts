export type Technology = Readonly<{
	name: string;
	href: string;
	icon?: string;
}>;

export type TechnologyGroup = Readonly<{
	title: string;
	technologies: readonly Technology[];
}>;

export const TECHNOLOGY_GROUPS = [
	{
		title: "Languages & scripting",
		technologies: [
			[
				"Python",
				"https://www.python.org/",
				"/assets/selfh-icons/python-original.svg",
			],
			[
				"Java",
				"https://www.java.com/",
				"/assets/selfh-icons/java-original.svg",
			],
			[
				"C++",
				"https://isocpp.org/",
				"/assets/selfh-icons/cplusplus-original.svg",
			],
			[
				"TypeScript",
				"https://www.typescriptlang.org/",
				"/assets/selfh-icons/typescript-original.svg",
			],
			[
				"JavaScript",
				"https://developer.mozilla.org/en-US/docs/Web/JavaScript",
				"/assets/selfh-icons/javascript-original.svg",
			],
			[
				"Bash",
				"https://www.gnu.org/software/bash/",
				"/assets/selfh-icons/gnu_bash-icon.svg",
			],
		],
	},
	{
		title: "Web & frontend",
		technologies: [
			[
				"CSS",
				"https://developer.mozilla.org/en-US/docs/Web/CSS",
				"/assets/selfh-icons/css3-original-wordmark.svg",
			],
			[
				"HTML5",
				"https://html.spec.whatwg.org/",
				"/assets/selfh-icons/html5-original-wordmark.svg",
			],
			[
				"Vue.js",
				"https://vuejs.org/",
				"/assets/selfh-icons/vuejs-original-wordmark.svg",
			],
			["Nuxt.js", "https://nuxt.com/", "/assets/selfh-icons/nuxtjs-icon.svg"],
			[
				"React",
				"https://react.dev/",
				"/assets/fontawesome-free-7.1.0-web/svgs/brands/react.svg",
			],
			[
				"Node.js",
				"https://nodejs.org/",
				"/assets/selfh-icons/nodejs-original-wordmark.svg",
			],
		],
	},
	{
		title: "Cloud, OS & infrastructure",
		technologies: [
			[
				"AWS",
				"https://aws.amazon.com/",
				"/assets/selfh-icons/amazonwebservices-original-wordmark.svg",
			],
			[
				"Azure",
				"https://azure.microsoft.com/",
				"/assets/selfh-icons/microsoft_azure-icon.svg",
			],
			[
				"Google Cloud",
				"https://cloud.google.com/",
				"/assets/selfh-icons/google_cloud-icon.svg",
			],
			[
				"Linux",
				"https://www.linux.org/",
				"/assets/selfh-icons/linux-original.svg",
			],
			[
				"Kubernetes",
				"https://kubernetes.io/",
				"/assets/selfh-icons/kubernetes-icon.svg",
			],
			[
				"Nomad",
				"https://developer.hashicorp.com/nomad",
				"/assets/selfh-icons/nomad.png",
			],
			[
				"Consul",
				"https://developer.hashicorp.com/consul",
				"/assets/selfh-icons/consul.png",
			],
			[
				"Ansible",
				"https://www.ansible.com/",
				"/assets/selfh-icons/ansible-icon.svg",
			],
			[
				"Terraform",
				"https://developer.hashicorp.com/terraform",
				"/assets/selfh-icons/terraformio-icon.svg",
			],
		],
	},
	{
		title: "Security",
		technologies: [
			[
				"Keycloak",
				"https://www.keycloak.org/",
				"/assets/selfh-icons/keycloak.svg",
			],
			[
				"Vault",
				"https://developer.hashicorp.com/vault",
				"/assets/selfh-icons/vaultproject-icon.svg",
			],
			[
				"OWASP ZAP",
				"https://www.zaproxy.org/",
				"/assets/selfh-icons/zap-by-checkmarx.svg",
			],
		],
	},
	{
		title: "Databases, data & messaging",
		technologies: [
			[
				"PostgreSQL",
				"https://www.postgresql.org/",
				"/assets/selfh-icons/postgresql-original-wordmark.svg",
			],
			[
				"Elasticsearch",
				"https://www.elastic.co/",
				"/assets/selfh-icons/elastic-icon.svg",
			],
			[
				"Kafka",
				"https://kafka.apache.org/",
				"/assets/selfh-icons/apache_kafka-icon.svg",
			],
			[
				"MariaDB",
				"https://mariadb.org/",
				"/assets/selfh-icons/mariadb-icon.svg",
			],
			[
				"MongoDB",
				"https://www.mongodb.com/",
				"/assets/selfh-icons/mongodb-original-wordmark.svg",
			],
			[
				"MySQL",
				"https://www.mysql.com/",
				"/assets/selfh-icons/mysql-original-wordmark.svg",
			],
			[
				"Oracle",
				"https://www.oracle.com/database/",
				"/assets/selfh-icons/oracle-original.svg",
			],
			[
				"Pandas",
				"https://pandas.pydata.org/",
				"/assets/selfh-icons/pandas-original.svg",
			],
			[
				"Redis",
				"https://redis.io/",
				"/assets/selfh-icons/redis-original-wordmark.svg",
			],
			[
				"SQLite",
				"https://www.sqlite.org/",
				"/assets/selfh-icons/sqlite-icon.svg",
			],
		],
	},
	{
		title: "DevOps, observability & tooling",
		technologies: [
			["Git", "https://git-scm.com/", "/assets/selfh-icons/git-scm-icon.svg"],
			[
				"Grafana",
				"https://grafana.com/",
				"/assets/selfh-icons/grafana-icon.svg",
			],
			[
				"Prometheus",
				"https://prometheus.io/",
				"/assets/selfh-icons/prometheusio-icon.svg",
			],
			[
				"Loki",
				"https://grafana.com/oss/loki/",
				"/assets/selfh-icons/logo-loki.svg",
			],
			[
				"Postman",
				"https://www.postman.com/",
				"/assets/selfh-icons/getpostman-icon.svg",
			],
			[
				"Selenium",
				"https://www.selenium.dev/",
				"/assets/selfh-icons/selenium-logo.svg",
			],
			["Sentry", "https://sentry.io/", "/assets/selfh-icons/sentryio-icon.svg"],
		],
	},
	{
		title: "AI, ML & GPU",
		technologies: [
			[
				"NVIDIA",
				"https://www.nvidia.com/",
				"/assets/selfh-icons/nvidia-icon.svg",
			],
			[
				"PyTorch",
				"https://pytorch.org/",
				"/assets/selfh-icons/pytorch-icon.svg",
			],
			[
				"LiteLLM",
				"https://docs.litellm.ai/",
				"/assets/selfh-icons/litellm.jpg",
			],
			["MCP", "https://modelcontextprotocol.io"],
			["Langfuse", "https://langfuse.com/", "/assets/selfh-icons/langfuse.png"],
			["OpenAI", "https://openai.com/", "/assets/selfh-icons/openai.svg"],
		],
	},
	{
		title: "Design",
		technologies: [
			["Figma", "https://www.figma.com/", "/assets/selfh-icons/figma-icon.svg"],
		],
	},
].map(({ title, technologies }) => ({
	title,
	technologies: technologies.map(([name, href, icon]) => ({
		name,
		href,
		icon,
	})),
})) satisfies readonly TechnologyGroup[];
