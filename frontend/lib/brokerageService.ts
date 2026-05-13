import { paperTradingService } from "@/lib/paperTradingService";
import type { Portfolio, Transaction } from "@stock/shared";

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

  async getPortfolio(userId: string): Promise<Portfolio | null> {
    const paperPortfolio = await paperTradingService.getPortfolio(userId);
    if (paperPortfolio) return paperPortfolio;
    return null;
  }

  async getTransactions(userId: string): Promise<Transaction[] | null> {
    return paperTradingService.getTransactions(userId);
  }
}

export const brokerageService = new BrokerageService();
