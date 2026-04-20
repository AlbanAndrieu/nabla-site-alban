declare const process: {
	env: Record<string, string | undefined>;
	cwd(): string;
	exitCode?: number;
};

declare const console: {
	log: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
};

declare function fetch(
	input: string,
	init?: {
		method?: string;
		headers?: Record<string, string>;
		body?: string;
	},
): Promise<{
	ok: boolean;
	status: number;
	json(): Promise<unknown>;
}>;
