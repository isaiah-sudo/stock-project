import type { Portfolio, Transaction } from "@stock/shared";
import { PrismaClient } from "@prisma/client";
import { computePortfolioDayMetrics } from "./portfolioMetrics.js";

const prisma = new PrismaClient();

type SupportedSymbol = 
  "AAPL" | "MSFT" | "NVDA" | "AMZN" | "GOOGL" | "TSLA" | "META" | "BRK-B" | "UNH" | "V" | 
  "JPM" | "LLY" | "AVGO" | "XOM" | "MA" | "JNJ" | "PG" | "COST" | "HD" | "ADBE" | 
  "NFLX" | "AMD" | "DIS" | "CRM" | "INTC" | "PYPL" | "VOO" | "QQQ" | "SPY" | "BABA" |
  "PLTR" | "SOFI" | "U" | "SNOW" | "CRWD" | "NKE" | "SBUX" | "TGT" | "WMT" | "CVX" |
  "CAT" | "DE" | "GS" | "MS" | "SQ" | "COIN" | "SCHD" | "VTI" | "VT" | "GME" | "AMC" | "MSTR";

interface Position {
  symbol: SupportedSymbol;
  name: string;
  quantity: number;
  averageCost: number;
}

interface LiveQuote {
  symbol: SupportedSymbol;
  name: string;
  currentPrice: number;
  changePct: number;
  source?: string;
  asOf?: string;
}

interface CachedQuote {
  quote: LiveQuote;
  cachedAt: number;
}

const SYMBOL_META: Record<SupportedSymbol, { name: string; basePrice: number }> = {
  AAPL: { name: "Apple Inc.", basePrice: 190 },
  MSFT: { name: "Microsoft Corp.", basePrice: 415 },
  NVDA: { name: "NVIDIA Corp.", basePrice: 900 },
  AMZN: { name: "Amazon.com Inc.", basePrice: 186 },
  GOOGL: { name: "Alphabet Inc.", basePrice: 171 },
  TSLA: { name: "Tesla Inc.", basePrice: 190 },
  META: { name: "Meta Platforms Inc.", basePrice: 495 },
  "BRK-B": { name: "Berkshire Hathaway Inc.", basePrice: 415 },
  UNH: { name: "UnitedHealth Group Inc.", basePrice: 480 },
  V: { name: "Visa Inc.", basePrice: 280 },
  JPM: { name: "JPMorgan Chase & Co.", basePrice: 195 },
  LLY: { name: "Eli Lilly and Co.", basePrice: 770 },
  AVGO: { name: "Broadcom Inc.", basePrice: 1300 },
  XOM: { name: "Exxon Mobil Corp.", basePrice: 120 },
  MA: { name: "Mastercard Inc.", basePrice: 470 },
  JNJ: { name: "Johnson & Johnson", basePrice: 160 },
  PG: { name: "Procter & Gamble Co.", basePrice: 160 },
  COST: { name: "Costco Wholesale Corp.", basePrice: 730 },
  HD: { name: "Home Depot Inc.", basePrice: 350 },
  ADBE: { name: "Adobe Inc.", basePrice: 500 },
  NFLX: { name: "Netflix Inc.", basePrice: 620 },
  AMD: { name: "Advanced Micro Devices Inc.", basePrice: 180 },
  DIS: { name: "Walt Disney Co.", basePrice: 110 },
  CRM: { name: "Salesforce Inc.", basePrice: 300 },
  INTC: { name: "Intel Corp.", basePrice: 40 },
  PYPL: { name: "PayPal Holdings Inc.", basePrice: 65 },
  VOO: { name: "Vanguard S&P 500 ETF", basePrice: 470 },
  QQQ: { name: "Invesco QQQ Trust", basePrice: 440 },
  SPY: { name: "SPDR S&P 500 ETF Trust", basePrice: 515 },
  BABA: { name: "Alibaba Group Holding Ltd.", basePrice: 75 },
  PLTR: { name: "Palantir Technologies Inc.", basePrice: 24 },
  SOFI: { name: "SoFi Technologies Inc.", basePrice: 8 },
  U: { name: "Unity Software Inc.", basePrice: 30 },
  SNOW: { name: "Snowflake Inc.", basePrice: 160 },
  CRWD: { name: "CrowdStrike Holdings Inc.", basePrice: 320 },
  NKE: { name: "Nike Inc.", basePrice: 95 },
  SBUX: { name: "Starbucks Corp.", basePrice: 88 },
  TGT: { name: "Target Corp.", basePrice: 170 },
  WMT: { name: "Walmart Inc.", basePrice: 60 },
  CVX: { name: "Chevron Corp.", basePrice: 155 },
  CAT: { name: "Caterpillar Inc.", basePrice: 350 },
  DE: { name: "Deere & Co.", basePrice: 390 },
  GS: { name: "Goldman Sachs Group Inc.", basePrice: 410 },
  MS: { name: "Morgan Stanley", basePrice: 90 },
  SQ: { name: "Block Inc.", basePrice: 75 },
  COIN: { name: "Coinbase Global Inc.", basePrice: 250 },
  SCHD: { name: "Schwab US Dividend Equity ETF", basePrice: 78 },
  VTI: { name: "Vanguard Total Stock Market ETF", basePrice: 260 },
  VT: { name: "Vanguard Total World Stock ETF", basePrice: 105 },
  GME: { name: "GameStop Corp.", basePrice: 15 },
  AMC: { name: "AMC Entertainment Holdings Inc.", basePrice: 4 },
  MSTR: { name: "MicroStrategy Inc.", basePrice: 1600 }
};

