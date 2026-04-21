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
<<<<<<< Updated upstream
=======
}

export interface Quote {
  symbol: string;
  name: string;
  currentPrice: number;
  changePct: number;
  source?: string;
  asOf?: string;
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
export type EducationalOrderType = "market" | "limit" | "stop";

=======
>>>>>>> Stashed changes
export interface TradePreviewRequest {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  orderType?: EducationalOrderType;
  limitPrice?: number;
  stopPrice?: number;
}

<<<<<<< Updated upstream
export interface LearningBullet {
  label: string;
  explanation: string;
  tone: "good" | "caution" | "neutral";
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
  learningBullets: LearningBullet[];
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
=======
export interface TradePreview {
  warnings: string[];
  learningBullets: Array<{
    label: string;
    explanation: string;
    tone: "good" | "caution" | "neutral";
  }>;
  estimatedPrice: number;
  estimatedCost?: number;
  impactAssessment?: string;
  marketContext?: string;
>>>>>>> Stashed changes
}

export interface PaperOrderResponse {
  ok: boolean;
<<<<<<< Updated upstream
  transaction: PaperTransaction;
  cashBalance: number;
  education: PaperEducation;
}

export interface LearningChallengeOption {
  id: string;
  label: string;
  explanation: string;
  isBest: boolean;
=======
  error?: string;
  orderId?: string;
  education: {
    lessonTags: string[];
    keyLearning?: string;
    psychologyTakeaway?: string;
  };
>>>>>>> Stashed changes
}

export interface LearningChallenge {
  id: string;
  category: string;
  title: string;
  scenario: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  concept: string;
<<<<<<< Updated upstream
  options: LearningChallengeOption[];
=======
  options: Array<{
    id: string;
    label: string;
    explanation: string;
    isBest: boolean;
  }>;
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  strengths: string;
  cautions: string;
  nextLessons: string;
  reflectionPrompt: string;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  changePct?: number;
}
=======
  strengths: string[];
  cautions: string[];
  nextLessons: string[];
  reflectionPrompt: string;
}
>>>>>>> Stashed changes
