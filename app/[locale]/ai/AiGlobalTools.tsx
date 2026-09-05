import { useTranslations } from "next-intl";

export default function AiGlobalTools() {
	const t = useTranslations("ai");
	return (
		<section
			id="global-ai-tools"
			className="category-section"
			aria-labelledby="global-ai-tools-heading"
		>
			<h2 id="global-ai-tools-heading" className="category-title">
				<i className="fas fa-toolbox" aria-hidden="true" />{" "}
				{t("globalTools.title")}
			</h2>
			<p
				style={{
					marginBottom: "1.5rem",
					color: "var(--text-secondary)",
					lineHeight: 1.65,
				}}
			>
				{t("globalTools.lead")}
			</p>
			<div className="resource-grid">
				<article id="open-terminal" className="resource-card">
					<h3>
						<i
							className="fas fa-terminal resource-card-icon"
							aria-hidden="true"
						/>{" "}
						Open Terminal
					</h3>
					<p>{t("globalTools.terminal")}</p>
					<a
						href="https://github.com/open-webui/open-terminal"
						target="_blank"
						rel="noopener noreferrer"
						className="resource-link"
					>
						<i className="fab fa-github" aria-hidden="true" /> GitHub
					</a>
				</article>
				<article id="openrag" className="resource-card">
					<h3>
						<i
							className="fas fa-book-open resource-card-icon"
							aria-hidden="true"
						/>{" "}
						OpenRAG
					</h3>
					<p>{t("globalTools.openrag")}</p>
					<a
						href="https://github.com/langflow-ai/openrag"
						target="_blank"
						rel="noopener noreferrer"
						className="resource-link"
					>
						<i className="fab fa-github" aria-hidden="true" /> GitHub
					</a>
				</article>
				<article id="nvidia-openshell" className="resource-card">
					<h3>
						<i
							className="fas fa-shield-halved resource-card-icon"
							aria-hidden="true"
						/>{" "}
						NVIDIA OpenShell
					</h3>
					<p>{t("globalTools.openshell")}</p>
					<a
						href="https://github.com/NVIDIA/OpenShell"
						target="_blank"
						rel="noopener noreferrer"
						className="resource-link"
					>
						<i className="fab fa-github" aria-hidden="true" /> GitHub
					</a>
				</article>
			</div>
		</section>
	);
}
