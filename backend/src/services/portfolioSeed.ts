import type { PortfolioPreset } from "@stock/shared";
import { getPortfolioPreset } from "@stock/shared";

type Quote = {
  symbol: string;
  name: string;
  currentPrice: number;
};

export interface SeededPositionInput {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
}

export interface StarterPortfolioSeed {
  preset: PortfolioPreset;
  positions: SeededPositionInput[];
  cashBalance: number;
  totalInvested: number;
}

export async function buildStarterPortfolio(
  presetId: string | null | undefined,
  getQuote: (symbol: string) => Promise<Quote | null>
): Promise<StarterPortfolioSeed> {
  const preset = getPortfolioPreset(presetId);
  const totalBalance = 10_000;
  const investableBalance = totalBalance * (1 - preset.cashBufferPct);

  const quotes = await Promise.all(
    preset.allocations.map(async (allocation) => {
      const quote = await getQuote(allocation.symbol);
      return {
        allocation,
        quote
      };
    })
  );

  const positions: SeededPositionInput[] = [];
  let totalInvested = 0;

  for (const { allocation, quote } of quotes) {
    if (!quote?.currentPrice || quote.currentPrice <= 0) {
      continue;
    }

    const targetValue = investableBalance * allocation.weight;
    const quantity = Math.max(1, Math.floor(targetValue / quote.currentPrice));
    const invested = Number((quantity * quote.currentPrice).toFixed(2));

    if (quantity <= 0 || invested <= 0) {
      continue;
    }

    positions.push({
      symbol: quote.symbol ?? allocation.symbol,
      name: quote.name || allocation.symbol,
      quantity,
      averageCost: Number(quote.currentPrice.toFixed(2))
    });
    totalInvested += invested;
  }

  if (positions.length === 0) {
    const fallbackQuote = await getQuote("VTI");
    if (fallbackQuote?.currentPrice) {
      const quantity = Math.max(1, Math.floor(investableBalance / fallbackQuote.currentPrice));
      positions.push({
        symbol: fallbackQuote.symbol,
        name: fallbackQuote.name,
        quantity,
        averageCost: Number(fallbackQuote.currentPrice.toFixed(2))
      });
      totalInvested = Number((quantity * fallbackQuote.currentPrice).toFixed(2));
    }
  }

  const cashBalance = Math.max(0, Number((totalBalance - totalInvested).toFixed(2)));

  return {
    preset,
    positions,
    cashBalance,
    totalInvested: Number(totalInvested.toFixed(2))
  };
}

