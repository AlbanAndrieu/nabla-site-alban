import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function deploymentGitSha() {
	return (
		process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
		process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.trim() ||
		""
	);
}

function deploymentEnvironment() {
	return (
		process.env.VERCEL_TARGET_ENV?.trim() ||
		process.env.VERCEL_ENV?.trim() ||
		process.env.NEXT_PUBLIC_VERCEL_ENV?.trim() ||
		""
	);
}

export function GET() {
	const gitSha = deploymentGitSha();
	const environment = deploymentEnvironment();

	if (!gitSha) {
		return NextResponse.json(
			{ error: "Deployment identity unavailable" },
			{
				status: 503,
				headers: {
					"Cache-Control": "no-store",
					"X-Robots-Tag": "noindex, nofollow",
				},
			},
		);
	}

	return NextResponse.json(
		{
			gitSha,
			environment: environment || null,
		},
		{
			headers: {
				"Cache-Control": "no-store",
				"X-Robots-Tag": "noindex, nofollow",
			},
		},
	);
}
