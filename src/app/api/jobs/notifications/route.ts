import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isEmailDeliveryEnabled } from "@/lib/env";
import { processPendingEmailNotifications } from "@/lib/notifications";
import { pruneEphemeralSecurityLedgers } from "@/lib/security-ledger-retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || !supplied || secret.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(secret), Buffer.from(supplied));
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

  try {
    const retention = await pruneEphemeralSecurityLedgers();

    if (!isEmailDeliveryEnabled()) {
      return NextResponse.json(
        { status: "disabled", retention },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const result = await processPendingEmailNotifications();
    return NextResponse.json({ status: "ok", ...result, retention }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Notification delivery job failed", error);
    return NextResponse.json({ status: "failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
