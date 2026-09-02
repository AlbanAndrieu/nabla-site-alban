import type { AppLocale } from "@/i18n/routing";

const BASE_LOADERS = {
	en: () => import("@/messages/en.json"),
	fr: () => import("@/messages/fr.json"),
} as const;

const TRUENAS_LOADERS = {
	en: () => import("@/messages/truenas/en.json"),
	fr: () => import("@/messages/truenas/fr.json"),
} as const;

const HOMELAB_LOADERS = {
	en: () => import("@/messages/homelab/en.json"),
	fr: () => import("@/messages/homelab/fr.json"),
} as const;

const OPERATIONS_LOADERS = {
	en: () => import("@/messages/operations/en.json"),
	fr: () => import("@/messages/operations/fr.json"),
} as const;

const SECURITY_LOADERS = {
	en: () => import("@/messages/security/en.json"),
	fr: () => import("@/messages/security/fr.json"),
} as const;

const LEGACY_FEATURE_NAMESPACES = new Set(["truenasPage", "securityPage"]);

function withoutMigratedLegacyNamespaces<T extends Record<string, unknown>>(
	catalog: T,
) {
	const filtered = { ...catalog } as Record<string, unknown>;
	for (const namespace of LEGACY_FEATURE_NAMESPACES) {
		delete filtered[namespace];
	}
	return filtered;
}

function assertUniqueTopLevelNamespaces(
	catalogs: ReadonlyArray<Record<string, unknown>>,
) {
	const owners = new Map<string, number>();
	catalogs.forEach((catalog, catalogIndex) => {
		for (const namespace of Object.keys(catalog)) {
			const previousOwner = owners.get(namespace);
			if (previousOwner !== undefined) {
				throw new Error(
					`Duplicate i18n namespace "${namespace}" in catalogs ${previousOwner} and ${catalogIndex}`,
				);
			}
			owners.set(namespace, catalogIndex);
		}
	});
}

export async function loadMessages(locale: AppLocale) {
	const [
		{ default: base },
		{ default: truenas },
		{ default: homelab },
		{ default: operations },
		{ default: security },
	] = await Promise.all([
		BASE_LOADERS[locale](),
		TRUENAS_LOADERS[locale](),
		HOMELAB_LOADERS[locale](),
		OPERATIONS_LOADERS[locale](),
		SECURITY_LOADERS[locale](),
	]);

	const legacyBase = withoutMigratedLegacyNamespaces(base);
	assertUniqueTopLevelNamespaces([
		legacyBase,
		truenas,
		homelab,
		operations,
		security,
	]);

	return {
		...legacyBase,
		...truenas,
		...homelab,
		...operations,
		...security,
	};
}
