import { NextRequest, NextResponse } from "next/server";
import { fetchLiveQuote } from "@/lib/marketData";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.trim();
  if (!symbol) {
    return NextResponse.json({ error: "symbol query parameter is required" }, { status: 400 });
  }

  const quote = await fetchLiveQuote(symbol);
  if (!quote) {
    return NextResponse.json({ error: "No live quote available" }, { status: 503 });
  }

  return NextResponse.json(quote);
}
