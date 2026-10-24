import { NextResponse } from "next/server";
import { SiteCatalogV2Error } from "./homelabSiteCatalog";

/** Server-only 503 response shared by both OWNER catalog endpoints. */
export function catalogUnavailableResponse(
  error: unknown,
  message: string,
  extraHeaders: Record<string, string> = {},
) {
  const reason = error instanceof SiteCatalogV2Error ? error.reason : "unavailable";
  const stage = error instanceof SiteCatalogV2Error ? error.stage : "unknown";
  const requestId = crypto.randomUUID();
  return NextResponse.json(
    { error: message, reason, stage, requestId },
    {
      status: 503,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Nabla-Diagnostic-Stage": stage,
        "X-Nabla-Request-ID": requestId,
        ...extraHeaders,
      },
    },
  );
}
