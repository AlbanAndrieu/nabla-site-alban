import { NextResponse } from "next/server";
import { SiteCatalogV2Error } from "./homelabSiteCatalog";
import { isTrustedHomelabRequest } from "./homelabAccess";
import { visibleCatalogFailureDetails } from "./homelabCatalogFailureStage";

/** Server-only 503 response, reauthorizing OWNER on public-readable routes. */
export async function catalogUnavailableResponse(
  request: Request,
  error: unknown,
  message: string,
  extraHeaders: Record<string, string> = {},
) {
  const reason = error instanceof SiteCatalogV2Error ? error.reason : "unavailable";
  const stage = error instanceof SiteCatalogV2Error ? error.stage : "unknown";
  // This route may be publicly readable in a temporary SERVICE mode.
  // Do not trust a UI-only access decision; reauthorize on every 503.
  const owner = await isTrustedHomelabRequest(request);
  const details = visibleCatalogFailureDetails(owner, reason, stage, crypto.randomUUID());
  return NextResponse.json(
    { error: message, ...details },
    {
      status: 503,
      headers: {
        "Cache-Control": "private, no-store",
        ...(owner && "stage" in details
          ? { "X-Nabla-Diagnostic-Stage": details.stage,
              "X-Nabla-Request-ID": details.requestId }
          : {}),
        ...extraHeaders,
      },
    },
  );
}
