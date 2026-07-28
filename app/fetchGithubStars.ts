import { trace } from "@opentelemetry/api";

const REPOSITORY_URL =
	"https://api.github.com/repos/AlbanAndrieu/nabla-site-alban";

export function githubStarsFromResponse(payload: unknown): number {
	if (
		typeof payload !== "object" ||
		payload === null ||
		!("stargazers_count" in payload) ||
		typeof payload.stargazers_count !== "number" ||
		!Number.isInteger(payload.stargazers_count) ||
		payload.stargazers_count < 0
	) {
		throw new Error("GitHub returned an invalid stargazers_count");
	}

	return payload.stargazers_count;
}

export async function fetchGithubStars(): Promise<number> {
	return trace
		.getTracer("nabla-site")
		.startActiveSpan("fetchGithubStars", async (span) => {
			try {
				const response = await fetch(REPOSITORY_URL, {
					headers: { Accept: "application/vnd.github+json" },
					next: { revalidate: 3600 },
					signal: AbortSignal.timeout(5_000),
				});
				if (!response.ok) {
					throw new Error(`GitHub API request failed (${response.status})`);
				}

				return githubStarsFromResponse(await response.json());
			} catch (error) {
				span.recordException(
					error instanceof Error
						? error
						: new Error("Unknown GitHub API error"),
				);
				throw error;
			} finally {
				span.end();
			}
		});
}
