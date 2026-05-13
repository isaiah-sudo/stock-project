import type { Portfolio, Transaction } from "@stock/shared";
import { prisma } from "@/lib/prisma";
import { computePortfolioDayMetrics } from "@/lib/portfolioMetrics";
import { fetchLiveQuote } from "@/lib/marketData";
import { SUPPORTED_SYMBOLS, SYMBOL_META, type SupportedSymbol } from "@/lib/paperSymbols";

type HistoryTimeframe = "1D" | "1W" | "1M" | "ALL";
type BenchmarkSymbol = "SPY" | "QQQ";

type LiveQuote = {
  symbol: SupportedSymbol;
  name: string;
  currentPrice: number;
  changePct: number;
  source?: string;
  asOf?: string;
};

interface PortfolioHistoryPoint {
  timestamp: string;
  total_market_value: number;
}

interface BenchmarkHistoryPoint {
  timestamp: string;
  price: number | null;
}

class PaperTradingService {
  getSupportedSymbols() {
    return SUPPORTED_SYMBOLS;
  }

  getSupportedMetadata() {
    return SUPPORTED_SYMBOLS.map((symbol) => ({
      symbol,
      name: SYMBOL_META[symbol].name
    }));
  }

  isMarketOpen(): boolean {
    const now = new Date();
    const estDate = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = estDate.getDay();
    const hours = estDate.getHours();
    const minutes = estDate.getMinutes();

    if (day === 0 || day === 6) return false;

    const timeInMinutes = hours * 60 + minutes;
    return timeInMinutes >= 9 * 60 + 30 && timeInMinutes < 16 * 60;
  }

  async linkPaperAccount(userId: string, startingCash = 100_000) {
    const existing = await prisma.paperAccount.findUnique({ where: { userId } });
    if (existing?.linked) {
      return { linked: true, alreadyLinked: true, cashBalance: existing.cashBalance };
    }

    const account = await prisma.paperAccount.upsert({
      where: { userId },
      update: { linked: true },
      create: { userId, cashBalance: startingCash, linked: true }
    });

    return { linked: true, alreadyLinked: false, cashBalance: account.cashBalance };
  }

  async isLinked(userId: string) {
    const account = await prisma.paperAccount.findUnique({
      where: { userId },
      select: { linked: true }
    });
    return account?.linked === true;
  }

  private getSyntheticQuote(symbol: SupportedSymbol): LiveQuote {
    const meta = SYMBOL_META[symbol];
    const drift = Math.sin(Date.now() / 1000 / 60 + symbol.charCodeAt(0)) * 0.015;
    const currentPrice = Number((meta.basePrice * (1 + drift)).toFixed(2));
    const changePct = Number((drift * 100).toFixed(2));
    return { symbol, name: meta.name, currentPrice, changePct };
  }

  async getQuote(symbol: string): Promise<LiveQuote | null> {
    const normalized = symbol.toUpperCase() as SupportedSymbol;
    if (!SUPPORTED_SYMBOLS.includes(normalized)) return null;

    const live = await fetchLiveQuote(normalized);
    if (live) {
      return {
        symbol: normalized,
        name: live.name,
        currentPrice: live.currentPrice,
        changePct: live.changePct,
        source: live.source,
        asOf: live.asOf
      };
    }

    return this.getSyntheticQuote(normalized);
  }

