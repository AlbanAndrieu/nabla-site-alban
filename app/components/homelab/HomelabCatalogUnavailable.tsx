"use client";

import { useLocale, useTranslations } from "next-intl";
import type { HomelabServicesState } from "./useHomelabHealth";

/** Loading or failure state shown until the Backstage v2 catalog renders. */
export default function HomelabCatalogUnavailable({
	error,
	failure,
	incident,
}: Readonly<{
	error: boolean;
	failure: HomelabServicesState["catalogFailure"];
	/** OWNER-only support reference; callers pass null in SERVICE mode. */
	incident: HomelabServicesState["catalogIncident"];
}>) {
	const t = useTranslations("homelab");
	const french = useLocale() === "fr";
	return (
		<div
			className="text-center py-4"
			role={error ? "alert" : "status"}
			data-homelab-inventory-unavailable={error ? true : undefined}
		>
			{!error
				? t("loading")
				: failure === "access-denied"
					? french
						? "Clé de diagnostic refusée par FastAPI : le catalogue Backstage v2 reste privé."
						: "FastAPI rejected the diagnostics key: the Backstage v2 catalog remains private."
					: failure === "key-missing"
						? french
							? "Clé serveur manquante : catalogue Backstage v2 indisponible."
							: "Missing server key: Backstage v2 catalog unavailable."
						: t("unavailable")}
			{error && incident && (
				<p
					className="small text-muted mt-2"
					data-catalog-failure-stage={incident.stage}
				>
					{french ? "Phase du diagnostic" : "Diagnostic stage"}:{" "}
					<code>{incident.stage}</code>
					{" · "}
					{french ? "Référence support" : "Support reference"}:{" "}
					<code>{incident.requestId}</code>
				</p>
			)}
		</div>
	);
}
