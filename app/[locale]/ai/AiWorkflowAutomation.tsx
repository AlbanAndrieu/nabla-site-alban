import { useTranslations } from "next-intl";

export default function AiWorkflowAutomation() {
	const t = useTranslations("ai");
	return (
		<section
			id="workflow-automation"
			className="category-section"
			aria-labelledby="workflow-automation-heading"
		>
			<h2 id="workflow-automation-heading" className="category-title">
				<i className="fas fa-diagram-project" aria-hidden="true" />{" "}
				{t("workflow.title")}
			</h2>
			<p
				style={{
					marginBottom: "1.5rem",
					color: "var(--text-secondary)",
					lineHeight: 1.65,
				}}
			>
				{t("workflow.lead")}
			</p>
			<div className="resource-grid">
				<article className="resource-card">
					<h3>
						<i
							className="fas fa-project-diagram resource-card-icon"
							aria-hidden="true"
						/>{" "}
						n8n
					</h3>
					<p>{t("workflow.n8n")}</p>
					<a
						href="https://n8n.io/"
						target="_blank"
						rel="noopener noreferrer"
						className="resource-link"
					>
						n8n
					</a>
				</article>
				<article id="temporal" className="resource-card">
					<h3>
						<i className="fas fa-clock resource-card-icon" aria-hidden="true" />{" "}
						Temporal
					</h3>
					<p>{t("workflow.temporal")}</p>
					<a
						href="https://temporal.io/"
						target="_blank"
						rel="noopener noreferrer"
						className="resource-link"
					>
						Temporal
					</a>
				</article>
				<article className="resource-card">
					<h3>
						<i
							className="fas fa-bezier-curve resource-card-icon"
							aria-hidden="true"
						/>{" "}
						Langflow
					</h3>
					<p>{t("workflow.langflow")}</p>
					<a
						href="https://www.langflow.org/"
						target="_blank"
						rel="noopener noreferrer"
						className="resource-link"
					>
						Langflow
					</a>
				</article>
			</div>
			<article className="intro-section" style={{ marginTop: "1.25rem" }}>
				<h3 className="intro-section__heading">
					<i className="fab fa-git-alt" aria-hidden="true" /> OpenCommit
				</h3>
				<p>{t("workflow.opencommit")}</p>
				<a
					href="https://github.com/di-sukharev/opencommit"
					target="_blank"
					rel="noopener noreferrer"
					className="resource-link"
				>
					<i className="fab fa-github" aria-hidden="true" /> GitHub
				</a>
			</article>
		</section>
	);
}
