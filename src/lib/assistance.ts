import { createHash, randomBytes, randomInt } from "node:crypto";
import { z } from "zod";

export const assistanceCategories = ["MEDICAL", "EDUCATION", "LIVELIHOOD", "FOOD_HARDSHIP", "HOUSING", "EMERGENCY", "OTHER"] as const;

export const assistanceSchema = z.object({
  applicantName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,16}$/),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]).optional(),
  city: z.string().trim().min(2).max(100),
  category: z.enum(assistanceCategories),
  description: z.string().trim().min(40).max(5000),
  consent: z.literal("on"),
});

export const createReferenceNumber = () => `AF-${new Date().getUTCFullYear()}-${randomInt(100000, 1000000)}`;
export const createTrackingToken = () => randomBytes(24).toString("base64url");
export const hashTrackingToken = (token: string) => {
  const pepper = process.env.ASSISTANCE_TOKEN_PEPPER;
  if (!pepper && process.env.NODE_ENV === "production") throw new Error("Assistance token pepper is not configured");
  return createHash("sha256").update(`${token}:${pepper ?? "development-only"}`).digest("hex");
};
