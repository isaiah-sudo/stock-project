import type { Portfolio, Transaction } from "@stock/shared";
import { getPortfolioPreset, PORTFOLIO_PRESETS, type PortfolioPresetId } from "@stock/shared";
import { prisma } from "../lib/prisma.js";
import { computePortfolioDayMetrics } from "./portfolioMetrics.js";
import { buildStarterPortfolio } from "./portfolioSeed.js";

type SupportedSymbol =
  "AAPL" | "MSFT" | "NVDA" | "AMZN" | "GOOGL" | "TSLA" | "META" | "BRK-B" | "UNH" | "V" |
  "JPM" | "LLY" | "AVGO" | "XOM" | "MA" | "JNJ" | "PG" | "COST" | "HD" | "ADBE" |
  "NFLX" | "AMD" | "DIS" | "CRM" | "INTC" | "PYPL" | "VOO" | "QQQ" | "SPY" | "BABA" |
  "PLTR" | "SOFI" | "U" | "SNOW" | "CRWD" | "NKE" | "SBUX" | "TGT" | "WMT" | "CVX" |
  "CAT" | "DE" | "GS" | "MS" | "SQ" | "COIN" | "SCHD" | "VTI" | "VT" | "GME" | "AMC" | "MSTR" |
  "RBLX" | "PEP" | "KO" | "BAC" | "T" | "VZ" | "PFE" | "MRK" | "ABBV" | "ORCL" | "CSCO" |
  "ACN" | "TXN" | "QCOM" | "MU" | "AMAT" | "UBER" | "ABNB" | "SHOP" | "SE" | "MELI" | "TSM";

type HistoryTimeframe = "1D" | "1W" | "1M" | "ALL";
type BenchmarkSymbol = "SPY" | "QQQ";

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

interface PortfolioHistoryPoint {
  timestamp: string;
  total_market_value: number;
}

interface BenchmarkHistoryPoint {
  timestamp: string;
  price: number | null;
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
  BABA: { name: "Alibaba Group Holding Ltd.", basePrice: 136 },
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
  MSTR: { name: "MicroStrategy Inc.", basePrice: 1600 },
  RBLX: { name: "Roblox Corp.", basePrice: 35 },
  PEP: { name: "PepsiCo Inc.", basePrice: 175 },
  KO: { name: "Coca-Cola Co.", basePrice: 60 },
  BAC: { name: "Bank of America Corp.", basePrice: 38 },
  T: { name: "AT&T Inc.", basePrice: 17 },
  VZ: { name: "Verizon Communications Inc.", basePrice: 40 },
  PFE: { name: "Pfizer Inc.", basePrice: 28 },
  MRK: { name: "Merck & Co. Inc.", basePrice: 130 },
  ABBV: { name: "AbbVie Inc.", basePrice: 170 },
  ORCL: { name: "Oracle Corp.", basePrice: 120 },
  CSCO: { name: "Cisco Systems Inc.", basePrice: 50 },
  ACN: { name: "Accenture plc", basePrice: 330 },
  TXN: { name: "Texas Instruments Inc.", basePrice: 180 },
  QCOM: { name: "QUALCOMM Inc.", basePrice: 175 },
  MU: { name: "Micron Technology Inc.", basePrice: 120 },
  AMAT: { name: "Applied Materials Inc.", basePrice: 210 },
  UBER: { name: "Uber Technologies Inc.", basePrice: 70 },
  ABNB: { name: "Airbnb Inc.", basePrice: 160 },
  SHOP: { name: "Shopify Inc.", basePrice: 75 },
  SE: { name: "Sea Ltd.", basePrice: 60 },
  MELI: { name: "MercadoLibre Inc.", basePrice: 1500 },
  TSM: { name: "Taiwan Semiconductor Manufacturing Co.", basePrice: 140 }
};

const SUPPORTED_SYMBOLS = Object.keys(SYMBOL_META) as SupportedSymbol[];

class PaperTradingService {
  private quoteCache = new Map<SupportedSymbol, CachedQuote>();
  private readonly quoteTtlMs = 15_000;
  private readonly quoteServiceBaseUrl = process.env.STOCK_QUOTE_SERVICE_URL ?? "http://127.0.0.1:8001";

  private normalizePreset(preset?: string | null): PortfolioPresetId {
    return getPortfolioPreset(preset).id;
  }

  private async isModernUser(userId: string) {
    const count = await prisma.paperPortfolio.count({ where: { userId } });
    return count > 0;
  }

