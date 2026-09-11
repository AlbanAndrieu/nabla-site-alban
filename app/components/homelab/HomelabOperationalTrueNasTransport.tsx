"use client";

import { useLocale } from "next-intl";
import type { HomelabObservabilitySnapshot } from "@/lib/homelabObservability";
import { readHomelabOperatorDiagnostics } from "@/lib/homelabOperatorDiagnostics";

type Props = {
	evidence: HomelabObservabilitySnapshot;
};

export default function HomelabOperationalTrueNasTransport({
	evidence,
}: Readonly<Props>) {
	const french = useLocale() === "fr";
	const transport = evidence.healthSnapshot
		? readHomelabOperatorDiagnostics(evidence.healthSnapshot).trueNasTransport
		: undefined;
	if (!transport) return null;

	return (
		<section
			className="mt-3 rounded border border-secondary p-3"
			data-observed-truenas-api-transport="websocket-jsonrpc"
			aria-label={
				french
					? "Transport observé de l’API TrueNAS"
					: "Observed TrueNAS API transport"
			}
		>
			<h3 className="h6 mb-2">
				{french ? "Transport API TrueNAS observé" : "Observed TrueNAS API transport"}
			</h3>
			<p className="small mb-0 text-break">
				<code>websocket-jsonrpc</code>
				{transport.pathMode ? ` · ${transport.pathMode}` : ""}
				{transport.websocketUri ? ` · ${transport.websocketUri}` : ""}
				{transport.verifySsl !== undefined
					? ` · verify TLS=${String(transport.verifySsl)}`
					: ""}
				{transport.timedOut ? " · timed out" : ""}
				{transport.errorKind ? ` · ${transport.errorKind}` : ""}
			</p>
		</section>
	);
}
