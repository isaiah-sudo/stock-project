export type RiskLevel = "low" | "moderate" | "high";

export type EducationalOrderType = "market" | "limit" | "stop";

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  changePct: number;
  marketValue?: number;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  changePct?: number;
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

export * from './levels';

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

export interface TradePreviewRequest {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  orderType?: EducationalOrderType;
  limitPrice?: number;
  stopPrice?: number;
}

export interface TradePreview {
  symbol: string;
  side: "buy" | "sell";
  orderType: EducationalOrderType;
  quantity: number;
  estimatedPrice: number;
  estimatedNotional: number;
  projectedCashBalance: number;
  currentCashBalance: number;
  positionQuantityBefore: number;
  positionQuantityAfter: number;
  largestPositionSharePct: number;
  diversificationLabel: string;
  riskLevel: string;
  orderTypeExplanation: string;
  marketContext: string;
  beginnerSummary: string;
  learningBullets: Array<{
    label: string;
    explanation: string;
    tone: "good" | "caution" | "neutral";
  }>;
  warnings: string[];
}

export interface PaperTransaction {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  occurredAt: string;
}

export interface PaperEducation {
  title: string;
  summary: string;
  outcome: string;
  riskTakeaway: string;
  diversificationTakeaway: string;
  strategyTakeaway: string;
  psychologyTakeaway: string;
  lessonTags: string[];
}

export interface PaperOrderResponse {
  ok: boolean;
  transaction: PaperTransaction;
  cashBalance: number;
  education: PaperEducation;
}

export interface LearningChallengeOption {
  id: string;
  label: string;
  explanation: string;
  isBest: boolean;
}

export interface LearningChallenge {
  id: string;
  category: string;
  title: string;
  scenario: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  concept: string;
  options: LearningChallengeOption[];
  takeaway: string;
}

export interface PortfolioCoaching {
  riskLevel: string;
  diversificationLabel: string;
  concentrationPct: number;
  cashPct: number;
  holdingsCount: number;
  styleLabel: string;
  summary: string;
  strengths: string[];
  cautions: string[];
  nextLessons: string[];
  reflectionPrompt: string;
}