  async placeOrder(args: {
    userId: string;
    symbol: string;
    side: "buy" | "sell";
    quantity: number;
  }) {
    const quote = await this.getQuote(args.symbol);
    if (!quote) {
      return { ok: false as const, error: `Unsupported symbol. Use: ${SUPPORTED_SYMBOLS.join(", ")}` };
    }

    const account = await prisma.paperAccount.findUnique({
      where: { userId: args.userId },
      include: { positions: true }
    });
    if (!account?.linked) {
      return { ok: false as const, error: "Paper account is not linked." };
    }

    const quantity = Math.floor(args.quantity);
    if (quantity <= 0) {
      return { ok: false as const, error: "Quantity must be a positive integer." };
    }

    const notional = Number((quote.currentPrice * quantity).toFixed(2));
    const position = account.positions.find((p: { symbol: string }) => p.symbol === quote.symbol);

    const result = await prisma.$transaction(async (tx: any) => {
      if (args.side === "buy") {
        if (account.cashBalance < notional) {
          return { ok: false as const, error: "Insufficient cash balance for this trade." };
        }

        const prevQty = position?.quantity ?? 0;
        const prevCost = position?.averageCost ?? 0;
        const newQty = prevQty + quantity;
        const newAvg = Number((((prevQty * prevCost) + notional) / newQty).toFixed(4));

        if (position) {
          await tx.paperPosition.update({
            where: { id: position.id },
            data: { quantity: newQty, averageCost: newAvg }
          });
        } else {
          await tx.paperPosition.create({
            data: {
              userId: args.userId,
              symbol: quote.symbol,
              name: quote.name,
              quantity: newQty,
              averageCost: newAvg
            }
          });
        }

        await tx.paperAccount.update({
          where: { userId: args.userId },
          data: { cashBalance: { decrement: notional } }
        });
      } else {
        const heldQty = position?.quantity ?? 0;
        if (heldQty < quantity) {
          return { ok: false as const, error: "Not enough shares to sell." };
        }

        const remaining = heldQty - quantity;
        if (remaining === 0) {
          await tx.paperPosition.delete({ where: { id: position!.id } });
        } else {
          await tx.paperPosition.update({
            where: { id: position!.id },
            data: { quantity: remaining }
          });
        }

        await tx.paperAccount.update({
          where: { userId: args.userId },
          data: { cashBalance: { increment: notional } }
        });

        if (position && quote.currentPrice > position.averageCost) {
          await tx.user.update({
            where: { id: args.userId },
            data: { experiencePoints: { increment: 20 } }
          });
        }
      }

      const transaction = await tx.paperTransaction.create({
        data: {
          userId: args.userId,
          symbol: quote.symbol,
          side: args.side,
          quantity,
          price: quote.currentPrice
        }
      });

      const updatedAccount = await tx.paperAccount.findUnique({ where: { userId: args.userId } });

      await tx.achievement.upsert({
        where: { userId_type: { userId: args.userId, type: "FIRST_TRADE" } },
        update: {},
        create: { userId: args.userId, type: "FIRST_TRADE" }
      });

      await tx.user.update({
        where: { id: args.userId },
        data: { experiencePoints: { increment: 10 } }
      });

      return {
        ok: true as const,
        transaction: {
          id: transaction.id,
          symbol: transaction.symbol,
          side: transaction.side as "buy" | "sell",
          quantity: transaction.quantity,
          price: transaction.price,
          occurredAt: transaction.occurredAt.toISOString()
        },
        cashBalance: updatedAccount!.cashBalance
      };
    });

    if (result.ok) {
      await this.recordPortfolioSnapshot(args.userId, { force: true });
    }

    return result;
  }

  private async calculateMarketValue(
    positions: Array<{ symbol: string; quantity: number; averageCost: number }>
  ) {
    const quotes = await Promise.all(positions.map((pos: { symbol: string; quantity: number; averageCost: number }) => this.getQuote(pos.symbol)));
    let value = 0;
    for (let i = 0; i < positions.length; i++) {
      const quote = quotes[i];
      const price = quote?.currentPrice ?? positions[i].averageCost;
      value += positions[i].quantity * price;
    }
    return Number(value.toFixed(2));
  }

  private getHistoryConfig(timeframe: HistoryTimeframe) {
    switch (timeframe) {
      case "1D":
        return { durationMs: 72 * 60 * 60 * 1000, bucketMs: 15 * 60 * 1000 };
      case "1W":
        return { durationMs: 7 * 24 * 60 * 60 * 1000, bucketMs: 60 * 60 * 1000 };
      case "1M":
        return { durationMs: 30 * 24 * 60 * 60 * 1000, bucketMs: 24 * 60 * 60 * 1000 };
      case "ALL":
        return { durationMs: 90 * 24 * 60 * 60 * 1000, bucketMs: 7 * 24 * 60 * 60 * 1000 };
    }
  }

