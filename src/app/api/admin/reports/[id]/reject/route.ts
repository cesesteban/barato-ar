import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rejectReport } from "@/server/reports/service";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const { id } = await params;
  const result = await rejectReport(id, session.user.email, body.reason);
  if (!result.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
