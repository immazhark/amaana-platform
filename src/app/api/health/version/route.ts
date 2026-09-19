import { NextResponse } from "next/server";

function razorpayMode() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  if (keyId.startsWith("rzp_test_")) return "test";
  if (keyId.startsWith("rzp_live_")) return "live";
  return "unconfigured";
}

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      commitSha: process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null,
      branch: process.env.RAILWAY_GIT_BRANCH ?? null,
      environment: process.env.APP_ENVIRONMENT ?? null,
      paymentMode: razorpayMode(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
