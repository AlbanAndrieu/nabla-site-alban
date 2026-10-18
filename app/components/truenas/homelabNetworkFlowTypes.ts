export type NetworkZone =
	| "wan"
	| "gateway"
	| "lan"
	| "wifi"
	| "cloudflare"
	| "proxy"
	| "container"
	| "app";
export type PathMode = "all" | "direct" | "tunnel" | "dns" | "lan";
export type LinkKind = "wan" | "lan" | "wifi" | "direct" | "tunnel" | "dns";
export type FailureDomain = "external" | "gateway" | "lan" | "truenas";

export type NetworkNodeData = Record<string, unknown> & {
	name: string;
	role: string;
	address?: string;
	secondaryAddress?: string;
	badge?: string;
	icon: string;
	zone: NetworkZone;
};

export type GroupNodeData = Record<string, unknown> & {
	label: string;
	description: string;
	domain: FailureDomain;
	count: number;
};

export type NetworkNodeSpec = {
	id: string;
	domain: FailureDomain;
	data: NetworkNodeData;
};

export type NetworkEdgeSpec = {
	id: string;
	source: string;
	target: string;
	label: string;
	kind: LinkKind;
};
