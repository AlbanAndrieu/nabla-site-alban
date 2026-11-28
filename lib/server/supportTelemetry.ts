/**
 * Server-only support trace + feedback correlation for self-hosted Langfuse v4.
 * One OTLP/HTTP JSON span per completed visitor reply, one idempotent score.
 * Never expose Langfuse credentials, upstream API keys or visitor IPs.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { SupportMessage } from "@/lib/supportChat";

const LANGFUSE_ORIGIN = "https://langfuse.albandrieu.com";
export const SUPPORT_PROMPT = "site-support-v2";
export const SUPPORT_SKILL = "site-faq-v1";
export const SUPPORT_MODEL = "site-support";
const FEEDBACK_LIFETIME_SECONDS = 24 * 60 * 60;
const HEX_ID = /^[a-f0-9]{32}$/;

export const newSupportTraceId = () => randomBytes(16).toString("hex");

function feedbackKey(): string | undefined {
  // A scoped, existing Vercel secret. The key is never sent to the browser.
  return process.env.SUPPORT_FEEDBACK_SIGNING_KEY || process.env.SUPPORT_OPENWEBUI_API_KEY;
}

export function makeFeedbackToken(traceId: string, issuedAt = Math.floor(Date.now() / 1000)): string | null {
  const key = feedbackKey();
  if (!key || !HEX_ID.test(traceId)) return null;
  const when = issuedAt.toString(36);
  const mac = createHmac("sha256", key)
    .update("site-support-feedback-v1:" + traceId + ":" + when)
    .digest("hex");
  return when + "." + mac;
}

export function verifyFeedbackToken(traceId: unknown, token: unknown): traceId is string {
  const key = feedbackKey();
  if (!key || typeof traceId !== "string" || !HEX_ID.test(traceId)) return false;
  if (typeof token !== "string" || !/^[0-9a-z]{6,9}\.[a-f0-9]{64}$/.test(token)) return false;
  const [when, actual] = token.split(".");
  const issued = Number.parseInt(when, 36);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(issued) || issued > now + 60 || issued < now - FEEDBACK_LIFETIME_SECONDS) return false;
  const expected = createHmac("sha256", key)
    .update("site-support-feedback-v1:" + traceId + ":" + when)
    .digest("hex");
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function langfuseHeaders(): Record<string, string> | null {
  const publicKey = process.env.SUPPORT_LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.SUPPORT_LANGFUSE_SECRET_KEY;
  const accessId = process.env.SUPPORT_CF_ACCESS_CLIENT_ID;
  const accessSecret = process.env.SUPPORT_CF_ACCESS_CLIENT_SECRET;
  if (!publicKey || !secretKey || !accessId || !accessSecret) return null;
  return {
    Authorization: "Basic " + Buffer.from(publicKey + ":" + secretKey).toString("base64"),
    "CF-Access-Client-Id": accessId,
    "CF-Access-Client-Secret": accessSecret,
    "Content-Type": "application/json",
  };
}

async function langfusePost(path: string, data: unknown): Promise<boolean> {
  const headers = langfuseHeaders();
  if (!headers) {
    console.warn("[support-langfuse] status=not_configured");
    return false;
  }
  try {
    const response = await fetch(LANGFUSE_ORIGIN + path, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) {
      console.warn("[support-langfuse] status=upstream_error http=" + response.status);
    }
    await response.body?.cancel().catch(() => undefined);
    return response.ok;
  } catch {
    console.warn("[support-langfuse] status=unavailable");
    return false;
  }
}

const attr = (key: string, value: string) => ({
  key,
  value: { stringValue: value },
});

export function buildSupportOtelPayload(args: {
  traceId: string;
  startedAt: number;
  completedAt: number;
  locale: "fr" | "en";
  messages: SupportMessage[];
  output: string;
  result: "complete" | "incomplete";
}) {
  const { traceId, startedAt, completedAt, locale, messages, output, result } = args;
  const spanId = randomBytes(8).toString("hex");
  return {
    resourceSpans: [{
      resource: { attributes: [attr("service.name", "nabla-site-alban-support")] },
      scopeSpans: [{
        scope: { name: "site-support-proxy" },
        spans: [{
          traceId,
          spanId,
          name: "site-support-chat",
          kind: 2,
          startTimeUnixNano: String(BigInt(startedAt) * 1_000_000n),
          endTimeUnixNano: String(BigInt(completedAt) * 1_000_000n),
          attributes: [
            attr("langfuse.trace.name", "site-support-chat"),
            attr("langfuse.trace.tags", JSON.stringify(["site-support", "prompt:" + SUPPORT_PROMPT, "skill:" + SUPPORT_SKILL])),
            attr("langfuse.trace.metadata.prompt", SUPPORT_PROMPT),
            attr("langfuse.trace.metadata.skill", SUPPORT_SKILL),
            attr("langfuse.trace.metadata.model", SUPPORT_MODEL),
            attr("langfuse.trace.metadata.locale", locale),
            attr("langfuse.observation.type", "span"),
            attr("langfuse.observation.input", JSON.stringify(messages)),
            attr("langfuse.observation.output", JSON.stringify(output)),
            attr("langfuse.observation.metadata.status", result),
            attr("langfuse.version", SUPPORT_PROMPT),
            attr("langfuse.environment", "production"),
          ],
          status: { code: result === "complete" ? 1 : 2 },
        }],
      }],
    }],
  };
}

export async function recordSupportTrace(args: Parameters<typeof buildSupportOtelPayload>[0]): Promise<boolean> {
  return langfusePost("/api/public/otel/v1/traces", buildSupportOtelPayload(args));
}

export async function recordSupportFeedback(traceId: string, relevant: boolean): Promise<boolean> {
  return langfusePost("/api/public/scores", {
    id: "site-support-relevance-" + traceId,
    traceId,
    name: "support_relevance",
    dataType: "BOOLEAN",
    value: relevant,
    source: "API",
    comment: "Website visitor feedback; prompt=" + SUPPORT_PROMPT + "; skill=" + SUPPORT_SKILL,
  });
}
