import { z } from "zod";
import { readTextBodyWithLimit } from "./bounded-request-body";
import { isTrackablePublicPath } from "./public-analytics";

export const MAX_ANALYTICS_JSON_BYTES = 1024;

const analyticsPayloadSchema = z.object({
  path: z.string().max(200).refine(isTrackablePublicPath),
});

export async function parseAnalyticsPayload(request: Request) {
  const body = JSON.parse(await readTextBodyWithLimit(request, MAX_ANALYTICS_JSON_BYTES));
  const parsed = analyticsPayloadSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}
