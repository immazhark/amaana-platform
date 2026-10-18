import { timingSafeEqual } from "node:crypto";

/** Only an explicit Bearer credential may authorize scheduled maintenance. */
export function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  if (!secret || !match) return false;

  const expected = Buffer.from(secret);
  const supplied = Buffer.from(match[1] ?? "");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
