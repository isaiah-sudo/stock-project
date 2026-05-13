import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { brokerageService } from "@/lib/brokerageService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = await brokerageService.getWebullOAuthUrl(auth.userId);
  return NextResponse.json({ provider: "webull", url });
}