  private async getUserPreset(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { portfolioPreset: true }
    });
    return this.normalizePreset(user?.portfolioPreset);
  }

  private async getLegacyAccount(userId: string) {
    return prisma.paperAccount.findUnique({
      where: { userId },
      include: { positions: true }
    });
  }

  private async getModernPortfolioRecord(userId: string, preset?: string | null) {
    const selectedPreset = this.normalizePreset(preset ?? (await this.getUserPreset(userId)));
    return prisma.paperPortfolio.findUnique({
      where: {
        userId_preset: {
          userId,
          preset: selectedPreset
        }
      },
      include: { positions: true }
    });
  }

  private async seedPortfolioRecord(tx: any, userId: string, preset: PortfolioPresetId) {
    const starter = await buildStarterPortfolio(preset, (symbol) => this.getQuote(symbol));
    const portfolio = await tx.paperPortfolio.upsert({
      where: {
        userId_preset: {
          userId,
          preset
        }
      },
      update: {
        cashBalance: starter.cashBalance,
        linked: true
      },
      create: {
        userId,
        preset,
        cashBalance: starter.cashBalance,
        linked: true
      }
    });

    const existingPositionCount = await tx.paperPositionV2.count({ where: { portfolioId: portfolio.id } });
    if (existingPositionCount === 0) {
      for (const position of starter.positions) {
        await tx.paperPositionV2.create({
          data: {
            portfolioId: portfolio.id,
            symbol: position.symbol,
            name: position.name,
            quantity: position.quantity,
            averageCost: position.averageCost
          }
        });
      }
    }

    return { portfolio, starter };
  }

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
    const estDate = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = estDate.getDay();
    const hours = estDate.getHours();
    const minutes = estDate.getMinutes();

    if (day === 0 || day === 6) return false;

    const timeInMinutes = hours * 60 + minutes;
    const openTime = 9 * 60 + 30;
    const closeTime = 16 * 60;

    return timeInMinutes >= openTime && timeInMinutes < closeTime;
  }

  async linkPaperAccount(userId: string, startingCash = 10_000) {
    const modernUser = await this.isModernUser(userId);
    if (modernUser) {
      const existing = await prisma.paperPortfolio.findMany({
        where: { userId }
      });
      const alreadyLinked = existing.length === PORTFOLIO_PRESETS.length && existing.every((portfolio) => portfolio.linked);
      if (alreadyLinked) {
        const activePreset = await this.getUserPreset(userId);
        const activePortfolio = existing.find((portfolio) => portfolio.preset === activePreset) ?? existing[0];
        return { linked: true, alreadyLinked: true, cashBalance: activePortfolio?.cashBalance ?? startingCash };
      }

      await prisma.$transaction(async (tx: any) => {
        for (const preset of PORTFOLIO_PRESETS) {
          await this.seedPortfolioRecord(tx, userId, preset.id);
        }
      });

      const activePreset = await this.getUserPreset(userId);
      const activePortfolio = await prisma.paperPortfolio.findUnique({
        where: {
          userId_preset: {
            userId,
            preset: activePreset
          }
        }
      });

      return { linked: true, alreadyLinked: Boolean(existing.length), cashBalance: activePortfolio?.cashBalance ?? startingCash };
    }

    const existing = await this.getLegacyAccount(userId);
    if (existing?.linked) {
      const positionCount = await prisma.paperPosition.count({ where: { userId } });
      if (positionCount > 0) {
        return { linked: true, alreadyLinked: true, cashBalance: existing.cashBalance };
      }
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

    const positionCount = await prisma.paperPosition.count({ where: { userId } });
    let finalCashBalance = account.cashBalance;
    if (positionCount === 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { portfolioPreset: true }
      });
      const starter = await buildStarterPortfolio(user?.portfolioPreset ?? null, (symbol) => this.getQuote(symbol));
      await prisma.$transaction(async (tx: any) => {
        const duplicateCount = await tx.paperPosition.count({ where: { userId } });
        if (duplicateCount > 0) {
          return;
        }

        for (const position of starter.positions) {
          await tx.paperPosition.create({
            data: {
              userId,
              symbol: position.symbol,
              name: position.name,
              quantity: position.quantity,
              averageCost: position.averageCost
            }
          });
        }

        await tx.paperAccount.update({
          where: { userId },
          data: { cashBalance: starter.cashBalance }
        });
      });
      finalCashBalance = starter.cashBalance;
    }

    return { linked: true, alreadyLinked: Boolean(existing?.linked), cashBalance: finalCashBalance };
  }

  async isLinked(userId: string) {
    const modernUser = await this.isModernUser(userId);
    const account = modernUser
      ? await prisma.paperPortfolio.findFirst({
          where: { userId, linked: true },
          select: { linked: true }
        })
      : await prisma.paperAccount.findUnique({
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
    preset?: string | null;
  }) {
    const quote = await this.getQuote(args.symbol);
    if (!quote) {
      return { ok: false as const, error: `Unsupported symbol. Use: ${SUPPORTED_SYMBOLS.join(", ")}` };
    }

    const modernUser = await this.isModernUser(args.userId);
    const account = modernUser
      ? await this.getModernPortfolioRecord(args.userId, args.preset)
      : await this.getLegacyAccount(args.userId);
    if (!account?.linked) {
      return { ok: false as const, error: "Paper account is not linked." };
    }
    const portfolioRecordId = modernUser ? (account as { id: string }).id : userId;

    const quantity = Math.floor(args.quantity);
    if (quantity <= 0) {
      return { ok: false as const, error: "Quantity must be a positive integer." };
    }

    const notional = Number((quote.currentPrice * quantity).toFixed(2));
    const position = account.positions.find((p: { symbol: string }) => p.symbol === quote.symbol);

    if (notional >= 10_000) {
      await this.unlockAchievement(args.userId, "WHALE");
    }

    const result = await prisma.$transaction(async (tx: any) => {
      if (args.side === "buy") {
        if (account.cashBalance < notional) {
          return { ok: false as const, error: "Insufficient cash balance for this trade." };
        }

        const prevQty = position?.quantity ?? 0;
        const prevCost = position?.averageCost ?? 0;
        const newQty = prevQty + quantity;
        const newAvg = Number((((prevQty * prevCost) + notional) / newQty).toFixed(4));

        if (modernUser) {
          if (position) {
            await tx.paperPositionV2.update({
              where: { id: position.id },
              data: { quantity: newQty, averageCost: newAvg }
            });
          } else {
            await tx.paperPositionV2.create({
              data: {
                portfolioId: portfolioRecordId,
                symbol: quote.symbol,
                name: quote.name,
                quantity: newQty,
                averageCost: newAvg
              }
            });
          }

          await tx.paperPortfolio.update({
            where: { id: portfolioRecordId },
            data: { cashBalance: { decrement: notional } }
          });
        } else {
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
        }
      } else {
        const heldQty = position?.quantity ?? 0;
        if (heldQty < quantity) {
          return { ok: false as const, error: "Not enough shares to sell." };
        }

        const remaining = heldQty - quantity;
        if (remaining === 0) {
          if (modernUser) {
            await tx.paperPositionV2.delete({
              where: { id: position!.id }
            });
          } else {
            await tx.paperPosition.delete({
              where: { id: position!.id }
            });
          }
        } else {
          if (modernUser) {
            await tx.paperPositionV2.update({
              where: { id: position!.id },
              data: { quantity: remaining }
            });
          } else {
            await tx.paperPosition.update({
              where: { id: position!.id },
              data: { quantity: remaining }
            });
          }
        }

        if (modernUser) {
          await tx.paperPortfolio.update({
            where: { id: portfolioRecordId },
            data: { cashBalance: { increment: notional } }
          });
        } else {
          await tx.paperAccount.update({
            where: { userId: args.userId },
            data: { cashBalance: { increment: notional } }
          });
        }

        if (position && quote.currentPrice > position.averageCost) {
          await tx.user.update({
            where: { id: args.userId },
            data: { experiencePoints: { increment: 20 } }
          });
        }
      }

      const transaction = modernUser
        ? await tx.paperTransactionV2.create({
            data: {
              portfolioId: portfolioRecordId,
              symbol: quote.symbol,
              side: args.side,
              quantity,
              price: quote.currentPrice
            }
          })
        : await tx.paperTransaction.create({
            data: {
              userId: args.userId,
              symbol: quote.symbol,
              side: args.side,
              quantity,
              price: quote.currentPrice
            }
          });

      const updatedAccount = modernUser
        ? await tx.paperPortfolio.findUnique({
            where: { id: portfolioRecordId }
          })
        : await tx.paperAccount.findUnique({
            where: { userId: args.userId }
          });

      try {
        await tx.achievement.upsert({
          where: { userId_type: { userId: args.userId, type: "FIRST_TRADE" } },
          update: {},
          create: { userId: args.userId, type: "FIRST_TRADE" }
        });
      } catch {
        // no-op
      }

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
      await this.recordPortfolioSnapshot(portfolioRecordId, { force: true, modern: modernUser });
    }

    return result;
  }

  private async awardXP(tx: any, userId: string, amount: number) {
    try {
      await tx.user.update({
        where: { id: userId },
        data: { experiencePoints: { increment: amount } }
      });
    } catch (e) {
      console.error(`Failed to award ${amount} XP to user ${userId}:`, e);
    }
  }

  private async calculateMarketValue(positions: Array<{ symbol: string; quantity: number; averageCost: number }>) {
    const quotes = await Promise.all(positions.map(pos => this.getQuote(pos.symbol)));

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

  private async buildLivePortfolioState(userId: string, preset?: string | null) {
    const modernUser = await this.isModernUser(userId);
    const account = modernUser
      ? await this.getModernPortfolioRecord(userId, preset)
      : await this.getLegacyAccount(userId);
    if (!account?.linked) {
      return null;
    }

    const quotes = await Promise.all(
      account.positions.map((position: { symbol: string }) => this.getQuote(position.symbol))
    );
    const holdings = account.positions.map((
      position: { symbol: string; name: string; quantity: number; averageCost: number },
      index: number
    ) => {
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
      modernUser,
      holdings,
      totalValue,
      holdingsValue: Number((totalValue - account.cashBalance).toFixed(2)),
      dayChangePct,
      dayChangeDollar
    };
  }

  private async recordPortfolioSnapshot(
    portfolioId: string,
    options?: { force?: boolean; totalMarketValue?: number; modern?: boolean }
  ) {
    const latestSnapshot = options?.modern
      ? await prisma.portfolioSnapshotV2.findFirst({
          where: { portfolioId },
          orderBy: { timestamp: "desc" }
        })
      : await prisma.portfolioSnapshot.findFirst({
          where: { userId: portfolioId },
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
      if (options?.modern) {
        const account = await prisma.paperPortfolio.findUnique({
          where: { id: portfolioId },
          include: { positions: true }
        });
        totalMarketValue = account?.linked ? await this.calculateMarketValue(account.positions) : 0;
      } else {
        const account = await prisma.paperAccount.findUnique({
          where: { userId: portfolioId },
          include: { positions: true }
        });
        totalMarketValue = account?.linked ? await this.calculateMarketValue(account.positions) : 0;
      }
    }

    return options?.modern
      ? prisma.portfolioSnapshotV2.create({
          data: {
            portfolioId,
            totalMarketValue: Number(totalMarketValue.toFixed(2))
          }
        })
      : prisma.portfolioSnapshot.create({
          data: {
            userId: portfolioId,
            totalMarketValue: Number(totalMarketValue.toFixed(2))
          }
        });
  }

  private async getBenchmarkHistory(symbol: BenchmarkSymbol, timeframe: HistoryTimeframe) {
    try {
      const response = await fetch(
        `${this.quoteServiceBaseUrl}/history?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`
      );
      if (!response.ok) {
        throw new Error(`History service failed: ${response.status}`);
      }

      const data = (await response.json()) as {
        points?: Array<{ timestamp: string; price: number }>;
      };

      return (data.points ?? []).filter(point => Number.isFinite(point.price));
    } catch {
      const quote = await this.getQuote(symbol);
      return quote ? [{ timestamp: new Date().toISOString(), price: quote.currentPrice }] : [];
    }
  }

  private alignHistorySeries(args: {
    portfolioHistory: PortfolioHistoryPoint[];
    benchmarkHistory: Array<{ timestamp: string; price: number }>;
    bucketMs: number;
  }) {
    const { portfolioHistory, benchmarkHistory, bucketMs } = args;
    const benchmarkBuckets = benchmarkHistory.map(point => ({
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

  async getPortfolio(userId: string, preset?: string | null): Promise<Portfolio | null> {
    const portfolioState = await this.buildLivePortfolioState(userId, preset);
    if (!portfolioState) return null;

    const { account, modernUser, holdings, totalValue, holdingsValue, dayChangePct, dayChangeDollar } = portfolioState;
    const accountId = modernUser ? (account as { id: string }).id : userId;

    setImmediate(() => {
      this.checkPortfolioAchievements(userId, totalValue, account.positions, modernUser);
      this.recordPortfolioSnapshot(accountId, {
        totalMarketValue: holdingsValue,
        modern: modernUser
      }).catch(() => undefined);
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { experiencePoints: true }
    });

    return {
      accountId,
      cashBalance: account.cashBalance,
      totalValue,
      dayChangePct,
      dayChangeDollar,
      experiencePoints: user?.experiencePoints ?? 0,
      holdings
    };
  }

  private async checkPortfolioAchievements(userId: string, totalValue: number, positions: any[], modernUser: boolean) {
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

      const transactionCount = modernUser
        ? await prisma.paperPortfolio.findMany({
            where: { userId },
            select: { id: true }
          }).then((portfolios) =>
            prisma.paperTransactionV2.count({
              where: {
                portfolioId: {
                  in: portfolios.map((portfolio) => portfolio.id)
                }
              }
            })
          )
        : await prisma.paperTransaction.count({ where: { userId } });
      if (transactionCount >= 100) {
        await this.unlockAchievement(userId, "CENTURY_TRADER");
      }
    } catch (e) {
      console.error(`Failed to check achievements for ${userId}:`, e);
    }
  }

  async getPerformanceHistory(
    userId: string,
    timeframe: HistoryTimeframe,
    benchmark: BenchmarkSymbol,
    preset?: string | null
  ) {
    const portfolioState = await this.buildLivePortfolioState(userId, preset);
    if (!portfolioState) {
      return null;
    }

    const { durationMs, bucketMs } = this.getHistoryConfig(timeframe);
    const snapshots = portfolioState.modernUser
      ? await prisma.portfolioSnapshotV2.findMany({
          where: {
            portfolioId: (portfolioState.account as { id: string }).id,
            timestamp: {
              gte: new Date(Date.now() - durationMs)
            }
          },
          orderBy: { timestamp: "asc" }
        })
      : await prisma.portfolioSnapshot.findMany({
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

  async getTransactions(userId: string, preset?: string | null): Promise<Transaction[] | null> {
    const modernUser = await this.isModernUser(userId);
    const account = modernUser
      ? await this.getModernPortfolioRecord(userId, preset)
      : await this.getLegacyAccount(userId);
    if (!account?.linked) return null;
    const accountId = modernUser ? (account as { id: string }).id : userId;

    const transactions = modernUser
      ? await prisma.paperTransactionV2.findMany({
          where: { portfolioId: accountId },
          orderBy: { occurredAt: "desc" },
          take: 50
        })
      : await prisma.paperTransaction.findMany({
          where: { userId },
          orderBy: { occurredAt: "desc" },
          take: 50
        });

    return transactions.map((t: {
      id: string;
      symbol: string;
      side: string;
      quantity: number;
      price: number;
      occurredAt: Date;
    }) => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side as "buy" | "sell",
      quantity: t.quantity,
      price: t.price,
      occurredAt: t.occurredAt.toISOString()
    }));
  }

  async getLeaderboard() {
    const modernAccounts = await prisma.paperPortfolio.findMany({
      where: { linked: true },
      include: {
        user: { select: { email: true, experiencePoints: true, portfolioPreset: true } },
        positions: true
      }
    });
    const legacyAccounts = await prisma.paperAccount.findMany({
      where: { linked: true },
      include: {
        user: { select: { email: true, experiencePoints: true } },
        positions: true
      }
    });

    const activeAccounts = [
      ...modernAccounts.filter((account) => account.preset === account.user.portfolioPreset),
      ...legacyAccounts
    ];

    const allPositions = activeAccounts.flatMap((acc: {
      positions: Array<{ symbol: string; quantity: number; averageCost: number }>;
    }) => acc.positions);
    const uniqueSymbols = Array.from(
      new Set(allPositions.map((p: { symbol: string }) => p.symbol))
    ) as string[];
    const quoteMap = new Map<string, LiveQuote | null>();

    const quotes = await Promise.all(uniqueSymbols.map((symbol: string) => this.getQuote(symbol)));
    for (let i = 0; i < uniqueSymbols.length; i++) {
      quoteMap.set(uniqueSymbols[i], quotes[i]);
    }

    const rankings = activeAccounts.map((account: {
      userId: string;
      cashBalance: number;
      positions: Array<{ symbol: string; quantity: number; averageCost: number }>;
      user: { email: string; experiencePoints: number; portfolioPreset?: string };
    }) => {
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
        score: Number((account.cashBalance + holdingsValue - 10000).toFixed(2)) + (account.user.experiencePoints * 50)
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
        await tx.achievement.create({
          data: { userId, type }
        });
        await this.awardXP(tx, userId, 50);
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
