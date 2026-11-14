"use client";

import { useTranslations } from "next-intl";
import type { HomelabService } from "@/lib/homelabServices";
import styles from "./HomelabServicesBlock.module.css";

const KIND_KEYS = {
	Component: "catalog.kinds.component",
	Resource: "catalog.kinds.resource",
	API: "catalog.kinds.api",
} as const;

const LEVEL_KEYS = {
	critical: "catalog.levels.critical",
	high: "catalog.levels.high",
	medium: "catalog.levels.medium",
	low: "catalog.levels.low",
} as const;

const LIFECYCLE_KEYS = {
	production: "catalog.lifecycle.production",
	experimental: "catalog.lifecycle.experimental",
	development: "catalog.lifecycle.development",
	deprecated: "catalog.lifecycle.deprecated",
} as const;

/** Only source-declared Backstage attributes; never label these as a live probe. */
export default function HomelabCatalogMetadata({ service }: Readonly<{ service: HomelabService }>) {
	const t = useTranslations("homelab");
	const kind = service.catalogEntityKind;
	const life = service.lifecycle;
	const business = service.businessCriticality;
	const operation = service.criticality;
	if (!kind && !life && !business && !operation) return null;
	const lifeKey = life && Object.hasOwn(LIFECYCLE_KEYS, life)
		? LIFECYCLE_KEYS[life as keyof typeof LIFECYCLE_KEYS]
		: null;
	return (
		<div className={styles.catalogMetadata} data-backstage-v2-metadata title={t("catalog.declarativeOnly")}>
			<dl className={styles.catalogMetadataList}>
				{kind && (
					<div>
						<dt>{t("catalog.entityKind")}</dt>
						<dd>{t(KIND_KEYS[kind])}</dd>
					</div>
				)}
				{life && (
					<div>
						<dt>{t("catalog.lifecycleLabel")}</dt>
						<dd>{lifeKey ? t(lifeKey) : life}</dd>
					</div>
				)}
				{operation && (
					<div>
						<dt>{t("catalog.operationalCriticality")}</dt>
						<dd>{t(LEVEL_KEYS[operation])}</dd>
					</div>
				)}
				{business && (
					<div>
						<dt>{t("catalog.businessCriticality")}</dt>
						<dd>{t(LEVEL_KEYS[business])}</dd>
					</div>
				)}
			</dl>
		</div>
	);
}
