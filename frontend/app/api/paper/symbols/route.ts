import { NextResponse } from "next/server";
import { paperTradingService } from "@/lib/paperTradingService";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    symbols: paperTradingService.getSupportedSymbols(),
    metadata: paperTradingService.getSupportedMetadata()
  });
}
