#!/usr/bin/env node
/** Read-only and deterministic where possible. Not a billable-token benchmark. */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sources = ["AGENTS.md", ".opencode/prompts/repository-build.txt"];

export function median(samples) {
	if (!samples.length || !samples.every(Number.isFinite)) return null;
	const sorted = [...samples].sort((a, b) => a - b);
	return sorted[Math.floor((sorted.length - 1) / 2)];
}

export function summarize(chars, durations, gitAvailable) {
	return {
		agentInstructionBytes: chars[0],
		openCodePromptBytes: chars[1],
		taskHintMedianMs: gitAvailable ? median(durations) : null,
		samples: gitAvailable ? durations.length : 0,
		tokenCost: "UNKNOWN",
		publication: "NOT_RUN",
	};
}

export function run(options = {}) {
	const cwd = options.cwd ?? root;
	const samples = options.samples ?? 3;
	if (!Number.isInteger(samples) || samples < 1 || samples > 10) {
		console.error("AGENT_BENCH_INVALID_SAMPLES");
		return 2;
	}
	const sizes = sources.map((path) => {
		try {
			return Buffer.byteLength(readFileSync(resolve(cwd, path), "utf8"));
		} catch {
			return null;
		}
	});
	if (sizes.some((size) => size === null)) {
		console.error("AGENT_BENCH_INCOMPLETE_CHECKOUT");
		return 3;
	}
	const durations = [];
	for (let i = 0; i < samples; i++) {
		const start = performance.now();
		const result = spawnSync(
			process.execPath,
			[resolve(cwd, "scripts/agent-task-context.mjs"), "--task", "agent"],
			{
				cwd,
				encoding: "utf8",
				timeout: 8_000,
				maxBuffer: 32_768,
			},
		);
		if (result.status !== 0 || !result.stdout?.includes("L3: NOT_RUN")) {
			console.log(JSON.stringify(summarize(sizes, [], false)));
			console.error("AGENT_BENCH_BLOCKED_NO_GIT_OR_RUNTIME");
			return 3;
		}
		durations.push(Math.round(10 * (performance.now() - start)) / 10);
	}
	console.log(JSON.stringify(summarize(sizes, durations, true)));
	console.log(
		"AGENT_BENCH: local process latency only; not a model-token or network metric",
	);
	return 0;
}

if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
	process.exitCode = run();
