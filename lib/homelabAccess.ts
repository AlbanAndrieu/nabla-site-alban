/**
 * Owner-network gate for the private homelab views and their data APIs.
 *
 * An owner is normally restricted to HOMELAB_TRUSTED_CIDRS.
 * TEMPORARY: authenticated Cloudflare Access owners may connect from
 * outside the home CIDR while HOMELAB_OWNER_REMOTE_ACCESS_ENABLED=true.
 * No JWT or only a spoofed forwarding header is never sufficient.
 *
 * A remote identity requires valid signed Access JWT and verified Vercel runtime.
 * Anonymous network failures never authorize protected OWNER data.
 * Hiding UI is not access control: every data route must call this gate too.
 */

export type HomelabAccessVia = "trusted-network" | "cloudflare-access";

export type HomelabAccessDecision =
	| { trusted: true; via: HomelabAccessVia }
	| { trusted: false; via: null };

const PUBLIC: HomelabAccessDecision = { trusted: false, via: null };

type ParsedCidr = { version: 4 | 6; network: bigint; prefix: number };

// BigInt() calls instead of literals: the tsconfig target predates ES2020.
const ZERO = BigInt(0);
const OCTET_BITS = BigInt(8);
const HEXTET_BITS = BigInt(16);
const IPV4_BITS = BigInt(32);
const HEXTET_MASK = BigInt(0xffff);
const IPV4_MASK = BigInt(0xffffffff);

function parseIPv4(value: string): bigint | null {
	const parts = value.split(".");
	if (parts.length !== 4) return null;
	let result = ZERO;
	for (const part of parts) {
		if (!/^\d{1,3}$/.test(part)) return null;
		const octet = Number(part);
		if (octet > 255) return null;
		result = (result << OCTET_BITS) | BigInt(octet);
	}
	return result;
}

function parseIPv6(value: string): bigint | null {
	let input = value.toLowerCase();
	// IPv4-mapped tail (::ffff:203.0.113.7) is expanded to two hextets.
	const v4Tail = input.match(/^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/);
	if (v4Tail) {
		const v4 = parseIPv4(v4Tail[2]);
		if (v4 === null) return null;
		input = `${v4Tail[1]}${(v4 >> HEXTET_BITS).toString(16)}:${(v4 & HEXTET_MASK).toString(16)}`;
	}
	const halves = input.split("::");
	if (halves.length > 2) return null;
	const head = halves[0] ? halves[0].split(":") : [];
	const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
	const missing = 8 - head.length - tail.length;
	if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
	const groups = [...head, ...Array(missing).fill("0"), ...tail];
	let result = ZERO;
	for (const group of groups) {
		if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
		result = (result << HEXTET_BITS) | BigInt(Number.parseInt(group, 16));
	}
	return result;
}

function parseIp(value: string): { version: 4 | 6; address: bigint } | null {
	const trimmed = value.trim();
	const v4 = parseIPv4(trimmed);
	if (v4 !== null) return { version: 4, address: v4 };
	const v6 = parseIPv6(trimmed);
	if (v6 === null) return null;
	// Treat IPv4-mapped IPv6 (::ffff:a.b.c.d) as the IPv4 address it carries.
	if (v6 >> IPV4_BITS === HEXTET_MASK)
		return { version: 4, address: v6 & IPV4_MASK };
	return { version: 6, address: v6 };
}

/** Parse a comma/space separated CIDR list; invalid entries are ignored. */
export function parseTrustedCidrs(value: string | undefined): ParsedCidr[] {
	if (!value) return [];
	const cidrs: ParsedCidr[] = [];
	for (const entry of value.split(/[\s,]+/)) {
		if (!entry) continue;
		const [address, prefixText] = entry.split("/");
		const ip = parseIp(address ?? "");
		if (!ip) continue;
		const width = ip.version === 4 ? 32 : 128;
		const prefix = prefixText === undefined ? width : Number(prefixText);
		if (!Number.isInteger(prefix) || prefix < 0 || prefix > width) continue;
		// A /0 would trust the whole Internet: refuse it explicitly.
		if (prefix === 0) continue;
		const shift = BigInt(width - prefix);
		cidrs.push({
			version: ip.version,
			network: (ip.address >> shift) << shift,
			prefix,
		});
	}
	return cidrs;
}

export function isIpInCidrs(ip: string, cidrs: ParsedCidr[]): boolean {
	const parsed = parseIp(ip);
	if (!parsed) return false;
	const width = parsed.version === 4 ? 32 : 128;
	return cidrs.some((cidr) => {
		if (cidr.version !== parsed.version) return false;
		const shift = BigInt(width - cidr.prefix);
		return (parsed.address >> shift) << shift === cidr.network;
	});
}

/**
 * The client address as set by the Vercel edge. Outside Vercel the header is
 * client-controlled, so no address is trusted at all.
 */
export function vercelClientIp(
	headers: Headers,
	env: Record<string, string | undefined> = process.env,
): string | null {
	if (env.VERCEL !== "1") return null;
	const realIp = headers.get("x-real-ip")?.trim();
	if (!realIp || /[,\r\n\s]/.test(realIp)) return null;
	return realIp;
}

type Jwk = JsonWebKey & { kid?: string };
type JwksCache = { url: string; keys: Jwk[]; expiresAt: number };
let jwksCache: JwksCache | null = null;
const JWKS_TTL_MS = 60 * 60 * 1000;
const CLOCK_SKEW_SECONDS = 60;

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/");
	const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
	const bytes = new Uint8Array(new ArrayBuffer(binary.length));
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
}

