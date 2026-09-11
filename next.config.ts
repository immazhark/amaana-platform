import type { NextConfig } from "next";

const devEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
const securityHeaders = [
  { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline'${devEval} https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https://api.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests` },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const noStoreHeaders = [{ key: "Cache-Control", value: "private, no-store, max-age=0" }];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/api/:path*", headers: noStoreHeaders },
      { source: "/admin/:path*", headers: noStoreHeaders },
      { source: "/donate/:path*", headers: noStoreHeaders },
      { source: "/donations/:path*", headers: noStoreHeaders },
      { source: "/request-assistance/:path*", headers: noStoreHeaders },
    ];
  },
};

export default nextConfig;
