/**
 * Public, bilingual YubiKey architecture guide.
 * Never put device serial numbers, key identifiers, PINs, PUKs, OTP seeds,
 * certificate payloads, private URLs or actual escrow paths in this module
 * or its locale files (content.en.ts, content.fr.ts).
 * This is an intended configuration, not an automated hardware inventory.
 */
import { GUIDE_COPY_EN } from "./content.en";
import { GUIDE_COPY_FR } from "./content.fr";
export type GuideLocale = "en" | "fr";
export type GuideStep = {
	title: string;
	text: string;
	state: "observed" | "planned" | "blocked";
};
export type GuideTerm = { acronym: string; expansion: string; meaning: string };
export type GuideCopy = {
	meta: { title: string; description: string };
	back: string;
	eyebrow: string;
	title: string;
	lead: string;
	disclaimer: string;
	diagramTitle: string;
	diagramLead: string;
	accessibleGraph: string;
	graphSelectorLabel: string;
	graphRoles: Record<string, string>;
	graphEdges: Record<string, string>;
	keyLegend: string;
	workflowTitle: string;
	stateLabels: Record<GuideStep["state"], string>;
	steps: GuideStep[];
	safetyTitle: string;
	safety: string[];
	glossaryTitle: string;
	glossaryLead: string;
	terms: GuideTerm[];
	nextTitle: string;
	nextSteps: string[];
	glossaryLink: string;
	sourceLabel: string;
};
export const GUIDE_COPY: Record<GuideLocale, GuideCopy> = {
	fr: GUIDE_COPY_FR,
	en: GUIDE_COPY_EN,
};
