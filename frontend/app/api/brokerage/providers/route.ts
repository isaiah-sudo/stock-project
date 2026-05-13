import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export const runtime = "nodejs";

const mockProviders = [
  {
    id: "webull",
    name: "Webull",
    status: "supported",
    description: "OAuth-ready integration scaffolded in this starter.",
    sampleAccount: { accountType: "Margin", accountLabel: "Primary", buyingPower: 23000.55 }
  },
  {
    id: "paper",
    name: "Demo Paper Account",
    status: "mock",
    description: "Instant sandbox with sample holdings so you can explore the dashboard now.",
    sampleAccount: { accountType: "Paper", accountLabel: "Demo", buyingPower: 100000 }
  },
  {
    id: "manual",
    name: "Manual Import",
    status: "mock",
    description: "Upload CSV or type positions manually (placeholder flow).",
    sampleAccount: { accountType: "Manual", accountLabel: "Imported", buyingPower: 0 }
  }
];

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(mockProviders);
}
