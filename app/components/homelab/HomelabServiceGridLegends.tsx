"use client";

import { useTranslations } from "next-intl";
import { homelabHealthColor } from "@/lib/homelabHealthPresentation";
import { RUNTIME_ICON_CLASS } from "./homelabGridPresentation";

/** TrueNAS runtime icon legend and dependency-health legend below the grid. */
export default function HomelabServiceGridLegends() {
	const t = useTranslations("homelab");
	return (
		<>
			<div
				className="d-flex flex-wrap justify-content-center gap-3 small text-muted mt-3"
				role="note"
				aria-label={t("runtime.legendTitle")}
				data-truenas-runtime-legend
			>
				<strong>{t("runtime.legendTitle")}:</strong>
				<span>
					<i
						className={RUNTIME_ICON_CLASS.ok}
						style={{ color: homelabHealthColor("ok") }}
						aria-hidden="true"
					/>{" "}
					{t("runtime.legendRunning")}
				</span>
				<span>
					<i
						className={RUNTIME_ICON_CLASS.warn}
						style={{ color: homelabHealthColor("warn") }}
						aria-hidden="true"
					/>{" "}
					{t("runtime.legendDegraded")}
				</span>
				<span>
					<i
						className={RUNTIME_ICON_CLASS.fail}
						style={{ color: homelabHealthColor("fail") }}
						aria-hidden="true"
					/>{" "}
					{t("runtime.legendFailed")}
				</span>
				<span>
					<i
						className={RUNTIME_ICON_CLASS.missing}
						style={{ color: homelabHealthColor("unknown") }}
						aria-hidden="true"
					/>{" "}
					{t("runtime.legendMissing")}
				</span>
			</div>
			<div
				className="small text-muted text-center mt-2"
				role="note"
				aria-label={t("dependency.legendTitle")}
				data-dependency-health-legend
			>
				<strong>{t("dependency.legendTitle")}:</strong> {t("dependency.legend")}
			</div>
		</>
	);
}
