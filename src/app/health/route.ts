import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const commit = env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const version = process.env.npm_package_version ?? "0.1.0";
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "connected",
      commit,
      version,
      timestamp,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        db: "unreachable",
        commit,
        version,
        timestamp,
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 503 },
    );
  }
}
