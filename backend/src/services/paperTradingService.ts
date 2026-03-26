import type { Portfolio, Transaction } from "@stock/shared";
import { PrismaClient } from "@prisma/client";
import { computePortfolioDayMetrics } from "./portfolioMetrics.js";

const prisma = new PrismaClient();

type SupportedSymbol = "AAPL" | "MSFT" | "NVDA" | "AMZN" | "GOOGL" | "TSLA" | "META";

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
  META: { name: "Meta Platforms Inc.", basePrice: 495 }
};

const SUPPORTED_SYMBOLS = Object.keys(SYMBOL_META) as SupportedSymbol[];

class PaperTradingService {
  private quoteCache = new Map<SupportedSymbol, CachedQuote>();
  private readonly quoteTtlMs = 15_000;
  private readonly quoteServiceBaseUrl = process.env.STOCK_QUOTE_SERVICE_URL ?? "http://127.0.0.1:8001";

  getSupportedSymbols() {
    return SUPPORTED_SYMBOLS;
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
    return {
      accountId: "paper-account",
      cashBalance: account.cashBalance,
      totalValue,
      dayChangePct,
      dayChangeDollar,
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
}

export const paperTradingService = new PaperTradingService();
