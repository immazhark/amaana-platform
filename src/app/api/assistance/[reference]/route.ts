import { NextResponse } from "next/server";

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
};

/**
 * Legacy endpoint retired.
 *
 * Older preview builds accepted a tracking token in this GET URL's query
 * string. Query credentials can be copied into browser history, proxy logs and
 * referrer surfaces, so private tracking now happens only in the browser via
 * a URL fragment and a same-origin POST to /api/assistance/status.
 *
 * Keep this route as a non-disclosing tombstone instead of silently supporting
 * the unsafe credential transport again.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "This private tracking endpoint has been retired. Use the latest Amaana tracking link.",
    },
    { status: 410, headers: privateHeaders },
  );
}
