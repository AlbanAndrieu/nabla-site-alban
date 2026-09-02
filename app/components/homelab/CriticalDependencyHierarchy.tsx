"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ServiceTopology } from "@/lib/serviceTopology";
import styles from "./CriticalDependencyHierarchy.module.css";
import ServiceCriticalityOverview from "./ServiceCriticalityOverview";

export const CRITICAL_DEPENDENCY_HIERARCHY_ID = "critical-dependency-hierarchy";

type Props = {
	topology: ServiceTopology;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	className?: string;
};

export default function CriticalDependencyHierarchy({
	topology,
	open,
	onOpenChange,
	className,
}: Readonly<Props>) {
	const t = useTranslations("homelab");
	const [internalOpen, setInternalOpen] = useState(false);
	const controlled = open !== undefined;
	const resolvedOpen = controlled ? open : internalOpen;
	const classes = [styles.details, className].filter(Boolean).join(" ");

	return (
		<details
			id={CRITICAL_DEPENDENCY_HIERARCHY_ID}
			className={classes}
			open={resolvedOpen}
			onToggle={(event) => {
				const nextOpen = event.currentTarget.open;
				if (!controlled) setInternalOpen(nextOpen);
				onOpenChange?.(nextOpen);
			}}
			data-criticality-toggle
		>
			<summary className={styles.summary}>
				<span className={styles.label}>
					<i className="fas fa-sitemap" aria-hidden="true" />
					{resolvedOpen
						? t("criticality.hideHierarchy")
						: t("criticality.showHierarchy")}
				</span>
			</summary>
			<div className={styles.body}>
				<ServiceCriticalityOverview topology={topology} compact />
			</div>
		</details>
	);
}
