"use client";

import { useTranslations } from "next-intl";
import ActionLink from "@/components/ui/ActionLink";
import type {
	OperationalComponentEvidence,
	TroubleshootingFocus,
} from "@/lib/homelabOperationalEvidence";
import styles from "./PfSenseAttentionActions.module.css";

const PFSENSE_ADMIN_URL = "https://pfsense.albandrieu.com:10443/";
const PFSENSE_API_HEALTH_URL =
	"https://pfsense.albandrieu.com:10443/api/v2/system/version";

type Props = {
	component: OperationalComponentEvidence | undefined;
	focus: TroubleshootingFocus;
	hasEvidence: boolean;
};

export function pfsenseNeedsAttention(
	component: OperationalComponentEvidence | undefined,
	focus: TroubleshootingFocus,
): boolean {
	const componentNeedsAttention =
		component !== undefined &&
		(component.state !== "ok" || component.stale === true);
	return componentNeedsAttention || focus.startsWith("pfsense_");
}

export default function PfSenseAttentionActions({
	component,
	focus,
	hasEvidence,
}: Readonly<Props>) {
	const t = useTranslations("operations");
	if (!pfsenseNeedsAttention(component, focus)) return null;

	return (
		<aside className={styles.attention} data-pfsense-attention-actions>
			<div className={styles.heading}>
				<i className="fas fa-triangle-exclamation" aria-hidden="true" />
				{t("pfsense.actions.title")}
			</div>
			<p className={styles.lead}>{t("pfsense.actions.lead")}</p>
			<div className={styles.actions}>
				{hasEvidence ? (
					<ActionLink
						href="#pfsense-operational-evidence"
						size="compact"
						variant="primary"
					>
						{t("pfsense.details")}
					</ActionLink>
				) : null}
				<ActionLink
					href={PFSENSE_ADMIN_URL}
					target="_blank"
					rel="noopener noreferrer"
					size="compact"
					variant="outline"
				>
					{t("pfsense.actions.admin")}
				</ActionLink>
				<ActionLink
					href={PFSENSE_API_HEALTH_URL}
					target="_blank"
					rel="noopener noreferrer"
					size="compact"
					variant="outline"
					title={t("pfsense.actions.apiTitle")}
				>
					{t("pfsense.actions.api")}
				</ActionLink>
			</div>
			<small className={styles.note}>{t("pfsense.actions.note")}</small>
		</aside>
	);
}
