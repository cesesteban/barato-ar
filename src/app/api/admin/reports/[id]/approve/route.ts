import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { approveReport } from "@/server/reports/service";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    overrideProductSlug?: string;
    overrideStoreId?: string;
  };
  const { id } = await params;
  const result = await approveReport({
    reportId: id,
    approvedBy: session.user.email,
    overrideProductSlug: body.overrideProductSlug,
    overrideStoreId: body.overrideStoreId,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, priceId: result.priceId });
}
