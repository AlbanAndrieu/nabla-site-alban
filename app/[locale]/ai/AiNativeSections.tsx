"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AiGlobalTools from "./AiGlobalTools";
import AiHomelabArchitecture from "./AiHomelabArchitecture";
import AiObservability from "./AiObservability";
import AiUsageAnalytics from "./AiUsageAnalytics";
import AiWorkflowAutomation from "./AiWorkflowAutomation";

const MIGRATED_PLATFORM_TAGS = new Set(["n8n", "temporal"]);

export default function AiNativeSections({ locale }: { locale: string }) {
	const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const content = document.querySelector("#main-content .content-section");
		if (!(content instanceof HTMLElement)) return;

		for (const item of content.querySelectorAll("#popular-ai-platforms-tools .nabla-tool-tags li")) {
			if (MIGRATED_PLATFORM_TAGS.has(item.textContent?.trim().toLowerCase() ?? "")) item.remove();
		}

		const host = document.createElement("div");
		host.className = "ai-native-sections";
		const documentPipeline = document.getElementById("document-pipeline");
		if (documentPipeline?.parentElement === content) documentPipeline.insertAdjacentElement("beforebegin", host);
		else content.append(host);
		setMountPoint(host);
		return () => host.remove();
	}, []);

	if (!mountPoint) return null;

	return createPortal(
		<>
			<AiWorkflowAutomation locale={locale} />
			<AiGlobalTools locale={locale} />
			<AiObservability locale={locale} />
			<AiUsageAnalytics locale={locale} />
			<AiHomelabArchitecture locale={locale} />
		</>,
		mountPoint,
	);
}
