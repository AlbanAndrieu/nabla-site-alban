import Image from "next/image";
import { getTranslations } from "next-intl/server";
import AnchoredHeading from "@/components/AnchoredHeading";
import styles from "./HomeLabSection.module.css";

export default async function HomeLabSection({
	nablaHref,
}: {
	nablaHref: string;
}) {
	const t = await getTranslations("truenas.page.homelab");

	return (
		<section className="py-4 page-truenas-secondary" aria-labelledby="homelab">
			<div className="container">
				<AnchoredHeading as="h2" id="homelab" className="h4 mb-3">
					<i
						className="fas fa-layer-group text-primary me-2"
						aria-hidden="true"
					></i>
					{t("title")}
				</AnchoredHeading>
				<p className="text-secondary mb-4">{t("intro")}</p>
				<p>{t("purpose")}</p>
				<aside className={styles.networkCard} aria-label="Homelab network topology">
					<div className={styles.header}>
						<span className={styles.eyebrow}>FastAPI Cloud access path</span>
						<strong>FastAPI Cloud → Internet → pfSense:7000 → HAProxy → TrueNAS</strong>
					</div>
					<p className="small mb-3">
						The public TrueNAS endpoint is exposed through pfSense and HAProxy so
						FastAPI Cloud can perform controlled health and API probes without
						exposing the TrueNAS host directly.
					</p>
					<pre className={`${styles.diagram} small mb-3`}>
						{`Internet
   │
pfSense  WAN 82.66.4.247 / LAN 172.17.0.1
   │
LAN switch
   ├── TrueNAS        172.17.0.24
   ├── Workstation    172.17.0.57
   └── R7000 AP       172.17.0.12
          └── S24 Ultra 172.17.0.11`}
					</pre>
					<ul className={`${styles.facts} small mb-0`}>
						<li>R7000: access-point mode; pfSense remains gateway and DHCP authority.</li>
						<li>AP DNS: 172.17.0.1 primary, 172.17.0.24 secondary.</li>
						<li>Observed S24 Ultra / Free Mobile public source: 37.166.227.161.</li>
						<li>Observed FastAPI Cloud probe source: 34.200.20.162.</li>
						<li>TrueNAS SSH TCP/9922 is LAN-only and expected unreachable from the Internet.</li>
					</ul>
				</aside>
				<div className="row justify-content-center">
					<div className="col-md-6 col-lg-4">
						<div className="card box-shadow h-100 border-secondary">
							<Image
								className="img-fluid d-block mx-auto p-4"
								src="/assets/nabla/nabla-4.svg"
								width={140}
								height={140}
								alt={t("logoAlt")}
								style={{ height: "auto" }}
							/>
							<div className="card-body text-center border-top border-secondary">
								<h3 className="h5 card-title mb-1">Nabla</h3>
								<p className="card-text text-muted small mb-0">
									{t("projectDescription")}
								</p>
								<a
									href={nablaHref}
									className="btn btn-sm btn-outline-primary mt-3"
									target="_blank"
									rel="noopener noreferrer"
								>
									{t("openProject")}
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
