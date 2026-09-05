"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AiGlobalTools from "./AiGlobalTools";
import AiHomelabArchitecture from "./AiHomelabArchitecture";
import AiObservability from "./AiObservability";
import AiSecurePlatformOverview from "./AiSecurePlatformOverview";
import AiUsageAnalytics from "./AiUsageAnalytics";
import AiWorkflowAutomation from "./AiWorkflowAutomation";

const MIGRATED_PLATFORM_TAGS = new Set(["n8n", "temporal"]);
const DUPLICATE_DOCUMENT_PIPELINE_TOOLS = ["Temporal", "OpenRAG"];

export default function AiNativeSections() {
	const t = useTranslations("ai");
	const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);
	const documentPipelineIntro = t("native.documentPipelineIntro");

	useEffect(() => {
		const content = document.querySelector("#main-content .content-section");
		if (!(content instanceof HTMLElement)) return;

		for (const item of content.querySelectorAll(
			"#popular-ai-platforms-tools .nabla-tool-tags li",
		)) {
			if (
				MIGRATED_PLATFORM_TAGS.has(item.textContent?.trim().toLowerCase() ?? "")
			)
				item.remove();
		}

		const documentPipeline = document.getElementById("document-pipeline");
		if (documentPipeline) {
			for (const item of documentPipeline.querySelectorAll(
				".ai-doc-pipeline > li",
			)) {
				const toolName =
					item.querySelector("strong")?.textContent?.trim() ?? "";
				if (
					DUPLICATE_DOCUMENT_PIPELINE_TOOLS.some((tool) =>
						toolName.startsWith(tool),
					)
				)
					item.remove();
			}

			const introduction = documentPipeline.querySelector(":scope > p");
			if (introduction) introduction.textContent = documentPipelineIntro;

			content.append(documentPipeline);
		}

		const host = document.createElement("div");
		host.className = "ai-native-sections";
		if (documentPipeline?.parentElement === content)
			documentPipeline.insertAdjacentElement("beforebegin", host);
		else content.append(host);
		setMountPoint(host);
		return () => host.remove();
	}, [documentPipelineIntro]);

	if (!mountPoint) return null;

	return createPortal(
		<>
			<AiSecurePlatformOverview />
			<AiWorkflowAutomation />
			<AiGlobalTools />
			<AiObservability />
			<AiUsageAnalytics />
			<AiHomelabArchitecture />
		</>,
		mountPoint,
	);
}