  private bucketTimestamp(timestamp: number, bucketMs: number) {
    return Math.floor(timestamp / bucketMs) * bucketMs;
  }

  private isAfterMarketClose(date: Date) {
    const etDate = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
    return etDate.getHours() * 60 + etDate.getMinutes() >= 16 * 60;
  }

  private getEtDayKey(date: Date) {
    return date.toLocaleDateString("en-US", { timeZone: "America/New_York" });
  }

  private async buildLivePortfolioState(userId: string) {
    const account = await prisma.paperAccount.findUnique({
      where: { userId },
      include: { positions: true }
    });
    if (!account?.linked) {
      return null;
    }

    const quotes = await Promise.all(account.positions.map((position: { symbol: string }) => this.getQuote(position.symbol)));
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

    return {
      account,
      holdings,
      totalValue,
      holdingsValue: Number((totalValue - account.cashBalance).toFixed(2)),
      dayChangePct,
      dayChangeDollar
    };
  }

  private async recordPortfolioSnapshot(
    userId: string,
    options?: { force?: boolean; totalMarketValue?: number }
  ) {
    const latestSnapshot = await prisma.portfolioSnapshot.findFirst({
      where: { userId },
      orderBy: { timestamp: "desc" }
    });

    const now = new Date();
    const marketOpen = this.isMarketOpen();
    const snapshotAgeMs = latestSnapshot ? now.getTime() - latestSnapshot.timestamp.getTime() : Number.POSITIVE_INFINITY;
    const latestValue = latestSnapshot?.totalMarketValue;
    const hasMeaningfulMove =
      latestValue === undefined ||
      Math.abs((options?.totalMarketValue ?? latestValue) - latestValue) >= Math.max(5, latestValue * 0.001);

    const shouldCreate =
      options?.force === true ||
      !latestSnapshot ||
      (marketOpen && (snapshotAgeMs >= 15 * 60 * 1000 || hasMeaningfulMove)) ||
      this.getEtDayKey(latestSnapshot.timestamp) !== this.getEtDayKey(now) ||
      (this.isAfterMarketClose(now) && !this.isAfterMarketClose(latestSnapshot.timestamp));

    if (!shouldCreate) {
      return latestSnapshot;
    }

    let totalMarketValue = options?.totalMarketValue;
    if (totalMarketValue === undefined) {
      const account = await prisma.paperAccount.findUnique({
        where: { userId },
        include: { positions: true }
      });
      totalMarketValue = account?.linked ? await this.calculateMarketValue(account.positions) : 0;
    }

    return prisma.portfolioSnapshot.create({
      data: {
        userId,
        totalMarketValue: Number(totalMarketValue.toFixed(2))
      }
    });
  }

  private async getBenchmarkHistory(symbol: BenchmarkSymbol, timeframe: HistoryTimeframe) {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error("ALPHA_VANTAGE_API_KEY is not set");
      }

