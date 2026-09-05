"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function AiUsageAnalytics() {
	const t = useTranslations("ai");
	const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const section = document.getElementById("ai-token-finops");
		const grid = section?.querySelector(".resource-grid");
		const cursorCard = grid?.querySelector(".resource-card");
		if (!grid || !cursorCard) return;

		const host = document.createElement("div");
		host.style.display = "contents";
		cursorCard.insertAdjacentElement("afterend", host);
		setMountPoint(host);

		return () => host.remove();
	}, []);

	if (!mountPoint) return null;

	return createPortal(
		<article className="resource-card">
			<h3>
				<i
					className="fas fa-chart-line resource-card-icon"
					aria-hidden="true"
				/>{" "}
				ChatGPT / Codex usage analytics
			</h3>
			<p>{t("usage.description")}</p>
			<a
				href="https://help.openai.com/en/articles/12289294-global-admin-console"
				target="_blank"
				rel="noopener noreferrer"
				className="resource-link"
			>
				<i className="fas fa-external-link-alt" aria-hidden="true" />{" "}
				{t("usage.analytics")}
			</a>
		</article>,
		mountPoint,
	);
}
