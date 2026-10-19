import { privateHomelabResponse } from "@/lib/privateHomelabResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Operational evidence belongs behind Cloudflare Access, not public Vercel. */
export function GET() {
	return privateHomelabResponse();
}
