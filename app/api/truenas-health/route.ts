import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TRUENAS_HEALTH_URL =
	"https://truenas.albandrieu.com:7000/ui/signin";
const TIMEOUT_MS = 3000;

export async function GET() {
	const url =
		process.env.TRUENAS_PUBLIC_HEALTH_URL?.trim() || DEFAULT_TRUENAS_HEALTH_URL;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
	const startedAt = performance.now();

	try {
		const response = await fetch(url, {
			method: "GET",
			redirect: "manual",
			cache: "no-store",
			signal: controller.signal,
			headers: {
				Accept: "text/html,application/xhtml+xml",
				"User-Agent": "nabla-site-truenas-health/1.0",
			},
		});
		const reachable = response.status >= 200 && response.status < 500;
		return NextResponse.json(
			{
				name: "TrueNAS",
				url,
				reachable,
				http_status: response.status,
				state: reachable ? "ok" : "fail",
				tls_trusted: true,
				latency_ms: Math.max(0, Math.round(performance.now() - startedAt)),
			},
			{
				status: reachable ? 200 : 503,
				headers: { "Cache-Control": "no-store" },
			},
		);
	} catch (error) {
		return NextResponse.json(
			{
				name: "TrueNAS",
				url,
				reachable: false,
				http_status: 0,
				state: "fail",
				tls_trusted: null,
				latency_ms: Math.max(0, Math.round(performance.now() - startedAt)),
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 503, headers: { "Cache-Control": "no-store" } },
		);
	} finally {
		clearTimeout(timeout);
	}
}