const SUPPORTED_SYMBOLS = Object.keys(SYMBOL_META) as SupportedSymbol[];

class PaperTradingService {
  private quoteCache = new Map<SupportedSymbol, CachedQuote>();
  private readonly quoteTtlMs = 15_000;
  private readonly quoteServiceBaseUrl = process.env.STOCK_QUOTE_SERVICE_URL ?? "http://127.0.0.1:8001";

  getSupportedSymbols() {
    return SUPPORTED_SYMBOLS;
  }

  getSupportedMetadata() {
    return SUPPORTED_SYMBOLS.map(symbol => ({
      symbol,
      name: SYMBOL_META[symbol].name
    }));
  }

  isMarketOpen(): boolean {
    const now = new Date();
    // Convert current time to EST (New York Time)
    const estDate = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = estDate.getDay(); // 0 is Sunday, 6 is Saturday
    const hours = estDate.getHours();
    const minutes = estDate.getMinutes();

    // Weekend check
    if (day === 0 || day === 6) return false;

    // Market hours: 9:30 AM - 4:00 PM EST
    const timeInMinutes = hours * 60 + minutes;
    const openTime = 9 * 60 + 30;
    const closeTime = 16 * 60;

    return timeInMinutes >= openTime && timeInMinutes < closeTime;
  }

