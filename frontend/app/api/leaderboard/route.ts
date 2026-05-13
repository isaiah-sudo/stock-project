import { NextResponse } from "next/server";
import { paperTradingService } from "@/lib/paperTradingService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rankings = await paperTradingService.getLeaderboard();
    return NextResponse.json(rankings);
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
