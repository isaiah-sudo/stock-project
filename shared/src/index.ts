export type RiskLevel = "low" | "moderate" | "high";

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  changePct: number;
}

export interface Portfolio {
  accountId: string;
  cashBalance: number;
  totalValue: number;
  dayChangePct: number;
  /** Estimated $ change today on equity (cash excluded); from quote day % on each holding */
  dayChangeDollar?: number;
  experiencePoints?: number;
  holdings: Holding[];
}

export interface Transaction {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  occurredAt: string;
}

export interface ChatRequest {
  message: string;
  accountId: string;
  model?: string;
}

export interface ChatResponse {
  reply: string;
  model: string;
}
