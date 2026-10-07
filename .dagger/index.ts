import {
	Container,
	Directory,
	argument,
	dag,
	func,
	object,
} from "@dagger.io/dagger";

const NPM_VERSION = "11.17.0";
const NODE_DEVELOPMENT = "26.8.2";
const NODE_VERCEL = "24.11.0";
const SOURCE_IGNORE = [
	".git",
	".git/**",
	".next",
	".next/**",
	".vercel",
	".vercel/**",
	"node_modules",
	"node_modules/**",
	"playwright-report",
	"playwright-report/**",
	"test-results",
	"test-results/**",
	"reports",
	"reports/**",
	".env",
	".env.*",
];

@object()
export class NablaSiteAlbanCi {
	private environment(source: Directory, nodeVersion: string): Container {
		return dag
			.container()
			.from(`node:${nodeVersion}-bookworm-slim`)
			.withMountedCache(
				"/root/.npm",
				dag.cacheVolume(`nabla-site-alban-npm-${nodeVersion}`),
			)
			.withDirectory("/src", source)
			.withWorkdir("/src")
			.withEnvVariable("CI", "true")
			.withExec([
				"npm",
				"install",
				"--global",
				`npm@${NPM_VERSION}`,
				"--no-audit",
				"--no-fund",
			])
			.withExec(["npm", "ci", "--no-audit", "--no-fund"]);
	}

	private buildEnvironment(
		source: Directory,
		nodeVersion: string,
	): Container {
		return this.environment(source, nodeVersion).withMountedCache(
			"/src/.next/cache",
			dag.cacheVolume(`nabla-site-alban-next-${nodeVersion}`),
		);
	}

	private async runNode26(source: Directory): Promise<void> {
		const environment = this.environment(source, NODE_DEVELOPMENT);
		await Promise.all([
			environment.withExec(["npm", "run", "lint"]).stdout(),
			environment.withExec(["npm", "run", "lint:css"]).stdout(),
			environment.withExec(["npm", "run", "typecheck"]).stdout(),
			environment.withExec(["npm", "run", "test:unit"]).stdout(),
			this.buildEnvironment(source, NODE_DEVELOPMENT)
				.withExec(["npm", "run", "build"])
				.stdout(),
		]);
	}

	private async runNode24(source: Directory): Promise<void> {
		await this.buildEnvironment(source, NODE_VERCEL)
			.withExec(["npm", "run", "build"])
			.stdout();
	}

	@func()
	async checkNode26(
		@argument({ defaultPath: "/", ignore: SOURCE_IGNORE })
		source: Directory,
	): Promise<string> {
		await this.runNode26(source);
		return `Node ${NODE_DEVELOPMENT}: lint, stylelint, typecheck, unit and build passed`;
	}

	@func()
	async checkNode24(
		@argument({ defaultPath: "/", ignore: SOURCE_IGNORE })
		source: Directory,
	): Promise<string> {
		await this.runNode24(source);
		return `Node ${NODE_VERCEL}: production build passed`;
	}

	@func()
	async check(
		@argument({ defaultPath: "/", ignore: SOURCE_IGNORE })
		source: Directory,
	): Promise<string> {
		await Promise.all([this.runNode26(source), this.runNode24(source)]);
		return [
			"Dagger PoC passed",
			`Node ${NODE_DEVELOPMENT}: lint + stylelint + typecheck + unit + build`,
			`Node ${NODE_VERCEL}: build compatibility`,
		].join("\n");
	}
}
