import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { paperTradingService } from "@/lib/paperTradingService";

export const runtime = "nodejs";

const performanceSchema = z.object({
  timeframe: z.enum(["1D", "1W", "1M", "ALL"]).default("1D"),
  benchmark: z.enum(["SPY", "QQQ"]).default("SPY")
});

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = performanceSchema.safeParse({
    timeframe: request.nextUrl.searchParams.get("timeframe") ?? undefined,
    benchmark: request.nextUrl.searchParams.get("benchmark") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const history = await paperTradingService.getPerformanceHistory(
    auth.userId,
    parsed.data.timeframe,
    parsed.data.benchmark
  );

  if (!history) {
    return NextResponse.json({ error: "Paper account is not linked." }, { status: 404 });
  }

  return NextResponse.json(history);
}
