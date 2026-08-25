export const CURRENT_BUILD_TOTAL_EUR = 1184.31;

export const FAST_POOL_PRODUCT = {
	href: "https://www.amazon.fr/dp/B09H1CKTFP",
	unitPriceEur: 299.99,
	quantity: 2,
} as const;

export const REUSED_COMPONENT_ICONS = [
	"fa-cube",
	"fa-plug",
	"fa-hard-drive",
	"fa-hdd",
] as const;

export const HARDWARE_PURCHASES = [
	{
		icon: "fa-server",
		name: "MSI MPG B650I Edge WiFi",
		href: "https://www.amazon.fr/dp/B0BHCRX6K7",
	},
	{
		icon: "fa-hard-drive",
		name: "ORICO mSATA SSD enclosure (USB 3.0, 5 Gbps)",
		href: "https://www.amazon.fr/dp/B0CKP48DMB",
	},
	{
		icon: "fa-fan",
		name: "Noctua NH-L9a-AM5",
		href: "https://www.amazon.fr/dp/B0BNL8ZM1T",
	},
	{
		icon: "fa-microchip",
		name: "AMD Ryzen 7 7700",
		href: "https://www.amazon.fr/dp/B0C3T39N6P",
	},
	{
		icon: "fa-memory",
		name: "Crucial DDR5 64 GB 5600 MHz",
		href: "https://www.amazon.fr/dp/B0DSQP6YR9",
	},
	{ icon: "fa-plug", name: "ATX 500 W PSU" },
] as const;

export const GPU_OPTIONS = [
	{
		name: "PNY NVIDIA RTX PRO 4000 Blackwell SFF Edition",
		vram: "24 GB GDDR7 ECC",
		power: "70 W",
		priceEur: 2483,
		priceMode: "observed",
		productHref: "https://www.amazon.fr/dp/B0GLJFC411",
		priceHref:
			"https://www.idealo.fr/prix/207997856/pny-nvidia-rtx-pro-4000-blackwell-sff.html",
		recommended: true,
	},
	{
		name: "NVIDIA RTX PRO 5000 Blackwell",
		vram: "48 GB GDDR7 ECC",
		power: "300 W",
		priceEur: 7172.61,
		priceMode: "from",
		productHref:
			"https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-5000/",
		priceHref:
			"https://www.idealo.fr/prix/211801592/nvidia-rtx-pro-5000-blackwell-48-go.html",
		recommended: false,
	},
	{
		name: "NVIDIA RTX PRO 6000 Blackwell Max-Q",
		vram: "96 GB GDDR7 ECC",
		power: "300 W",
		priceEur: 18888.97,
		priceMode: "from",
		productHref:
			"https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000-max-q/",
		priceHref:
			"https://www.idealo.fr/prix/206565584/nvidia-rtx-pro-6000-blackwell-max-q.html",
		recommended: false,
	},
] as const;

export type InferenceModelRow = {
	name: string;
	memory: string;
	speed: string;
	speedKind: "measured" | "estimated";
	parallel: string;
};

export const GPU_MODELS: ReadonlyArray<InferenceModelRow> = [
	{
		name: "gpt-oss-20b MXFP4",
		memory: "11.27 GiB",
		speed: "109.7 tok/s",
		speedKind: "measured",
		parallel: "4–8",
	},
	{
		name: "Qwen3.6-35B-A3B-MTP IQ4_NL",
		memory: "17.25 GiB",
		speed: "95.9 tok/s",
		speedKind: "measured",
		parallel: "2–4",
	},
	{
		name: "Qwen3-Coder-30B-A3B-Instruct Q4_K_M",
		memory: "~18.6 GB",
		speed: "~70–100 tok/s",
		speedKind: "estimated",
		parallel: "2–4",
	},
	{
		name: "MADLAD-400-10B-MT 4-bit",
		memory: "~6–8 GB",
		speed: "~30–60 tok/s",
		speedKind: "estimated",
		parallel: "8+",
	},
];

export const RAM_MODELS: ReadonlyArray<InferenceModelRow> = [
	{
		name: "gpt-oss-120b MXFP4",
		memory: "63.4 GB",
		speed: "~20–30 tok/s",
		speedKind: "estimated",
		parallel: "1–2",
	},
	{
		name: "Llama 3.3 70B Instruct Q4_K_M",
		memory: "~42 GB",
		speed: "~2–4 tok/s",
		speedKind: "estimated",
		parallel: "1",
	},
	{
		name: "NVIDIA Nemotron 3 Super 120B-A12B (quantized)",
		memory: "~65 GB",
		speed: "~8–16 tok/s",
		speedKind: "estimated",
		parallel: "1",
	},
];

export const EXACT_GPU_BENCHMARK_URL = "https://github.com/mmontes11/llm-bench";
