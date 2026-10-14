import type { NextConfig } from "next";

const devEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
const browserAcceptance = process.env.AMAANA_BROWSER_ACCEPTANCE === "true";
const allowPublicIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
const upgradeInsecureRequests = browserAcceptance ? "" : "; upgrade-insecure-requests";
const cspReportOnly = process.env.AMAANA_CSP_REPORT_ONLY === "true";

function getConfiguredHttpsOrigin(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

const configuredImageOrigins = [
  // Keep the response policy aligned with src/lib/public-media.ts.
  getConfiguredHttpsOrigin(process.env.NEXT_PUBLIC_APP_URL),
  getConfiguredHttpsOrigin(process.env.PUBLIC_MEDIA_BASE_URL),
  getConfiguredHttpsOrigin(process.env.NEXT_PUBLIC_DONATION_UPI_QR_URL),
].filter((origin): origin is string => Boolean(origin));

const imageSources = [
  "'self'",
  "blob:",
  "data:",
  ...new Set(configuredImageOrigins),
].join(" ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline'${devEval} https://checkout.razorpay.com; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src ${imageSources}; font-src 'self' data:; connect-src 'self' https://api.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'${upgradeInsecureRequests}` },
  // Observe stricter script sources before deciding a nonce/hash rollout.
  // No report-sample: browser diagnostics must not collect inline source text.
  ...(cspReportOnly ? [
    { key: "Content-Security-Policy-Report-Only", value: `script-src 'self' https://checkout.razorpay.com; script-src-attr 'none'; report-uri /api/security/csp-report${browserAcceptance ? "" : "; report-to amaana-csp"}` },
    { key: "Reporting-Endpoints", value: 'amaana-csp="/api/security/csp-report"' },
  ] : []),
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  ...(!allowPublicIndexing ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] : []),
];

// Private documents must protect legacy query credentials before metadata/hydration.
// Keep this policy independent of the public site's indexing switch.
const noStoreHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "Referrer-Policy", value: "no-referrer" },
];
const privateRecordHeaders = [
  ...noStoreHeaders,
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: { removeConsole: process.env.NODE_ENV === "production" },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    // The acceptance-only pattern must preserve all local artwork paths as well as fixtures.
    ...(browserAcceptance ? { localPatterns: [{ pathname: "/**" }] } : {}),
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 412, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    // Managed media can lose publication/consent approval; honor its short upstream policy.
    // Static brand/artwork sources below retain their existing long-lived cache policy.
    minimumCacheTTL: 60,
    maximumResponseBody: 5 * 1024 * 1024,
  },
  async headers() {
    return [
      // The managed-media handler owns its success, missing-record and failure cache headers.
      { source: "/hero/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/programme-artwork/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/(.*)", headers: securityHeaders },
      { source: "/api/:path*", headers: privateRecordHeaders },
      { source: "/admin/:path*", headers: privateRecordHeaders },
      { source: "/donate/:path*", headers: noStoreHeaders },
      { source: "/donations/:path*", headers: privateRecordHeaders },
      { source: "/request-assistance/:path*", headers: noStoreHeaders },
      { source: "/request-assistance/received", headers: privateRecordHeaders },
      { source: "/request-assistance/status", headers: privateRecordHeaders },
    ];
  },
};

export default nextConfig;
