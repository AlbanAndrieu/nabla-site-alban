/** Public icon assets, independent of OWNER runtime evidence or network probes. */
const ICONS: Readonly<Record<string, string>> = {
	"grafana": "grafana-icon.svg",
	"prometheus": "prometheusio-icon.svg",
	"postgres": "postgresql-original-wordmark.svg",
	"postgresql": "postgresql-original-wordmark.svg",
	"redis": "redis-original-wordmark.svg",
	"mongodb": "mongodb-original-wordmark.svg",
	"mongo": "mongodb-original-wordmark.svg",
	"kafka": "apache_kafka-icon.svg",
	"sentry": "sentryio-icon.svg",
	"opensearch": "elastic-icon.svg",
	"vault": "vaultproject-icon.svg",
	"kubernetes": "kubernetes-icon.svg",
	"talos": "kubernetes-icon.svg",
	"keycloak": "keycloak.svg",
	"loki": "logo-loki.svg",
	"nvidia": "nvidia-icon.svg",
	"python": "python-original.svg",
	"nodejs": "nodejs-original-wordmark.svg",
};

export function homelabCatalogIconSrc(serviceId: string): string {
	const icon = ICONS[serviceId.toLowerCase()];
	return icon ? `assets/selfh-icons/${icon}` : "assets/selfh-icons/generic-app.svg";
}
