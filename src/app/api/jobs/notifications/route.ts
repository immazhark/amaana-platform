import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isEmailDeliveryEnabled } from "@/lib/env";
import { processPendingEmailNotifications } from "@/lib/notifications";
import { pruneEphemeralSecurityLedgers } from "@/lib/security-ledger-retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || !supplied || secret.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(secret), Buffer.from(supplied));
}

async function runRetentionMaintenance() {
  try {
    const result = await pruneEphemeralSecurityLedgers();
    return { status: "ok" as const, ...result };
  } catch (error) {
    console.error("Security-ledger retention maintenance failed", error);
    return { status: "failed" as const };
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: privateHeaders },
    );
  }

  const retention = await runRetentionMaintenance();

  if (!isEmailDeliveryEnabled()) {
    return NextResponse.json(
      { status: "disabled", retention },
      { headers: privateHeaders },
    );
  }

  try {
    const result = await processPendingEmailNotifications();
    return NextResponse.json(
      { status: "ok", ...result, retention },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Notification delivery job failed", error);
    return NextResponse.json(
      { status: "failed", retention },
      { status: 500, headers: privateHeaders },
    );
  }
}
