import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import type { Portfolio } from "@stock/shared";
import { prisma } from "@/lib/prisma";
import { computePortfolioDayMetrics } from "@/lib/portfolioMetrics";
import { fetchLiveQuote } from "@/lib/marketData";

export const runtime = "nodejs";

type AuthPayload = {
  userId: string;
  email: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

function getUserFromRequest(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = header.slice("Bearer ".length);
    return jwt.verify(token, getJwtSecret()) as AuthPayload;
  } catch {
    return null;
  }
}

async function buildPortfolio(userId: string): Promise<Portfolio | null> {
  const account = await prisma.paperAccount.findUnique({
    where: { userId },
    include: { positions: true }
  });

  if (!account?.linked) {
    return null;
  }

  const quotes = await Promise.all(account.positions.map((position: { symbol: string }) => fetchLiveQuote(position.symbol)));

  const holdings = account.positions.map((position: { symbol: string; name: string; quantity: number; averageCost: number }, index: number) => {
    const quote = quotes[index];
    const currentPrice = quote?.currentPrice ?? position.averageCost;
    const changePct =
      quote?.changePct ??
      Number((((currentPrice - position.averageCost) / position.averageCost) * 100).toFixed(2));

    return {
      symbol: position.symbol,
      name: quote?.name ?? position.name,
      quantity: position.quantity,
      averageCost: position.averageCost,
      currentPrice,
      changePct
    };
  });

  const { totalValue, dayChangePct, dayChangeDollar } = computePortfolioDayMetrics({
    cashBalance: account.cashBalance,
    holdings
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { experiencePoints: true }
  });

  return {
    accountId: "paper-account",
    cashBalance: account.cashBalance,
    totalValue,
    dayChangePct,
    dayChangeDollar,
    experiencePoints: user?.experiencePoints ?? 0,
    holdings
  };
}

export async function GET(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const portfolio = await buildPortfolio(auth.userId);
    if (!portfolio) {
      return NextResponse.json({ error: "Paper account is not linked." }, { status: 404 });
    }

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error("Portfolio GET error:", error);
    return NextResponse.json({ error: "Failed to load portfolio" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const portfolio = await buildPortfolio(auth.userId);
    if (!portfolio) {
      return NextResponse.json({ error: "Paper account is not linked." }, { status: 404 });
    }

    const snapshot = await prisma.portfolioSnapshot.create({
      data: {
        userId: auth.userId,
        totalMarketValue: Number((portfolio.totalValue - portfolio.cashBalance).toFixed(2))
      }
    });

    return NextResponse.json(
      {
        portfolio,
        snapshot: {
          id: snapshot.id,
          timestamp: snapshot.timestamp.toISOString(),
          totalMarketValue: snapshot.totalMarketValue
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Portfolio POST error:", error);
    return NextResponse.json({ error: "Failed to save portfolio snapshot" }, { status: 500 });
  }
}
