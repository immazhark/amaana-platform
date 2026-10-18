import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-authorization";
import { pruneEphemeralSecurityLedgers } from "@/lib/security-ledger-retention";
import { logServerError } from "@/lib/server-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

/** Isolated ledger retention: this route cannot dispatch notifications. */
export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: privateHeaders });
  }

  try {
    const result = await pruneEphemeralSecurityLedgers();
    return NextResponse.json({ status: "ok", ...result }, { headers: privateHeaders });
  } catch {
    logServerError("security_ledger.retention_maintenance_failed");
    return NextResponse.json({ status: "failed" }, {
      status: 503,
      headers: { ...privateHeaders, "Retry-After": "3600" },
    });
  }
}
