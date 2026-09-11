import { NextResponse } from "next/server";
import { z } from "zod";
import { voteReport } from "@/server/reports/service";
import { extractIp, ipHash } from "@/lib/hash";

export const runtime = "nodejs";

const VoteBody = z.object({ kind: z.enum(["up", "down"]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = VoteBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 422 });
  const anonId = ipHash(extractIp(req));
  const { id } = await params;
  const result = await voteReport(id, anonId, parsed.data.kind);
  return NextResponse.json(result);
}
