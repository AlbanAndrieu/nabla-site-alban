import { getTranslations } from "next-intl/server";
import { HARDWARE_UPGRADE_SOURCES } from "./hardwarePlan";

export default async function MemoryUpgradePlan() {
	const t = await getTranslations("truenas.upgrades.memory");

	return (
		<div className="card box-shadow mt-3">
			<div className="card-body">
				<div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
					<h5 className="h6 mb-0">{t("title")}</h5>
					<span className="badge text-bg-warning">{t("badge")}</span>
				</div>
				<p className="fw-semibold mb-2">{t("current")}</p>
				<p className="mb-2">{t("reason")}</p>
				<ul className="small mb-2">
					<li>{t("target")}</li>
					<li>{t("validation")}</li>
					<li>{t("budget")}</li>
				</ul>
				<p className="small mb-0">
					<a href={HARDWARE_UPGRADE_SOURCES.msi}>{t("board")}</a>
					{" · "}
					<a href={HARDWARE_UPGRADE_SOURCES.amd}>{t("cpu")}</a>
				</p>
			</div>
		</div>
	);
}