function decodeJsonPart(part: string): Record<string, unknown> | null {
	try {
		const parsed: unknown = JSON.parse(
			new TextDecoder().decode(base64UrlDecode(part)),
		);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

/** Normalise `https://team.cloudflareaccess.com/` to its origin, or null. */
export function cloudflareAccessIssuer(teamDomain: string | undefined) {
	if (!teamDomain) return null;
	try {
		const url = new URL(
			teamDomain.includes("://") ? teamDomain : `https://${teamDomain}`,
		);
		if (url.protocol !== "https:") return null;
		if (!url.hostname.endsWith(".cloudflareaccess.com")) return null;
		return url.origin;
	} catch {
		return null;
	}
}

async function loadAccessKeys(
	issuer: string,
	fetchImpl: typeof fetch,
	now: number,
): Promise<Jwk[]> {
	const url = `${issuer}/cdn-cgi/access/certs`;
	if (jwksCache && jwksCache.url === url && jwksCache.expiresAt > now) {
		return jwksCache.keys;
	}
	const response = await fetchImpl(url, {
		cache: "no-store",
		signal: AbortSignal.timeout(3_000),
	});
	if (!response.ok) return [];
	const body = (await response.json()) as { keys?: unknown };
	const keys = Array.isArray(body.keys)
		? (body.keys.filter(
				(key) => key && typeof key === "object" && (key as Jwk).kty === "RSA",
			) as Jwk[])
		: [];
	jwksCache = { url, keys, expiresAt: now + JWKS_TTL_MS };
	return keys;
}

/** Test hook: forget cached Cloudflare Access signing keys. */
export function resetHomelabAccessCacheForTests() {
	jwksCache = null;
}

export async function verifyCloudflareAccessJwt(
	token: string,
	options: {
		issuer: string;
		audience: string;
		fetchImpl?: typeof fetch;
		now?: number;
	},
): Promise<boolean> {
	const parts = token.split(".");
	if (parts.length !== 3) return false;
	const header = decodeJsonPart(parts[0]);
	const payload = decodeJsonPart(parts[1]);
	if (!header || !payload) return false;
	if (header.alg !== "RS256" || typeof header.kid !== "string") return false;

	const nowMs = options.now ?? Date.now();
	const nowSeconds = Math.floor(nowMs / 1000);
	if (payload.iss !== options.issuer) return false;
	const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
	if (!audiences.includes(options.audience)) return false;
	if (typeof payload.sub !== "string" || !payload.sub.trim()) return false;
	if (payload.type !== "app" || payload.service_token_id || payload.common_name)
		return false;
	if (typeof payload.exp !== "number") return false;
	if (payload.exp + CLOCK_SKEW_SECONDS < nowSeconds) return false;
	if (
		typeof payload.nbf === "number" &&
		payload.nbf - CLOCK_SKEW_SECONDS > nowSeconds
	) {
		return false;
	}

	try {
		const keys = await loadAccessKeys(
			options.issuer,
			options.fetchImpl ?? fetch,
			nowMs,
		);
		const jwk = keys.find((key) => key.kid === header.kid);
		if (!jwk) return false;
		const key = await crypto.subtle.importKey(
			"jwk",
			jwk,
			{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
			false,
			["verify"],
		);
		return await crypto.subtle.verify(
			"RSASSA-PKCS1-v1_5",
			key,
			base64UrlDecode(parts[2]),
			new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
		);
	} catch {
		return false;
	}
}

export async function decideHomelabAccess(
	headers: Headers,
	options: {
		env?: Record<string, string | undefined>;
		fetchImpl?: typeof fetch;
		now?: number;
	} = {},
): Promise<HomelabAccessDecision> {
	const env = options.env ?? process.env;

	const ip = vercelClientIp(headers, env);
	const homeAllowed =
		ip !== null && isIpInCidrs(ip, parseTrustedCidrs(env.HOMELAB_TRUSTED_CIDRS));
	const remoteOwnerEnabled =
		env.VERCEL === "1" &&
		(env.HOMELAB_OWNER_REMOTE_ACCESS_ENABLED === undefined ||
			env.HOMELAB_OWNER_REMOTE_ACCESS_ENABLED.trim().toLowerCase() === "true");
	// Without a home-network match, ONLY a verified Access identity can admit
	// an operator. This temporary flag never makes raw OWNER data anonymous.
	if (!homeAllowed && !remoteOwnerEnabled) return PUBLIC;

	// No configured Access app? Trusted home network remains the sole owner
	// identity signal. A remote request without signed JWT is still rejected.
	if (!env.CF_ACCESS_TEAM_DOMAIN && !env.CF_ACCESS_AUD)
		return homeAllowed ? { trusted: true, via: "trusted-network" } : PUBLIC;

	const token = headers.get("cf-access-jwt-assertion")?.trim();
	const issuer = cloudflareAccessIssuer(env.CF_ACCESS_TEAM_DOMAIN);
	const audience = env.CF_ACCESS_AUD?.trim();
	if (token && issuer && audience) {
		const valid = await verifyCloudflareAccessJwt(token, {
			issuer,
			audience,
			fetchImpl: options.fetchImpl,
			now: options.now,
		});
		if (valid) return { trusted: true, via: "cloudflare-access" };
	}

	return PUBLIC;
}

export async function isTrustedHomelabRequest(
	request: Request,
): Promise<boolean> {
	return (await decideHomelabAccess(request.headers)).trusted;
}
