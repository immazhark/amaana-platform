import { NextResponse } from "next/server";
import { validateProductionEnvironment } from "@/lib/env";
import { prisma } from "@/lib/prisma";
export async function GET() { try { validateProductionEnvironment(); await prisma.$queryRaw`SELECT 1`; return NextResponse.json({ status: "ready" }, { headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ status: "not_ready" }, { status: 503, headers: { "Cache-Control": "no-store" } }); } }
