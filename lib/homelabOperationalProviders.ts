import {
	isRecord,
	optionalString,
	stringArray,
} from "./homelabOperationalEvidenceShared";
import type { ProviderCredentialEvidence } from "./homelabOperationalEvidenceTypes";

export function parseProviderCredentials(
	homelab: Record<string, unknown>,
): ProviderCredentialEvidence[] {
	const rawCredentials = isRecord(homelab.provider_credentials)
		? homelab.provider_credentials
		: isRecord(homelab.providerCredentials)
			? homelab.providerCredentials
			: null;
	if (!rawCredentials) return [];
	return Object.values(rawCredentials).flatMap((value) => {
		if (!isRecord(value) || typeof value.configured !== "boolean") return [];
		const provider = optionalString(value.provider);
		if (!provider) return [];
		return [
			{
				provider,
				configured: value.configured,
				...(optionalString(value.configuration_stage)
					? { configurationStage: optionalString(value.configuration_stage) }
					: {}),
				...(optionalString(value.credential_mode)
					? { credentialMode: optionalString(value.credential_mode) }
					: {}),
				missingVariables: stringArray(value.missing_variables),
				invalidReferenceVariables: stringArray(
					value.invalid_reference_variables,
				),
				...(optionalString(value.required_privilege)
					? { requiredPrivilege: optionalString(value.required_privilege) }
					: {}),
				...(typeof value.write_privileges_required === "boolean"
					? { writePrivilegesRequired: value.write_privileges_required }
					: {}),
			},
		];
	});
}
