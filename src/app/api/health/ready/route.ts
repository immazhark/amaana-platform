import { NextResponse } from "next/server";
import { validateProductionEnvironment } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const headers = { "Cache-Control": "no-store" };
const READINESS_TIMEOUT_MS = 2_500;

async function databaseReady() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Database readiness check timed out")), READINESS_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function GET() {
  try {
    validateProductionEnvironment();
    await databaseReady();
    return NextResponse.json({ status: "ready" }, { headers });
  } catch {
    return NextResponse.json({ status: "not_ready" }, { status: 503, headers });
  }
}
