import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { paperTradingService } from "@/lib/paperTradingService";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await paperTradingService.linkPaperAccount(auth.userId);
  return NextResponse.json({
    linked: true,
    provider: "paper",
    alreadyLinked: result.alreadyLinked,
    cashBalance: result.cashBalance
  });
}
