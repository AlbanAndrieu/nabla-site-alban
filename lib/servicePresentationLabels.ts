/** Static, pure i18n keys shared by TrueNAS and Architecture views. */
import type { ServiceMetricsProfile, ServicePresentationGroup } from "./servicePresentation";

type GroupTitleKey =
	| "presentation.groups.services"
	| "presentation.groups.core-critical"
	| "presentation.groups.security-controls"
	| "presentation.groups.shared-core"
	| "presentation.groups.support";

type GroupDescriptionKey =
	| "presentation.descriptions.services"
	| "presentation.descriptions.core-critical"
	| "presentation.descriptions.security-controls"
	| "presentation.descriptions.shared-core"
	| "presentation.descriptions.support";

type MetricsProfileKey =
	| "presentation.metrics.red"
	| "presentation.metrics.use"
	| "presentation.metrics.security"
	| "presentation.metrics.red-use"
	| "presentation.metrics.support";

export const GROUP_TITLE_KEY: Record<ServicePresentationGroup, GroupTitleKey> =
	{
		services: "presentation.groups.services",
		"core-critical": "presentation.groups.core-critical",
		"security-controls": "presentation.groups.security-controls",
		"shared-core": "presentation.groups.shared-core",
		support: "presentation.groups.support",
	};

export const GROUP_DESCRIPTION_KEY: Record<
	ServicePresentationGroup,
	GroupDescriptionKey
> = {
	services: "presentation.descriptions.services",
	"core-critical": "presentation.descriptions.core-critical",
	"security-controls": "presentation.descriptions.security-controls",
	"shared-core": "presentation.descriptions.shared-core",
	support: "presentation.descriptions.support",
};

export const METRICS_PROFILE_KEY: Record<
	ServiceMetricsProfile,
	MetricsProfileKey
> = {
	red: "presentation.metrics.red",
	use: "presentation.metrics.use",
	security: "presentation.metrics.security",
	"red-use": "presentation.metrics.red-use",
	support: "presentation.metrics.support",
};

