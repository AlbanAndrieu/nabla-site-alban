"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SECTIONS = [
	{ id: "workflow-automation-ai-tools", icon: "fa-robot", key: "automation" },
	{ id: "ai-models-frameworks", icon: "fa-microchip", key: "models" },
	{ id: "document-pipeline", icon: "fa-file-lines", key: "knowledge" },
	{ id: "ai-homelab-heading", icon: "fa-network-wired", key: "architecture" },
	{ id: "ai-token-finops", icon: "fa-chart-line", key: "observability" },
	{ id: "general-best-practices", icon: "fa-shield-halved", key: "security" },
] as const;

export default function AiPageGuide() {
	const t = useTranslations("ai");
	const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const intro = document.getElementById("introduction");
		if (!intro?.parentElement) return;
		const host = document.createElement("div");
		host.className = "ai-page-guide-host";
		intro.insertAdjacentElement("afterend", host);
		setMountPoint(host);
		return () => host.remove();
	}, []);

	if (!mountPoint) return null;

	return createPortal(
		<section
			className="category-section"
			aria-labelledby="ai-page-guide-heading"
		>
			<h2 id="ai-page-guide-heading" className="category-title">
				<i className="fas fa-route" aria-hidden="true" />{" "}
				{t("guide.title")}
			</h2>
			<p
				style={{
					color: "var(--text-secondary)",
					lineHeight: 1.65,
					marginBottom: "1.25rem",
				}}
			>
				{t("guide.lead")}
			</p>
			<nav className="resource-grid" aria-label={t("guide.aria")}>
				{SECTIONS.map((section, index) => (
					<a
						key={section.id}
						href={`#${section.id}`}
						className="resource-card text-decoration-none"
						style={{ display: "block" }}
					>
						<h3>
							<i
								className={`fas ${section.icon} resource-card-icon`}
								aria-hidden="true"
							/>{" "}
							{index + 1}. {t(`guide.sections.${section.key}`)}
						</h3>
					</a>
				))}
			</nav>
		</section>,
		mountPoint,
	);
}
