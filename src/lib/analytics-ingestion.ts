import { z } from "zod";
import { readTextBodyWithLimit } from "./bounded-request-body";
import { normalizePublicAnalyticsPath } from "./public-analytics";

export const MAX_ANALYTICS_JSON_BYTES = 1024;

const analyticsPayloadSchema = z.object({
  path: z.string().max(200),
}).strict();

export async function parseAnalyticsPayload(request: Request) {
  const body = JSON.parse(await readTextBodyWithLimit(request, MAX_ANALYTICS_JSON_BYTES, { timeoutMs: 5_000 }));
  const parsed = analyticsPayloadSchema.safeParse(body);
  if (!parsed.success) return null;
  const path = normalizePublicAnalyticsPath(parsed.data.path);
  return path ? { path } : null;
}
