import type { Portfolio, Transaction } from "@stock/shared";
import { computePortfolioDayMetrics } from "./portfolioMetrics.js";

type SupportedSymbol = "AAPL" | "MSFT" | "NVDA" | "AMZN" | "GOOGL" | "TSLA" | "META";

interface Position {
  symbol: SupportedSymbol;
  name: string;
  quantity: number;
  averageCost: number;
}

interface PaperAccount {
  linked: boolean;
  cashBalance: number;
  positions: Map<SupportedSymbol, Position>;
  transactions: Transaction[];
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
  private accounts = new Map<string, PaperAccount>();
  private quoteCache = new Map<SupportedSymbol, CachedQuote>();
  private readonly quoteTtlMs = 15_000;
  private readonly quoteServiceBaseUrl = process.env.STOCK_QUOTE_SERVICE_URL ?? "http://127.0.0.1:8001";

  getSupportedSymbols() {
    return SUPPORTED_SYMBOLS;
  }

  linkPaperAccount(userId: string, startingCash = 100_000) {
    const existing = this.accounts.get(userId);
    if (existing?.linked) {
      return { linked: true, alreadyLinked: true, cashBalance: existing.cashBalance };
    }

    const account: PaperAccount = {
      linked: true,
      cashBalance: startingCash,
      positions: new Map(),
      transactions: []
    };
    this.accounts.set(userId, account);
    return { linked: true, alreadyLinked: false, cashBalance: startingCash };
  }

  isLinked(userId: string) {
    return this.accounts.get(userId)?.linked === true;
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
    const account = this.accounts.get(args.userId);
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
    const position = account.positions.get(quote.symbol);

    if (args.side === "buy") {
      if (account.cashBalance < notional) {
        return { ok: false as const, error: "Insufficient cash balance for this trade." };
      }
      const prevQty = position?.quantity ?? 0;
      const prevCost = position?.averageCost ?? 0;
      const newQty = prevQty + quantity;
      const newAvg = Number((((prevQty * prevCost) + notional) / newQty).toFixed(4));
      account.positions.set(quote.symbol, {
        symbol: quote.symbol,
        name: quote.name,
        quantity: newQty,
        averageCost: newAvg
      });
      account.cashBalance = Number((account.cashBalance - notional).toFixed(2));
    } else {
      const heldQty = position?.quantity ?? 0;
      if (heldQty < quantity) {
        return { ok: false as const, error: "Not enough shares to sell." };
      }
      const remaining = heldQty - quantity;
      if (remaining === 0) {
        account.positions.delete(quote.symbol);
      } else if (position) {
        account.positions.set(quote.symbol, { ...position, quantity: remaining });
      }
      account.cashBalance = Number((account.cashBalance + notional).toFixed(2));
    }

    const transaction: Transaction = {
      id: `paper_${Date.now()}`,
      symbol: quote.symbol,
      side: args.side,
      quantity,
      price: quote.currentPrice,
      occurredAt: new Date().toISOString()
    };
    account.transactions.unshift(transaction);
    return { ok: true as const, transaction, cashBalance: account.cashBalance };
  }

  async getPortfolio(userId: string): Promise<Portfolio | null> {
    const account = this.accounts.get(userId);
    if (!account?.linked) return null;

    const holdings = await Promise.all(
      Array.from(account.positions.values()).map(async (position) => {
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

  getTransactions(userId: string): Transaction[] | null {
    const account = this.accounts.get(userId);
    if (!account?.linked) return null;
    return account.transactions.slice(0, 50);
  }
}

export const paperTradingService = new PaperTradingService();
