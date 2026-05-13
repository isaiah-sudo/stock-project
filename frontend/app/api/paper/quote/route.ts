import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { paperTradingService } from "@/lib/paperTradingService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbol = request.nextUrl.searchParams.get("symbol")?.trim();
  if (!symbol) {
    return NextResponse.json({ error: "symbol query parameter is required" }, { status: 400 });
  }

  const quote = await paperTradingService.getQuote(symbol);
  if (!quote) {
    return NextResponse.json({ error: "Unsupported symbol for paper trading." }, { status: 400 });
  }

  return NextResponse.json(quote);
}
