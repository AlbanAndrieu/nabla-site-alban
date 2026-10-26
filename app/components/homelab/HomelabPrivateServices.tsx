"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale } from "next-intl";
import styles from "./HomelabServicesSection.module.css";
import useHomelabAccess from "./useHomelabAccess";
import useAuthorizedLayoutHold from "./useAuthorizedLayoutHold";

// Loaded only after the server confirmed owner access, so anonymous visitors
// never download nor render the operational views.
const HomelabServicesBlock = dynamic(() => import("./HomelabServicesBlock"), {
	ssr: false,
});
const HomelabOperationsDisclosure = dynamic(
	() => import("./HomelabOperationsDisclosure"),
	{ ssr: false },
);

/** Owner-only TrueNAS services; visitors get an operations link, not private data. */
export default function HomelabPrivateServices() {
	const french = useLocale() === "fr";
	const access = useHomelabAccess();
	const { regionRef, reservedHeight } = useAuthorizedLayoutHold(
		access === "trusted" || access === "readonly",
	);
	if (access === "pending") {
		return <div data-homelab-access-rechecking aria-hidden="true"
			style={{ minHeight: reservedHeight }} />;
	}
	if (access === "denied")
		return (
			<p data-homelab-private-denied>
				<a href="https://ops.albandrieu.com/" rel="nofollow noreferrer">
					{french ? "Espace opérations privé" : "Private operations"}
				</a>{" "}
				<Link
					href="/api/homelab-access?diagnose=1"
					prefetch={false}
					rel="nofollow"
					data-homelab-access-diagnostic
				>
					{french ? "Diagnostic d’accès" : "Access diagnostics"}
				</Link>
			</p>
		);
	if (access === "readonly")
		return (
			<div ref={regionRef} data-homelab-access-region>
				<div data-homelab-public-readonly-view>
					<HomelabServicesBlock readOnly />
				</div>
			</div>
		);
	return (
		<div ref={regionRef} data-homelab-access-region>
			<div data-homelab-private-view>
				<div className={styles.serviceFirst} data-service-first-homelab-view>
					<HomelabServicesBlock />
				</div>
				<HomelabOperationsDisclosure />
			</div>
		</div>
	);
}
