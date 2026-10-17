import { NextResponse, type NextRequest } from "next/server";
import { allowedNonceCspImageSources, buildNoncedScriptCsp,
  nonceCspEnabled } from "@/lib/script-csp-nonce";

/** Opt-in preparation for removing script unsafe-inline (AF-R014).
 * Deliberately NO session, auth or permission checks here: those remain
 * authoritative in protected route handlers/server actions.
 *
 * Keep disabled until sandbox browsers prove checkout, hydration, PDF,
 * redirects and metadata streaming behavior, plus cache/header order.
 */
export function proxy(request: NextRequest) {
  if (!nonceCspEnabled(process.env.AMAANA_NONCE_CSP_ENABLED)) {
    return NextResponse.next();
  }
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildNoncedScriptCsp(nonce, allowedNonceCspImageSources([
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.PUBLIC_MEDIA_BASE_URL,
    process.env.NEXT_PUBLIC_DONATION_UPI_QR_URL,
  ]), {
    dev: process.env.NODE_ENV === "development",
    upgradeInsecure: process.env.AMAANA_BROWSER_ACCEPTANCE !== "true",
  });
  const forwarded = new Headers(request.headers);
  // Never trust a client-supplied nonce or policy header.
  forwarded.set("x-nonce", nonce);
  forwarded.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: forwarded } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [{
    source: "/((?!api/|_next/static|_next/image|media/|favicon.ico|icon.svg|apple-icon.png|opengraph-image|twitter-image).*)",
    missing: [
      { type: "header", key: "next-router-prefetch" },
      { type: "header", key: "purpose", value: "prefetch" },
    ],
  }],
};
