import { createHash, randomBytes, randomInt } from "node:crypto";
import { z } from "zod";

export const donationSchema = z.object({
  appealId: z.string().cuid(),
  donorName: z.string().trim().min(2).max(120),
  donorEmail: z.string().trim().email().max(254),
  donorPhone: z.union([z.literal(""), z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,16}$/)]).optional(),
  amount: z.coerce.number().int().min(10).max(1000000),
  isAnonymous: z.boolean().optional().default(false),
  domesticConfirmed: z.literal(true),
});

export const createDonationReference = () => `AFD-${new Date().getUTCFullYear()}-${randomInt(10000000, 100000000)}`;
export const createReceiptToken = () => randomBytes(24).toString("base64url");
export const hashReceiptToken = (token: string) => {
  const pepper = process.env.DONATION_TOKEN_PEPPER;
  if (!pepper && process.env.NODE_ENV === "production") throw new Error("Donation token pepper is not configured");
  return createHash("sha256").update(`${token}:${pepper ?? "development-only"}`).digest("hex");
};
export const createReceiptNumber = (reference: string) => `ACK-${reference}`;
