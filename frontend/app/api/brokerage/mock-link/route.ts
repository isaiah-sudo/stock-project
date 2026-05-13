import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { paperTradingService } from "@/lib/paperTradingService";

export const runtime = "nodejs";

const mockLinkSchema = z.object({
  providerId: z.enum(["paper", "manual"])
});

export async function POST(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = mockLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.providerId === "paper") {
    const linked = await paperTradingService.linkPaperAccount(auth.userId);
    return NextResponse.json({
      linked: true,
      provider: "paper",
      message: linked.alreadyLinked
        ? "Paper brokerage already linked."
        : "Paper brokerage linked for development.",
      cashBalance: linked.cashBalance
    });
  }

  return NextResponse.json({
    linked: true,
    provider: parsed.data.providerId,
    message: "Mock brokerage linked for development."
  });
}
