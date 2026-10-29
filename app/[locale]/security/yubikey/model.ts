/** Public conceptual topology only: no device identifiers or secrets. */
export const YUBIKEY_GRAPH_NODES = [
	{ id: "workstation", x: 0, y: 230, kind: "actor" },
	{ id: "primary", x: 265, y: 120, kind: "key" },
	{ id: "backup", x: 265, y: 390, kind: "key" },
	{ id: "webauthn", x: 560, y: 0, kind: "service" },
	{ id: "ssh", x: 560, y: 120, kind: "service" },
	{ id: "piv", x: 560, y: 240, kind: "service" },
	{ id: "openpgp", x: 560, y: 360, kind: "service" },
	{ id: "otp", x: 560, y: 480, kind: "service" },
	{ id: "recovery", x: 850, y: 320, kind: "recovery" },
	{ id: "escrow", x: 850, y: 440, kind: "recovery" },
	{ id: "vault", x: 850, y: 560, kind: "recovery" },
] as const;

export const YUBIKEY_GRAPH_EDGES = [
	{ id: "primary", source: "workstation", target: "primary" },
	{ id: "backup", source: "workstation", target: "backup" },
	{ id: "webauthn", source: "primary", target: "webauthn" },
	{ id: "ssh", source: "primary", target: "ssh" },
	{ id: "piv", source: "primary", target: "piv" },
	{ id: "openpgp", source: "primary", target: "openpgp" },
	{ id: "otp", source: "primary", target: "otp" },
	{ id: "recovery", source: "backup", target: "recovery" },
	{ id: "escrow", source: "backup", target: "escrow" },
	{ id: "vault", source: "backup", target: "vault" },
] as const;
