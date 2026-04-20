import type { Portfolio, Transaction } from "@stock/shared";
import { prisma } from "../lib/prisma.js";
import { computePortfolioDayMetrics } from "./portfolioMetrics.js";

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

  async getTradePreview(userId: string, input: TradePreviewRequest): Promise<TradePreview | { error: string }> {
    const normalizedSymbol = input.symbol.trim().toUpperCase();
    const orderType = input.orderType ?? "market";

    if (!normalizedSymbol) {
      return { error: "Choose a stock symbol before requesting a preview." };
    }

    const portfolioResult = (await this.getPortfolio(userId)) as Portfolio | { error: string } | null;
    if (!portfolioResult || "error" in portfolioResult) {
      return { error: "Link your paper trading account before previewing trades." };
    }

    const portfolio = portfolioResult;

    const quoteResult = (await this.getQuote(normalizedSymbol)) as Quote | { error: string } | null;
    if (!quoteResult || "error" in quoteResult) {
      return { error: "We could not find a current paper quote for that symbol." };
    }

    const quote = quoteResult;

    const currentPosition = portfolio.holdings.find((holding) => holding.symbol === normalizedSymbol);
    const positionQuantityBefore = currentPosition?.quantity ?? 0;
    const estimatedPrice = quote.price;
    const estimatedNotional = Number((estimatedPrice * input.quantity).toFixed(2));
    const projectedCashBalance = Number(
      (
        input.side === "buy"
          ? portfolio.cashBalance - estimatedNotional
          : portfolio.cashBalance + estimatedNotional
      ).toFixed(2),
    );
    const positionQuantityAfter =
      input.side === "buy" ? positionQuantityBefore + input.quantity : positionQuantityBefore - input.quantity;

    if (input.side === "buy" && estimatedNotional > portfolio.cashBalance) {
      return { error: "This practice trade would cost more cash than you currently have in your simulator." };
    }

    if (input.side === "sell" && input.quantity > positionQuantityBefore) {
      return { error: "You cannot sell more shares than your paper portfolio currently holds." };
    }

    const holdingValueBySymbol = new Map<string, number>(
      portfolio.holdings.map((holding) => [holding.symbol, holding.quantity * holding.currentPrice]),
    );
    const currentSymbolValueAfter = Math.max(positionQuantityAfter, 0) * estimatedPrice;
    holdingValueBySymbol.set(normalizedSymbol, currentSymbolValueAfter);

    const totalHoldingsValueAfter = Array.from(holdingValueBySymbol.values()).reduce((sum, value) => sum + value, 0);
    const largestHoldingValueAfter = Array.from(holdingValueBySymbol.values()).reduce(
      (max, value) => (value > max ? value : max),
      0,
    );
    const largestPositionSharePct =
      totalHoldingsValueAfter > 0 ? Number(((largestHoldingValueAfter / totalHoldingsValueAfter) * 100).toFixed(1)) : 0;
    const diversificationLabel = this.getDiversificationLabel(largestPositionSharePct);
    const riskLevel = this.getRiskLevelFromConcentration(largestPositionSharePct, totalHoldingsValueAfter, orderType);
    const warnings = this.buildPreviewWarnings({
      side: input.side,
      orderType,
      estimatedNotional,
      projectedCashBalance,
      largestPositionSharePct,
      positionQuantityBefore,
      positionQuantityAfter,
    });

    return {
      symbol: normalizedSymbol,
      side: input.side,
      orderType,
      quantity: input.quantity,
      estimatedPrice: Number(estimatedPrice.toFixed(2)),
      estimatedNotional,
      projectedCashBalance,
      currentCashBalance: Number(portfolio.cashBalance.toFixed(2)),
      positionQuantityBefore,
      positionQuantityAfter,
      largestPositionSharePct,
      diversificationLabel,
      riskLevel,
      orderTypeExplanation: this.getOrderTypeExplanation(orderType, input.side),
      marketContext: `${normalizedSymbol} is being previewed using the latest simulated quote of ${estimatedPrice.toFixed(
        2,
      )}. Real markets move constantly, so a paper preview is a teaching estimate rather than a promise.`,
      beginnerSummary: this.getPreviewSummary({
        side: input.side,
        quantity: input.quantity,
        symbol: normalizedSymbol,
        estimatedNotional,
        projectedCashBalance,
        orderType,
      }),
      learningBullets: this.buildLearningBullets({
        side: input.side,
        orderType,
        diversificationLabel,
        largestPositionSharePct,
        projectedCashBalance,
        currentCashBalance: portfolio.cashBalance,
      }),
      warnings,
    };
  }

  async getPortfolioCoaching(userId: string): Promise<PortfolioCoaching | null> {
    const portfolioResult = (await this.getPortfolio(userId)) as Portfolio | { error: string } | null;
    if (!portfolioResult || "error" in portfolioResult) {
      return null;
    }

    const portfolio = portfolioResult;

    const transactions = await this.getTransactions(userId);
    const holdingsValue = portfolio.holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
    const totalValue = holdingsValue + portfolio.cashBalance;
    const concentrationPct =
      holdingsValue > 0
        ? Number(
            (
              (Math.max(...portfolio.holdings.map((holding) => holding.marketValue), 0) / holdingsValue) *
              100
            ).toFixed(1),
          )
        : 0;
    const cashPct = totalValue > 0 ? Number(((portfolio.cashBalance / totalValue) * 100).toFixed(1)) : 100;
    const diversificationLabel = this.getDiversificationLabel(concentrationPct);
    const riskLevel = this.getRiskLevelFromConcentration(concentrationPct, holdingsValue, "market");
    const recentTransactions = transactions.filter((transaction) => {
      const datedTransaction = transaction as Transaction & {
        timestamp?: string;
        createdAt?: string;
        date?: string;
      };
      const rawDate = datedTransaction.timestamp ?? datedTransaction.createdAt ?? datedTransaction.date;
      const transactionTime = rawDate ? new Date(rawDate).getTime() : Number.NaN;
      return Number.isFinite(transactionTime) && Date.now() - transactionTime < 1000 * 60 * 60 * 24 * 14;
    });
    const styleLabel = this.getStyleLabel({
      concentrationPct,
      cashPct,
      recentTradeCount: recentTransactions.length,
      holdingsCount: portfolio.holdings.length,
    });

    return {
      riskLevel,
      diversificationLabel,
      concentrationPct,
      cashPct,
      holdingsCount: portfolio.holdings.length,
      styleLabel,
      summary: this.getCoachingSummary(styleLabel, diversificationLabel, cashPct, recentTransactions.length),
      strengths: this.getCoachingStrengths(portfolio.holdings.length, diversificationLabel, cashPct),
      cautions: this.getCoachingCautions(concentrationPct, cashPct, recentTransactions.length),
      nextLessons: this.getNextLessons(styleLabel, diversificationLabel, recentTransactions.length),
      reflectionPrompt: this.getReflectionPrompt(styleLabel, concentrationPct, cashPct),
    };
  }

  getLearningChallenges(): LearningChallenge[] {
    return [
      {
        id: "risk-drawdown",
        category: "risk",
        title: "One stock suddenly drops",
        scenario:
          "Your paper portfolio has three holdings, but one of them makes up nearly half of your invested money. After weak earnings, that stock falls 12% in a day.",
        difficulty: "beginner",
        concept: "Concentration can magnify both gains and losses.",
        options: [
          {
            id: "risk-a",
            label: "The portfolio barely changes because there are still three stocks.",
            explanation:
              "Three holdings can still be concentrated if one position is much larger than the others. The size of each position matters, not just the count.",
            isBest: false,
          },
          {
            id: "risk-b",
            label: "The portfolio feels the drop more because one position is carrying too much weight.",
            explanation:
              "Correct. When one holding dominates the portfolio, its moves have a larger effect on the total result.",
            isBest: true,
          },
          {
            id: "risk-c",
            label: "The drop does not matter in paper trading because no real money is involved.",
            explanation:
              "Paper trading removes real financial harm, but the lesson still matters because it teaches how portfolio structure changes outcomes.",
            isBest: false,
          },
        ],
        takeaway: "Risk is strongly influenced by position size. A portfolio can look diversified on the surface while still leaning heavily on one idea.",
      },
      {
        id: "diversification-sector",
        category: "diversification",
        title: "Five stocks, one industry",
        scenario:
          "A learner buys five different companies, but all five are large technology stocks that often react to the same news.",
        difficulty: "beginner",
        concept: "Owning more tickers is not the same as spreading exposure.",
        options: [
          {
            id: "div-a",
            label: "This is automatically diversified because there are five positions.",
            explanation:
              "A larger number of holdings can help, but if they move for similar reasons the portfolio can still be tightly clustered.",
            isBest: false,
          },
          {
            id: "div-b",
            label: "This is only partly diversified because the holdings may rise and fall together.",
            explanation:
              "Correct. Diversification is about different sources of risk, not just the number of names on the screen.",
            isBest: true,
          },
          {
            id: "div-c",
            label: "It is safer than cash in every situation.",
            explanation:
              "No portfolio is safer in every situation. Different allocations solve different goals and tradeoffs.",
            isBest: false,
          },
        ],
        takeaway: "Diversification improves when holdings respond to different drivers, not just when the list gets longer.",
      },
      {
        id: "order-types-gap",
        category: "order-types",
        title: "Learning the difference between order types",
        scenario:
          "You are previewing a trade before the market opens and notice the app offers market, limit, and stop order types in the educational flow.",
        difficulty: "beginner",
        concept: "Order types describe how you want an execution condition to behave.",
        options: [
          {
            id: "ord-a",
            label: "A market order focuses on filling quickly at the best currently available simulated price.",
            explanation:
              "Correct. A market order emphasizes immediate execution, though the final real-world fill can differ from the quote you saw earlier.",
            isBest: true,
          },
          {
            id: "ord-b",
            label: "A limit order guarantees execution no matter what price the market reaches.",
            explanation:
              "A limit order sets a price condition, but it does not guarantee execution if the market never reaches that level.",
            isBest: false,
          },
          {
            id: "ord-c",
            label: "A stop order is the same thing as a limit order.",
            explanation:
              "They are different tools. A stop order becomes relevant after a trigger level is reached, while a limit order centers on a chosen price or better.",
            isBest: false,
          },
        ],
        takeaway: "Order types are tradeoff tools. Some focus on speed, while others focus on price conditions.",
      },
      {
        id: "psychology-fomo",
        category: "psychology",
        title: "A stock is trending on social media",
        scenario:
          "A stock jumps all morning and everyone online says it is 'easy money.' You feel pressure to place a paper trade quickly so you do not miss out.",
        difficulty: "intermediate",
        concept: "Emotions can rush decision-making.",
        options: [
          {
            id: "psy-a",
            label: "Buy immediately because fast moves always continue.",
            explanation:
              "Fast moves can continue, but they can also reverse. Acting on excitement alone is a classic example of FOMO.",
            isBest: false,
          },
          {
            id: "psy-b",
            label: "Pause and write down why the trade fits your plan before acting.",
            explanation:
              "Correct. A short pause creates space to separate a thoughtful decision from emotional chasing.",
            isBest: true,
          },
          {
            id: "psy-c",
            label: "Ignore risk because it is only a small trade.",
            explanation:
              "Smaller size can reduce impact, but it does not remove the habit-forming effect of rushed, emotional decisions.",
            isBest: false,
          },
        ],
        takeaway: "Paper trading is a safe place to notice emotions. Good process often starts with slowing down, not speeding up.",
      },
      {
        id: "strategy-timeframe",
        category: "strategy",
        title: "Mixing goals in one trade",
        scenario:
          "You tell yourself a trade is a long-term investment, but you also plan to sell the moment it moves up 2% later today.",
        difficulty: "intermediate",
        concept: "A strategy works best when the timeframe and exit plan match the reason for entering.",
        options: [
          {
            id: "str-a",
            label: "That is consistent because every strategy should aim to take profit as fast as possible.",
            explanation:
              "Different strategies use different timeframes. A long-term thesis and a same-day exit are usually based on different ideas.",
            isBest: false,
          },
          {
            id: "str-b",
            label: "The plan is mixed because the explanation and the exit rule use different time horizons.",
            explanation:
              "Correct. When the reason for the trade and the planned exit disagree, it becomes harder to evaluate whether the trade actually worked.",
            isBest: true,
          },
          {
            id: "str-c",
            label: "It does not matter as long as the stock is popular.",
            explanation:
              "Popularity does not replace a coherent plan. A clear timeframe helps you judge results more honestly.",
            isBest: false,
          },
        ],
        takeaway: "Strategy is easier to learn when your entry reason, time horizon, and exit rule tell the same story.",
      },
    ];
  }

  async placeOrder(args: {
    userId: string;
    symbol: string;
    side: "buy" | "sell";
    quantity: number;
  }) {
    // ✅ FETCH QUOTE OUTSIDE TRANSACTION (external API call)
    const quote = await this.getQuote(args.symbol);
    if (!quote) {
      return { ok: false as const, error: `Unsupported symbol. Use: ${SUPPORTED_SYMBOLS.join(", ")}` };
    }

    // ✅ FETCH ACCOUNT OUTSIDE TRANSACTION
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
    const position = account.positions.find(p => p.symbol === quote.symbol);

    // ✅ CHECK WHALE ACHIEVEMENT OUTSIDE TRANSACTION
    if (notional >= 10000) {
      await this.unlockAchievement(args.userId, "WHALE");
    }

    // ✅ ONLY DB WORK INSIDE TRANSACTION
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

        // ✅ SIMPLIFIED: Only award XP for profitable sale, no market value calc
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

      // ✅ SIMPLIFIED: Award 10 XP directly without calling awardXP
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
  }

  /**
   * Internal helper to award XP. Simplified to only update XP without heavy logic.
   */
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

  /**
   * Calculate market value using batch quote fetches (Promise.all).
   */
  private async calculateMarketValue(positions: any[]): Promise<number> {
    // ✅ BATCH FETCH: Use Promise.all instead of sequential loop
    const quotes = await Promise.all(
      positions.map(pos => this.getQuote(pos.symbol))
    );

    let value = 0;
    for (let i = 0; i < positions.length; i++) {
      const quote = quotes[i];
      const price = quote?.currentPrice ?? positions[i].averageCost;
      value += positions[i].quantity * price;
    }
    return value;
  }

  async getPortfolio(userId: string): Promise<Portfolio | null> {
    const account = await prisma.paperAccount.findUnique({
      where: { userId },
      include: { positions: true }
    });
    if (!account?.linked) return null;

    // ✅ BATCH QUOTE FETCHES
    const quotes = await Promise.all(
      account.positions.map(position => this.getQuote(position.symbol))
    );

    const holdings = account.positions.map((position, index) => {
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

    // ✅ CHECK ACHIEVEMENTS OUTSIDE main data fetching (fire & forget)
    setImmediate(() => {
      this.checkPortfolioAchievements(userId, totalValue, account.positions);
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

  /**
   * Check and unlock portfolio-based achievements (non-blocking).
   */
  private async checkPortfolioAchievements(userId: string, totalValue: number, positions: any[]) {
    try {
      if (totalValue >= 11000) {
        await this.unlockAchievement(userId, "TEN_PCT_GAIN");
      }
      if (totalValue >= 20000) {
        await this.unlockAchievement(userId, "ALL_STAR");
      }
      if (positions.length >= 5) {
        await this.unlockAchievement(userId, "DIVERSIFIED");
      }
      const marketValue = await this.calculateMarketValue(positions);
      if (marketValue >= 50000) {
        await this.unlockAchievement(userId, "BULL_RUN");
      }
      const transactionCount = await prisma.paperTransaction.count({ where: { userId } });
      if (transactionCount >= 100) {
        await this.unlockAchievement(userId, "CENTURY_TRADER");
      }
    } catch (e) {
      console.error(`Failed to check achievements for ${userId}:`, e);
    }
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

    // ✅ BATCH ALL QUOTE FETCHES for all accounts
    const allPositions = accounts.flatMap(acc => acc.positions);
    const uniqueSymbols = Array.from(new Set(allPositions.map(p => p.symbol)));
    const quoteMap = new Map<string, LiveQuote | null>();
    
    const quotes = await Promise.all(
      uniqueSymbols.map(symbol => this.getQuote(symbol))
    );

    for (let i = 0; i < uniqueSymbols.length; i++) {
      quoteMap.set(uniqueSymbols[i], quotes[i]);
    }

    const rankings = accounts.map((account) => {
      let holdingsValue = 0;
      for (const pos of account.positions) {
        const quote = quoteMap.get(pos.symbol);
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
    });

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
