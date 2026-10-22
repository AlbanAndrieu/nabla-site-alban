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
	let reason: string;
	if (!platformTrusted) reason = "runtime-unverified";
	else if (cidrs.length === 0) reason = "trusted-cidrs-not-configured";
	else if (family === 0) reason = "client-ip-unavailable";
	else if (!networkAllowed) {
		reason =
			trusted &&
			identityRequired &&
			(env.HOMELAB_OWNER_REMOTE_ACCESS_ENABLED === undefined ||
				env.HOMELAB_OWNER_REMOTE_ACCESS_ENABLED.trim().toLowerCase() === "true")
				? "authorized-remote-identity"
				: "client-ip-outside-trusted-cidrs";
	} else if (identityRequired && !trusted) reason = "identity-not-authorized";
	else reason = "authorized";
	return {
		reason,
		sourceFamily,
		trustedCidrsConfigured: cidrs.length > 0,
		networkAllowed,
		identityRequired,
	};
}
