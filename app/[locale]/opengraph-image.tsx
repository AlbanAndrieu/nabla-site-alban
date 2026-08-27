import { ImageResponse } from "next/og";

export const alt =
	"Alban Andrieu — DevSecOps, Cloud Security & AI Infrastructure";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const french = locale === "fr";

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: "64px 72px",
				background:
					"linear-gradient(135deg, #06111f 0%, #0a2239 48%, #123b50 100%)",
				color: "#f8fafc",
				fontFamily: "Arial, Helvetica, sans-serif",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "18px",
					}}
				>
					<div
						style={{
							width: "58px",
							height: "58px",
							borderRadius: "16px",
							border: "2px solid rgba(125, 211, 252, 0.65)",
							background: "rgba(14, 165, 233, 0.16)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "30px",
							fontWeight: 800,
						}}
					>
						A
					</div>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<div style={{ fontSize: "28px", fontWeight: 750 }}>
							Alban Andrieu
						</div>
						<div style={{ fontSize: "18px", color: "#bae6fd" }}>
							albanandrieu.com
						</div>
					</div>
				</div>
				<div
					style={{
						fontSize: "17px",
						fontWeight: 700,
						letterSpacing: "0.14em",
						textTransform: "uppercase",
						color: "#7dd3fc",
					}}
				>
					DevSecOps · Cloud · AI
				</div>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
				<div
					style={{
						fontSize: "64px",
						lineHeight: 1.02,
						fontWeight: 800,
						maxWidth: "960px",
						letterSpacing: "-0.035em",
					}}
				>
					{french
						? "Sécurité cloud, plateformes et infrastructure IA"
						: "Cloud security, platforms & AI infrastructure"}
				</div>
				<div
					style={{
						fontSize: "25px",
						lineHeight: 1.35,
						color: "#cbd5e1",
						maxWidth: "940px",
					}}
				>
					{french
						? "Architecture, DevSecOps, Kubernetes, observabilité, conformité et gouvernance des systèmes IA."
						: "Architecture, DevSecOps, Kubernetes, observability, compliance and AI systems governance."}
				</div>
			</div>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					fontSize: "18px",
					color: "#94a3b8",
				}}
			>
				<div>Senior DevSecOps · Security Platform Engineering</div>
				<div>
					{french ? "France · Europe · Remote" : "France · Europe · Remote"}
				</div>
			</div>
		</div>,
		{ ...size },
	);
}
