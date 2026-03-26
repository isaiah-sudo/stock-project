import type { Portfolio, Transaction } from "@stock/shared";
import { mockPortfolio, mockTransactions } from "./mockData.js";
import { computePortfolioDayMetrics } from "./portfolioMetrics.js";
import { paperTradingService } from "./paperTradingService.js";

export interface BrokerageAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class BrokerageService {
  async getWebullOAuthUrl(userId: string) {
    const redirect = encodeURIComponent("https://your-app/callback/webull");
    return `https://api.webull.com/oauth/authorize?client_id=replace-me&state=${userId}&redirect_uri=${redirect}&response_type=code`;
  }

  async exchangeWebullCodeForTokens(_code: string): Promise<BrokerageAuthTokens> {
    return {
      accessToken: "encrypted_access_token_placeholder",
      refreshToken: "encrypted_refresh_token_placeholder",
      expiresAt: Date.now() + 1000 * 60 * 60
    };
  }

  async getPortfolio(userId: string): Promise<Portfolio> {
    const paperPortfolio = await paperTradingService.getPortfolio(userId);
    if (paperPortfolio) return paperPortfolio;
    // TODO: Fetch live brokerage portfolio when linked with a real provider.
    // For demo mode, refresh mock holdings with live quotes when available.
    const liveHoldings = await Promise.all(
      mockPortfolio.holdings.map(async (holding) => {
        const quote = await paperTradingService.getQuote(holding.symbol);
        const currentPrice = quote?.currentPrice ?? holding.currentPrice;
        const changePct = quote?.changePct ?? holding.changePct;
        return {
          ...holding,
          currentPrice,
          changePct
        };
      })
    );
    const { totalValue, dayChangePct, dayChangeDollar } = computePortfolioDayMetrics({
      cashBalance: mockPortfolio.cashBalance,
      holdings: liveHoldings
    });

    return {
      ...mockPortfolio,
      holdings: liveHoldings,
      totalValue,
      dayChangePct,
      dayChangeDollar
    };
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    const paperTransactions = await paperTradingService.getTransactions(userId);
    if (paperTransactions) return paperTransactions;
    // TODO: Fetch transaction history from real brokerage provider.
    return mockTransactions;
  }
}
