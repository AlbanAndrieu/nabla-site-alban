import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * SSRF guard: only homelab tunnel hosts we own.
 * Override with comma-separated hostnames via HOMELAB_TUNNEL_CHECK_HOSTS (no scheme).
 */
function allowedHostnames(): Set<string> {
	const env = (process.env.HOMELAB_TUNNEL_CHECK_HOSTS || "")
		.split(",")
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);
	if (env.length > 0) {
		return new Set(env);
	}
	return new Set(["albandrieu.com"]);
}

function isAllowedTunnelUrl(u: URL): boolean {
	if (u.username || u.password) {
		return false;
	}
	if (u.protocol !== "https:" && u.protocol !== "http:") {
		return false;
	}
	const host = u.hostname.toLowerCase();
	const allowed = allowedHostnames();
	for (const base of allowed) {
		if (host === base || host.endsWith(`.${base}`)) {
			return true;
		}
	}
	return false;
}

export async function GET(req: NextRequest) {
	const raw = req.nextUrl.searchParams.get("url");
	if (!raw || typeof raw !== "string") {
		return NextResponse.json({ error: "missing url" }, { status: 400 });
	}
	let target: URL;
	try {
		target = new URL(raw);
	} catch {
		return NextResponse.json({ error: "invalid url" }, { status: 400 });
	}
	if (!isAllowedTunnelUrl(target)) {
		return NextResponse.json({ error: "host not allowed" }, { status: 403 });
	}

	const ac = new AbortController();
	const timer = setTimeout(() => ac.abort(), 10_000);
	try {
		let res = await fetch(target.toString(), {
			method: "HEAD",
			redirect: "follow",
			signal: ac.signal,
			headers: { "user-agent": "nabla-homelab-tunnel-check/1" },
		});
		if (res.status === 405 || res.status === 501) {
			res = await fetch(target.toString(), {
				method: "GET",
				redirect: "follow",
				signal: ac.signal,
				headers: {
					"user-agent": "nabla-homelab-tunnel-check/1",
					Range: "bytes=0-0",
					Accept: "*/*",
				},
			});
		}
		clearTimeout(timer);
		return NextResponse.json(
			{ status: res.status, tlsError: false },
			{ headers: { "Cache-Control": "no-store" } },
		);
	} catch (e: unknown) {
		clearTimeout(timer);
		const msg = e instanceof Error ? e.message : String(e);
		const tls =
			/certificate|CERT_|TLS|SSL|unable to verify|UNABLE_TO_VERIFY/i.test(msg);
		return NextResponse.json(
			{ status: 0, tlsError: tls, error: msg.slice(0, 240) },
			{ headers: { "Cache-Control": "no-store" } },
		);
	}
}
