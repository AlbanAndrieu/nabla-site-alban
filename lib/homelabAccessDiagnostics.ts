import { isIP } from "node:net";
import {
	isIpInCidrs,
	parseTrustedCidrs,
	vercelClientIp,
} from "./homelabAccess";

/** Privacy-safe report for the requester's network; never returns a raw IP.
 * Not an authorization decision: the owner gate still verifies Cloudflare identity.
 */
export function diagnoseHomelabAccessNetwork(
	headers: Headers,
	env: Record<string, string | undefined> = process.env,
	trusted = false,
) {
	const platformTrusted = env.VERCEL === "1";
	const cidrs = parseTrustedCidrs(env.HOMELAB_TRUSTED_CIDRS);
	const ip = vercelClientIp(headers, env);
	const family = isIP(ip ?? "");
	const sourceFamily =
		family === 4 ? "ipv4" : family === 6 ? "ipv6" : "unknown";
	const networkAllowed = ip !== null && isIpInCidrs(ip, cidrs);
	const identityRequired = Boolean(
		env.CF_ACCESS_TEAM_DOMAIN || env.CF_ACCESS_AUD,
	);
	const reason = !platformTrusted
		? "runtime-unverified"
		: cidrs.length === 0
			? "trusted-cidrs-not-configured"
			: family === 0
				? "client-ip-unavailable"
				: !networkAllowed
					? "client-ip-outside-trusted-cidrs"
					: identityRequired && !trusted
						? "identity-not-authorized"
						: "authorized";
	return {
		reason,
		sourceFamily,
		trustedCidrsConfigured: cidrs.length > 0,
		networkAllowed,
		identityRequired,
	};
}
