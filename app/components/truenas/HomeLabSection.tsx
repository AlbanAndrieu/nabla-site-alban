import Image from "next/image";
import { getTranslations } from "next-intl/server";
import AnchoredHeading from "@/components/AnchoredHeading";
import HomeLabNetworkFlow from "./HomeLabNetworkFlow";
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
						<strong>
							Internet → pfSense WAN :7000 → HAProxy → TrueNAS 172.17.0.24:7000
						</strong>
					</div>
					<p className="small mb-3">
						TrueNAS is intentionally published on TCP/7000 by HAProxy running on
						pfSense. HAProxy terminates the public Let&apos;s Encrypt TLS connection and
						re-encrypts the backend connection to the TrueNAS HTTPS service. This
						TrueNAS path is a direct HAProxy publication, not a Cloudflare Tunnel.
					</p>
					<HomeLabNetworkFlow />
					<ul className={`${styles.facts} small mb-0`}>
						<li>
							<strong>TCP/7000 — TrueNAS HTTPS/API:</strong> intentionally reachable from
							the Internet through pfSense HAProxy; backend 172.17.0.24:7000 uses TLS.
						</li>
						<li>
							<strong>TCP/10443 — pfSense admin UI:</strong> reachable from the trusted
							LAN/VPN only; a successful FastAPI Cloud or Internet probe is a security
							configuration failure.
						</li>
						<li>
							<strong>TCP/9922 — TrueNAS SSH:</strong> LAN-only and expected to be blocked
							from the Internet.
						</li>
						<li>
							<strong>Cloudflare:</strong> the <code>nabla-truescale</code> connector
							publishes selected services separately; its health does not explain or
							replace the direct TrueNAS HAProxy path on port 7000.
						</li>
						<li>R7000: access-point mode; pfSense remains gateway and DHCP authority.</li>
						<li>
							DNS resilience target: keep pfSense/Unbound available independently from
							TrueNAS Apps; Pi-hole and AdGuard Home should provide filtering without
							making a TrueNAS/Docker outage a LAN-wide DNS outage.
						</li>
						<li>Observed S24 Ultra / Free Mobile public source: 37.166.227.161.</li>
						<li>Observed FastAPI Cloud probe source: 34.200.20.162.</li>
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