  async linkPaperAccount(userId: string, startingCash = 100_000) {
    const existing = await prisma.paperAccount.findUnique({
      where: { userId }
    });

    if (existing?.linked) {
      return { linked: true, alreadyLinked: true, cashBalance: existing.cashBalance };
    }

    const account = await prisma.paperAccount.upsert({
      where: { userId },
      update: { linked: true },
      create: {
        userId,
        cashBalance: startingCash,
        linked: true
      }
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

    const cached = this.quoteCache.get(normalized);
    if (cached && Date.now() - cached.cachedAt < this.quoteTtlMs) {
      return cached.quote;
    }

    try {
      const response = await fetch(`${this.quoteServiceBaseUrl}/quote?symbol=${encodeURIComponent(normalized)}`);
      if (!response.ok) {
        throw new Error(`Quote service failed: ${response.status}`);
      }
      const data = (await response.json()) as {
        symbol?: string;
        name?: string;
        currentPrice?: number;
        changePct?: number;
        source?: string;
        asOf?: string;
      };
      if (!data.currentPrice || data.currentPrice <= 0) {
        throw new Error("Missing live quote price");
      }
      const quote: LiveQuote = {
        symbol: normalized,
        name: data.name ?? SYMBOL_META[normalized].name,
        currentPrice: Number(data.currentPrice.toFixed(2)),
        changePct: Number((data.changePct ?? 0).toFixed(2)),
        source: data.source,
        asOf: data.asOf
      };
      this.quoteCache.set(normalized, { quote, cachedAt: Date.now() });
      return quote;
    } catch {
      const fallback = this.getSyntheticQuote(normalized);
      this.quoteCache.set(normalized, { quote: fallback, cachedAt: Date.now() });
      return fallback;
    }
  }

  async placeOrder(args: {
    userId: string;
    symbol: string;
    side: "buy" | "sell";
    quantity: number;
  }) {
    const account = await prisma.paperAccount.findUnique({
      where: { userId: args.userId },
      include: { positions: true }
    });
    if (!account?.linked) {
      return { ok: false as const, error: "Paper account is not linked." };
    }

    const quote = await this.getQuote(args.symbol);
    if (!quote) {
      return { ok: false as const, error: `Unsupported symbol. Use: ${SUPPORTED_SYMBOLS.join(", ")}` };
    }

    const quantity = Math.floor(args.quantity);
    if (quantity <= 0) {
      return { ok: false as const, error: "Quantity must be a positive integer." };
    }

    const notional = Number((quote.currentPrice * quantity).toFixed(2));
    const position = account.positions.find(p => p.symbol === quote.symbol);

    if (notional >= 10000) {
      await this.unlockAchievement(args.userId, "WHALE");
    }

    return await prisma.$transaction(async (tx) => {
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
          await tx.paperPosition.delete({
            where: { id: position!.id }
          });
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

        // Award 20 XP for a profitable sale
        if (position && quote.currentPrice > position.averageCost) {
          await this.awardXP(tx, args.userId, 20);
          await this.unlockAchievement(args.userId, "PROFIT_TAKER", tx);
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

      const updatedAccount = await tx.paperAccount.findUnique({
        where: { userId: args.userId }
      });

      // Track FIRST_TRADE achievement
      try {
        await tx.achievement.upsert({
          where: { userId_type: { userId: args.userId, type: "FIRST_TRADE" } },
          update: {},
          create: { userId: args.userId, type: "FIRST_TRADE" }
        });
      } catch (e) {
        // Achievement already exists or other error
      }

      // Award 10 XP for every completed trade
      await this.awardXP(tx, args.userId, 10);

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
  }

  /**
   * Internal helper to award XP and check for level ups/achievements.
   */
  private async awardXP(tx: any, userId: string, amount: number) {
    try {
      const user = await tx.user.update({
        where: { id: userId },
        data: { experiencePoints: { increment: amount } }
      });

      // Special achievements based on activity
      const account = await tx.paperAccount.findUnique({
        where: { userId },
        include: { positions: true }
      });

      if (account) {
        if (account.positions.length >= 5) {
          await this.unlockAchievement(userId, "DIVERSIFIED");
        }
        
        const marketValue = await this.calculateMarketValue(account.positions);
        if (marketValue >= 50000) {
          await this.unlockAchievement(userId, "BULL_RUN");
        }
      }
    } catch (e) {
      console.error(`Failed to award ${amount} XP to user ${userId}:`, e);
    }
  }

  private async calculateMarketValue(positions: any[]): Promise<number> {
    let value = 0;
    for (const pos of positions) {
      const quote = await this.getQuote(pos.symbol);
      value += pos.quantity * (quote?.currentPrice ?? pos.averageCost);
    }
    return value;
  }

  async getPortfolio(userId: string): Promise<Portfolio | null> {
    const account = await prisma.paperAccount.findUnique({
      where: { userId },
      include: { positions: true }
    });
    if (!account?.linked) return null;

    const holdings = await Promise.all(
      account.positions.map(async (position) => {
        const quote = await this.getQuote(position.symbol);
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
      })
    );

    const { totalValue, dayChangePct, dayChangeDollar } = computePortfolioDayMetrics({
      cashBalance: account.cashBalance,
      holdings
    });

    // Check for performance achievements
    if (totalValue >= 11000) {
      await this.unlockAchievement(userId, "TEN_PCT_GAIN");
    }
    if (totalValue >= 20000) {
      await this.unlockAchievement(userId, "ALL_STAR");
    }

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

  async getTransactions(userId: string): Promise<Transaction[] | null> {
    const account = await prisma.paperAccount.findUnique({
      where: { userId },
      select: { linked: true }
    });
    if (!account?.linked) return null;

    const transactions = await prisma.paperTransaction.findMany({
      where: { userId },
      orderBy: { occurredAt: 'desc' },
      take: 50
    });

    return transactions.map(t => ({
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

    const rankings = await Promise.all(
      accounts.map(async (account) => {
        let holdingsValue = 0;
        for (const pos of account.positions) {
          const quote = await this.getQuote(pos.symbol);
          const price = quote?.currentPrice ?? pos.averageCost;
          holdingsValue += pos.quantity * price;
        }
        
        return {
          userId: account.userId,
          email: account.user.email.split("@")[0], // Mask email for privacy
          totalValue: Number((account.cashBalance + holdingsValue).toFixed(2)),
          exp: account.user.experiencePoints,
          // Blended Score: (Net Worth - Initial Cash) + (XP * 50)
          score: Number((account.cashBalance + holdingsValue - 100000).toFixed(2)) + (account.user.experiencePoints * 50)
        };
      })
    );

    return rankings.sort((a, b) => b.score - a.score).slice(0, 20);
  }

  async unlockAchievement(userId: string, type: string, txClient?: any) {
    const execute = async (tx: any) => {
      const existing = await tx.achievement.findUnique({
        where: { userId_type: { userId, type } }
      });

      if (!existing) {
        await tx.achievement.create({
          data: { userId, type }
        });
        // Award 50 XP for unlocking an achievement
        await this.awardXP(tx, userId, 50);
      }
    };

    try {
      if (txClient) {
        await execute(txClient);
      } else {
        await prisma.$transaction(async (tx) => {
          await execute(tx);
        });
      }
    } catch (e) {
      console.error(`Failed to unlock achievement ${type} for user ${userId}:`, e);
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
