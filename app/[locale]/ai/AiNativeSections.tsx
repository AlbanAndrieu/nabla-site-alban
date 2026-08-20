"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AiGlobalTools from "./AiGlobalTools";
import AiHomelabArchitecture from "./AiHomelabArchitecture";
import AiObservability from "./AiObservability";
import AiUsageAnalytics from "./AiUsageAnalytics";
import AiWorkflowAutomation from "./AiWorkflowAutomation";

const MIGRATED_PLATFORM_TAGS = new Set(["n8n", "temporal"]);
const DUPLICATE_DOCUMENT_PIPELINE_TOOLS = ["Temporal", "OpenRAG"];

export default function AiNativeSections({ locale }: { locale: string }) {
	const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const content = document.querySelector("#main-content .content-section");
		if (!(content instanceof HTMLElement)) return;

		for (const item of content.querySelectorAll("#popular-ai-platforms-tools .nabla-tool-tags li")) {
			if (MIGRATED_PLATFORM_TAGS.has(item.textContent?.trim().toLowerCase() ?? "")) item.remove();
		}

		const documentPipeline = document.getElementById("document-pipeline");
		if (documentPipeline) {
			for (const item of documentPipeline.querySelectorAll(".ai-doc-pipeline > li")) {
				const toolName = item.querySelector("strong")?.textContent?.trim() ?? "";
				if (DUPLICATE_DOCUMENT_PIPELINE_TOOLS.some((tool) => toolName.startsWith(tool))) item.remove();
			}

			const introduction = documentPipeline.querySelector(":scope > p");
			if (introduction) {
				introduction.textContent =
					locale === "fr"
						? "Un flux pratique du PDF vers la connaissance : normaliser les PDF localement, les archiver et les OCRiser dans Paperless, les enrichir avec Paperless-AI, puis exploiter le corpus dans AnythingLLM avec Paperless-ngx intégré pour des vérifications rapides."
						: "A practical PDF-to-knowledge flow: normalize PDFs locally, archive and OCR them in Paperless, enrich them with Paperless-AI, then work with the corpus in AnythingLLM with Paperless-ngx integrated for quick checks.";
			}
		}

		const host = document.createElement("div");
		host.className = "ai-native-sections";
		if (documentPipeline?.parentElement === content) documentPipeline.insertAdjacentElement("beforebegin", host);
		else content.append(host);
		setMountPoint(host);
		return () => host.remove();
	}, [locale]);

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
