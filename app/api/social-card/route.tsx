import { ImageResponse } from "next/og";
import { SOCIAL_CARD_HEIGHT, SOCIAL_CARD_WIDTH } from "@/lib/socialMetadata";

export const runtime = "nodejs";

const MAX_TITLE_LENGTH = 110;
const MAX_DESCRIPTION_LENGTH = 220;

function bounded(value: string | null, fallback: string, maximum: number) {
	const normalized = value?.trim() || fallback;
	return normalized.length <= maximum
		? normalized
		: `${normalized.slice(0, maximum - 1).trimEnd()}…`;
}

export function GET(request: Request) {
	const url = new URL(request.url);
	const locale = url.searchParams.get("locale") === "fr" ? "fr" : "en";
	const title = bounded(
		url.searchParams.get("title"),
		"Alban Andrieu · DevSecOps & Cloud Security",
		MAX_TITLE_LENGTH,
	);
	const description = bounded(
		url.searchParams.get("description"),
		locale === "fr"
			? "DevSecOps, sécurité cloud, IA sécurisée et architecture de plateformes."
			: "DevSecOps, cloud security, secure AI, and platform architecture.",
		MAX_DESCRIPTION_LENGTH,
	);

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: "72px 82px",
					background:
						"linear-gradient(135deg, #07111f 0%, #10233b 58%, #18354d 100%)",
					color: "#f7fafc",
					fontFamily: "Arial, Helvetica, sans-serif",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: "82px",
							height: "82px",
							borderRadius: "22px",
							background: "#42c9b7",
							color: "#07111f",
						}}
					>
						<svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true">
							<path
								d="M7 9h40L27 47 7 9Z"
								fill="none"
								stroke="currentColor"
								strokeWidth="6"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<span style={{ fontSize: "30px", fontWeight: 700 }}>Alban Andrieu</span>
						<span style={{ fontSize: "22px", color: "#9bded5" }}>
							DevSecOps · Cloud Security · Secure AI
						</span>
					</div>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
					<div
						style={{
							fontSize: title.length > 78 ? "50px" : "58px",
							fontWeight: 800,
							lineHeight: 1.08,
							letterSpacing: "-1.5px",
						}}
					>
						{title}
					</div>
					<div
						style={{
							fontSize: "27px",
							lineHeight: 1.35,
							color: "#d7e5ef",
							maxWidth: "980px",
						}}
					>
						{description}
					</div>
				</div>

				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						fontSize: "22px",
						color: "#a9bfd1",
					}}
				>
					<span>albanandrieu.com</span>
					<span>{locale === "fr" ? "FR" : "EN"}</span>
				</div>
			</div>
		),
		{
			width: SOCIAL_CARD_WIDTH,
			height: SOCIAL_CARD_HEIGHT,
		},
	);
}
