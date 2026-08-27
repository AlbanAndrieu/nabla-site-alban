type Locale = "en" | "fr";

type Pillar = {
	icon: string;
	title: string;
	description: string;
};

type Copy = {
	title: string;
	lead: string;
	principles: string;
	pillars: Pillar[];
	outcomesTitle: string;
	outcomes: string[];
};

const COPY: Record<Locale, Copy> = {
	en: {
		title: "Secure AI platform engineering",
		lead: "The goal is not to accumulate AI tools. It is to operate models, agents, MCP tools and knowledge pipelines behind explicit security, reliability, cost and governance boundaries.",
		principles: "Architecture principles",
		pillars: [
			{
				icon: "fas fa-route",
				title: "Controlled model gateway",
				description:
					"Route local and remote inference through LiteLLM so clients share authentication, budgets, fallbacks, telemetry and provider policy instead of calling models directly.",
			},
			{
				icon: "fas fa-shield-halved",
				title: "Identity, secrets & data boundaries",
				description:
					"Keep credentials server-side, constrain access by workload, and separate sensitive prompts, documents and tenant data from public or lower-trust execution paths.",
			},
			{
				icon: "fas fa-plug",
				title: "MCP & agent trust boundaries",
				description:
					"Treat tools as privileged capabilities: scope what agents can call, isolate execution, minimize filesystem and network reach, and keep human approval for destructive actions.",
			},
			{
				icon: "fas fa-database",
				title: "RAG provenance & lifecycle",
				description:
					"Track source provenance, ingestion state and retention across Paperless, OCR and retrieval pipelines so generated answers remain traceable to controlled knowledge.",
			},
			{
				icon: "fas fa-chart-line",
				title: "Observability, evaluation & FinOps",
				description:
					"Trace prompts, latency, model selection and token cost with Langfuse and operational metrics, then evaluate quality separately instead of relying on anecdotal output checks.",
			},
			{
				icon: "fas fa-scale-balanced",
				title: "Governance by design",
				description:
					"Map technical controls to GDPR, ISO 27001 and ISO 42001 concerns: accountability, access control, evidence, data residency, supplier risk and model-use policy.",
			},
		],
		outcomesTitle: "What this architecture optimizes for",
		outcomes: [
			"local-first privacy with controlled remote fallback",
			"one policy layer for models and agents",
			"measurable cost, latency and quality",
			"replaceable providers instead of vendor lock-in",
			"auditable execution and knowledge flows",
		],
	},
	fr: {
		title: "Ingénierie d’une plateforme IA sécurisée",
		lead: "L’objectif n’est pas d’accumuler des outils IA, mais d’exploiter modèles, agents, outils MCP et pipelines de connaissance derrière des frontières explicites de sécurité, de fiabilité, de coût et de gouvernance.",
		principles: "Principes d’architecture",
		pillars: [
			{
				icon: "fas fa-route",
				title: "Gateway de modèles contrôlée",
				description:
					"Faire transiter l’inférence locale et distante par LiteLLM afin de mutualiser authentification, budgets, fallbacks, télémétrie et politiques fournisseur plutôt que d’appeler directement les modèles.",
			},
			{
				icon: "fas fa-shield-halved",
				title: "Identités, secrets et frontières de données",
				description:
					"Conserver les secrets côté serveur, limiter les accès par workload et séparer prompts, documents et données sensibles des chemins d’exécution publics ou moins fiables.",
			},
			{
				icon: "fas fa-plug",
				title: "Frontières de confiance MCP et agents",
				description:
					"Considérer chaque outil comme une capacité privilégiée : limiter les appels possibles, isoler l’exécution, réduire les accès réseau et fichiers, et conserver une validation humaine pour les actions destructives.",
			},
			{
				icon: "fas fa-database",
				title: "Provenance et cycle de vie RAG",
				description:
					"Suivre la provenance, l’état d’ingestion et la rétention entre Paperless, OCR et retrieval afin que les réponses générées restent rattachables à une connaissance maîtrisée.",
			},
			{
				icon: "fas fa-chart-line",
				title: "Observabilité, évaluation et FinOps",
				description:
					"Tracer prompts, latence, sélection de modèle et coût en tokens avec Langfuse et les métriques opérationnelles, puis évaluer la qualité séparément plutôt que par contrôle manuel ponctuel.",
			},
			{
				icon: "fas fa-scale-balanced",
				title: "Gouvernance dès la conception",
				description:
					"Relier les contrôles techniques aux enjeux RGPD, ISO 27001 et ISO 42001 : responsabilité, contrôle d’accès, preuves, résidence des données, risque fournisseur et politique d’usage des modèles.",
			},
		],
		outcomesTitle: "Objectifs d’architecture",
		outcomes: [
			"confidentialité local-first avec fallback distant contrôlé",
			"une couche de politique commune pour modèles et agents",
			"coût, latence et qualité mesurables",
			"fournisseurs remplaçables plutôt que verrouillage propriétaire",
			"flux d’exécution et de connaissance auditables",
		],
	},
};

export default function AiSecurePlatformOverview({
	locale,
}: Readonly<{ locale: string }>) {
	const copy = COPY[locale === "fr" ? "fr" : "en"];

	return (
		<section
			className="category-section"
			aria-labelledby="secure-ai-platform-heading"
		>
			<h2 id="secure-ai-platform-heading" className="category-title">
				<i className="fas fa-shield-halved" aria-hidden="true" /> {copy.title}
			</h2>
			<p>{copy.lead}</p>
			<h3>{copy.principles}</h3>
			<div className="resource-grid">
				{copy.pillars.map((pillar) => (
					<article className="resource-card" key={pillar.title}>
						<h3>
							<i
								className={`${pillar.icon} resource-card-icon`}
								aria-hidden="true"
							/>{" "}
							{pillar.title}
						</h3>
						<p>{pillar.description}</p>
					</article>
				))}
			</div>
			<article className="resource-card">
				<h3>{copy.outcomesTitle}</h3>
				<ul>
					{copy.outcomes.map((outcome) => (
						<li key={outcome}>{outcome}</li>
					))}
				</ul>
			</article>
		</section>
	);
}
