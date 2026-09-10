import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rejectCandidate } from "@/normalizer";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let reason: string | undefined;
  try {
    const body = (await req.json().catch(() => ({}))) as { reason?: string };
    reason = body?.reason;
  } catch {
    reason = undefined;
  }
  try {
    const { id } = await params;
    await rejectCandidate(id, session.user.email, reason);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
