import "server-only";
import { z } from "zod";
const fundId = z.string().cuid();

/** Private release controls, independent of registry approval. */
export function fundCheckoutIds() {
  if (process.env.AMAANA_FUND_CHECKOUT_ENABLED !== "true") return [];
  return [...new Set((process.env.AMAANA_FUND_CHECKOUT_ALLOWLIST ?? "")
    .split(",").map(id => id.trim()).filter(id => fundId.safeParse(id).success))];
}
export function isFundCheckoutEnabled(id: string) {
  return fundCheckoutIds().includes(id);
}
