import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_TITLE_LENGTH = 90;

function sanitizeTitle(value: string | null) {
	const title = value?.trim().replace(/\s+/g, " ") || "Alban Andrieu";
	return title.length > MAX_TITLE_LENGTH
		? `${title.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`
		: title;
}

export function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const locale = searchParams.get("locale") === "fr" ? "fr" : "en";
	const title = sanitizeTitle(searchParams.get("title"));
	const eyebrow = locale === "fr" ? "DevSecOps · Cloud · IA" : "DevSecOps · Cloud · AI";
	const footer =
		locale === "fr"
			? "Sécurité cloud · Platform Engineering · Infrastructure IA"
			: "Cloud Security · Platform Engineering · AI Infrastructure";

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
						"linear-gradient(135deg, #07111f 0%, #10253d 52%, #173f55 100%)",
					color: "#f8fafc",
					fontFamily: "sans-serif",
				}}
			>
				<div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
					<div
						style={{
							display: "flex",
							fontSize: 30,
							fontWeight: 700,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "#67e8f9",
						}}
					>
						{eyebrow}
					</div>
					<div
						style={{
							display: "flex",
							maxWidth: 1030,
							fontSize: title.length > 62 ? 58 : 68,
							lineHeight: 1.08,
							fontWeight: 800,
							letterSpacing: "-0.035em",
						}}
					>
						{title}
					</div>
				</div>

				<div
					style={{
						display: "flex",
						alignItems: "flex-end",
						justifyContent: "space-between",
						gap: 40,
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
						<div style={{ display: "flex", fontSize: 31, fontWeight: 700 }}>
							Alban Andrieu
						</div>
						<div style={{ display: "flex", fontSize: 23, color: "#cbd5e1" }}>
							{footer}
						</div>
					</div>
					<div
						style={{
							display: "flex",
							fontSize: 23,
							fontWeight: 600,
							color: "#a5f3fc",
						}}
					>
						albanandrieu.com
					</div>
				</div>
			</div>
		),
		{
			width: WIDTH,
			height: HEIGHT,
			headers: {
				"Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
			},
		},
	);
}
