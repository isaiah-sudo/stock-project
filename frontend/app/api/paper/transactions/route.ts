import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { paperTradingService } from "@/lib/paperTradingService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await paperTradingService.getTransactions(auth.userId);
  return NextResponse.json(transactions ?? []);
}
