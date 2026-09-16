import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      commitSha: process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null,
      branch: process.env.RAILWAY_GIT_BRANCH ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
