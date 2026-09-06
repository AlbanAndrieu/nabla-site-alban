import AiDocumentPipeline from "./AiDocumentPipeline";
import AiEngineeringPractices from "./AiEngineeringPractices";
import AiGlobalTools from "./AiGlobalTools";
import AiHomelabArchitecture from "./AiHomelabArchitecture";
import AiObservability from "./AiObservability";
import AiResourceCatalog from "./AiResourceCatalog";
import AiSecurePlatformOverview from "./AiSecurePlatformOverview";
import AiWorkflowAutomation from "./AiWorkflowAutomation";

export default function AiNativeSections() {
	return (
		<>
			<AiSecurePlatformOverview />
			<AiHomelabArchitecture />
			<AiWorkflowAutomation />
			<AiGlobalTools />
			<AiResourceCatalog />
			<AiObservability />
			<AiDocumentPipeline />
			<AiEngineeringPractices />
		</>
	);
}
