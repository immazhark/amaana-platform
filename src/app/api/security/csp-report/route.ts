import { NextResponse } from "next/server";
import { readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { configuredCspReportOrigin, createCspReportBudget, MAX_CSP_REPORT_BYTES, summarizeCspReports } from "@/lib/csp-report";

export const runtime = "nodejs";
const claimDiagnosticSlot = createCspReportBudget();
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow, noarchive" };
const empty = () => new NextResponse(null, { status: 204, headers: privateHeaders });

export async function POST(request: Request) {
  if (process.env.AMAANA_CSP_REPORT_ONLY !== "true") return empty();
  const expected = configuredCspReportOrigin(process.env.NEXT_PUBLIC_APP_URL,
    process.env.AMAANA_BROWSER_ACCEPTANCE === "true" || process.env.NODE_ENV === "development");
  if (!expected) return empty();
  // Browser report transports may omit Origin or serialize it as null. Their
  // reported document must still match the explicitly configured application.
  const origin = request.headers.get("origin");
  if ((origin && origin !== "null" && origin !== expected) || request.headers.get("sec-fetch-site") === "cross-site") return empty();
  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (type !== "application/csp-report" && type !== "application/reports+json") return empty();
  if (!claimDiagnosticSlot()) return empty();
  try {
    const payload: unknown = JSON.parse(await readTextBodyWithLimit(request, MAX_CSP_REPORT_BYTES, { timeoutMs: 2000 }));
    for (const diagnostic of summarizeCspReports(payload, expected)) {
      // Production compilation removes console calls; emit only these bounded
      // safe fields to private server logs, never the received report payload.
      process.stderr.write(JSON.stringify({ event: "csp.report-only", ...diagnostic }) + "\n");
    }
  } catch { /* Untrusted diagnostics must never affect a user flow. */ }
  return empty();
}
