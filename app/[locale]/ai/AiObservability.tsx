"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function AiObservability() {
	const t = useTranslations("ai");
	const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const section = document.getElementById("ai-token-finops");
		const heading = document.getElementById("ai-token-finops-heading");
		const description = section?.querySelector(":scope > p");
		const grid = section?.querySelector(".resource-grid");
		if (!section || !heading || !grid) return;

		heading.innerHTML = '<i class="fas fa-chart-line" aria-hidden="true"></i> ' + t("observability.title");
		if (description) description.textContent = t("observability.lead");

		const host = document.createElement("div");
		host.style.display = "contents";
		grid.prepend(host);
		setMountPoint(host);
		return () => host.remove();
	}, [t]);

	if (!mountPoint) return null;

	return createPortal(
		<>
			<article id="opik" className="resource-card">
				<h3>
					<i
						className="fas fa-chart-line resource-card-icon"
						aria-hidden="true"
					/>{" "}
					Opik by Comet
				</h3>
				<p>{t("observability.opik")}</p>
				<a
					href="https://www.comet.com/docs/opik/"
					target="_blank"
					rel="noopener noreferrer"
					className="resource-link"
				>
					<i className="fas fa-book" aria-hidden="true" />{" "}
					{t("observability.documentation")}
				</a>
			</article>
			<article id="langfuse" className="resource-card">
				<h3>
					<i className="fas fa-eye resource-card-icon" aria-hidden="true" />{" "}
					Langfuse
				</h3>
				<p>{t("observability.langfuse")}</p>
				<a
					href="https://langfuse.com/"
					target="_blank"
					rel="noopener noreferrer"
					className="resource-link"
				>
					<i className="fas fa-external-link-alt" aria-hidden="true" /> Langfuse
				</a>
			</article>
		</>,
		mountPoint,
	);
}