      const response = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${apiKey}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error(`History service failed: ${response.status}`);
      }

      const data = (await response.json()) as {
        "Time Series (Daily)"?: Record<string, { "4. close"?: string }>;
      };

      const series = data["Time Series (Daily)"] ?? {};
      const points = Object.entries(series)
        .map(([date, row]) => ({
          timestamp: `${date}T00:00:00.000Z`,
          price: Number(row["4. close"])
        }))
        .filter((point) => Number.isFinite(point.price))
        .sort((a: { timestamp: string }, b: { timestamp: string }) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const limit = timeframe === "1D" ? 2 : timeframe === "1W" ? 7 : timeframe === "1M" ? 30 : 90;
      return points.slice(Math.max(0, points.length - limit));
    } catch {
      const quote = await this.getQuote(symbol);
      return quote
        ? [
            { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), price: quote.currentPrice },
            { timestamp: new Date().toISOString(), price: quote.currentPrice }
          ]
        : [];
    }
  }

  private alignHistorySeries(args: {
    portfolioHistory: PortfolioHistoryPoint[];
    benchmarkHistory: Array<{ timestamp: string; price: number }>;
    bucketMs: number;
  }) {
    const { portfolioHistory, benchmarkHistory, bucketMs } = args;
    const benchmarkBuckets = benchmarkHistory.map((point) => ({
      bucket: this.bucketTimestamp(new Date(point.timestamp).getTime(), bucketMs),
      price: point.price
    }));

    const alignedPortfolio: PortfolioHistoryPoint[] = [];
    const alignedBenchmark: BenchmarkHistoryPoint[] = [];

    for (const point of portfolioHistory) {
      const bucket = this.bucketTimestamp(new Date(point.timestamp).getTime(), bucketMs);
      let closestPrice: number | null = null;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const benchmarkPoint of benchmarkBuckets) {
        const distance = Math.abs(benchmarkPoint.bucket - bucket);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPrice = benchmarkPoint.price;
        }
      }

      const timestamp = new Date(bucket).toISOString();
      alignedPortfolio.push({ timestamp, total_market_value: point.total_market_value });
      alignedBenchmark.push({ timestamp, price: closestPrice });
    }

    return {
      portfolio_history: alignedPortfolio,
      benchmark_history: alignedBenchmark
    };
  }

  async getPortfolio(userId: string): Promise<Portfolio | null> {
    const portfolioState = await this.buildLivePortfolioState(userId);
    if (!portfolioState) return null;

    const { account, holdings, totalValue, holdingsValue, dayChangePct, dayChangeDollar } = portfolioState;

    setImmediate(() => {
      void this.checkPortfolioAchievements(userId, totalValue, account.positions);
      void this.recordPortfolioSnapshot(userId, { totalMarketValue: holdingsValue });
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

  private async checkPortfolioAchievements(userId: string, totalValue: number, positions: any[]) {
    try {
      if (totalValue >= 11_000) {
        await this.unlockAchievement(userId, "TEN_PCT_GAIN");
      }
      if (totalValue >= 20_000) {
        await this.unlockAchievement(userId, "ALL_STAR");
      }
      if (positions.length >= 5) {
        await this.unlockAchievement(userId, "DIVERSIFIED");
      }

      const marketValue = await this.calculateMarketValue(positions);
      if (marketValue >= 50_000) {
        await this.unlockAchievement(userId, "BULL_RUN");
      }

      const transactionCount = await prisma.paperTransaction.count({ where: { userId } });
      if (transactionCount >= 100) {
        await this.unlockAchievement(userId, "CENTURY_TRADER");
      }
    } catch (error) {
      console.error(`Failed to check achievements for ${userId}:`, error);
    }
  }

  async getPerformanceHistory(userId: string, timeframe: HistoryTimeframe, benchmark: BenchmarkSymbol) {
    const portfolioState = await this.buildLivePortfolioState(userId);
    if (!portfolioState) {
      return null;
    }

    const { durationMs, bucketMs } = this.getHistoryConfig(timeframe);
    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - durationMs)
        }
      },
      orderBy: { timestamp: "asc" }
    });

    const snapshotByBucket = new Map<number, PortfolioHistoryPoint>();
    for (const snapshot of snapshots) {
      const bucket = this.bucketTimestamp(snapshot.timestamp.getTime(), bucketMs);
      snapshotByBucket.set(bucket, {
        timestamp: new Date(bucket).toISOString(),
        total_market_value: Number(snapshot.totalMarketValue.toFixed(2))
      });
    }

    const currentBucket = this.bucketTimestamp(Date.now(), bucketMs);
    snapshotByBucket.set(currentBucket, {
      timestamp: new Date(currentBucket).toISOString(),
      total_market_value: Number(portfolioState.holdingsValue.toFixed(2))
    });

    const portfolioHistory = Array.from(snapshotByBucket.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const nowBucket = this.bucketTimestamp(Date.now(), bucketMs);
    const livePoint = {
      timestamp: new Date(nowBucket).toISOString(),
      total_market_value: Number(portfolioState.holdingsValue.toFixed(2))
    };

    if (portfolioHistory.length === 0 || portfolioHistory[portfolioHistory.length - 1].timestamp !== livePoint.timestamp) {
      portfolioHistory.push(livePoint);
    } else {
      portfolioHistory[portfolioHistory.length - 1] = livePoint;
    }

    const benchmarkHistory = await this.getBenchmarkHistory(benchmark, timeframe);
    const aligned = this.alignHistorySeries({ portfolioHistory, benchmarkHistory, bucketMs });

    return {
      timeframe,
      benchmark: {
        symbol: benchmark,
        name: SYMBOL_META[benchmark].name
      },
      portfolio_history: aligned.portfolio_history,
      benchmark_history: aligned.benchmark_history
    };
  }

  async getTransactions(userId: string): Promise<Transaction[] | null> {
    const account = await prisma.paperAccount.findUnique({
      where: { userId },
      select: { linked: true }
    });
    if (!account?.linked) return null;

    const transactions = await prisma.paperTransaction.findMany({
      where: { userId },
      orderBy: { occurredAt: "desc" },
      take: 50
    });

    return transactions.map((t: { id: string; symbol: string; side: string; quantity: number; price: number; occurredAt: Date }) => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side as "buy" | "sell",
      quantity: t.quantity,
      price: t.price,
      occurredAt: t.occurredAt.toISOString()
    }));
  }

  async getLeaderboard() {
    const accounts = await prisma.paperAccount.findMany({
      include: {
        user: { select: { email: true, experiencePoints: true } },
        positions: true
      }
    });

    const allPositions = accounts.flatMap((account: { positions: Array<{ symbol: string }> }) => account.positions);
    const uniqueSymbols = Array.from(new Set(allPositions.map((p: { symbol: string }) => p.symbol))) as string[];
    const quoteMap = new Map<string, LiveQuote | null>();

    const quotes = await Promise.all(uniqueSymbols.map((symbol: string) => this.getQuote(symbol)));
    for (let i = 0; i < uniqueSymbols.length; i++) {
      quoteMap.set(uniqueSymbols[i], quotes[i]);
    }

    const rankings = accounts.map((account: { userId: string; cashBalance: number; positions: Array<{ symbol: string; quantity: number; averageCost: number }>; user: { email: string; experiencePoints: number } }) => {
      let holdingsValue = 0;
      for (const pos of account.positions) {
        const quote = quoteMap.get(pos.symbol);
        const price = quote?.currentPrice ?? pos.averageCost;
        holdingsValue += pos.quantity * price;
      }

      return {
        userId: account.userId,
        email: account.user.email.split("@")[0],
        totalValue: Number((account.cashBalance + holdingsValue).toFixed(2)),
        exp: account.user.experiencePoints,
        score: Number((account.cashBalance + holdingsValue - 100000).toFixed(2)) + account.user.experiencePoints * 50
      };
    });

    return rankings.sort((a: { score: number }, b: { score: number }) => b.score - a.score).slice(0, 20);
  }

  async unlockAchievement(userId: string, type: string, txClient?: any) {
    const execute = async (tx: any) => {
      const existing = await tx.achievement.findUnique({
        where: { userId_type: { userId, type } }
      });

      if (!existing) {
        await tx.achievement.create({ data: { userId, type } });
        await tx.user.update({
          where: { id: userId },
          data: { experiencePoints: { increment: 50 } }
        });
      }
    };

    try {
      if (txClient) {
        await execute(txClient);
      } else {
        await prisma.$transaction(async (tx: any) => {
          await execute(tx);
        });
      }
    } catch (error) {
      console.error(`Failed to unlock achievement ${type} for user ${userId}:`, error);
    }
  }

  async getAchievements(userId: string) {
    return prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" }
    });
  }
}

export const paperTradingService = new PaperTradingService();
