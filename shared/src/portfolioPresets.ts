export type PortfolioPresetId = "conservative" | "standard" | "aggressive";

export interface PortfolioPresetAllocation {
  symbol: string;
  weight: number;
}

export interface PortfolioPreset {
  id: PortfolioPresetId;
  name: string;
  tagline: string;
  risk: "low" | "balanced" | "spicy";
  cashBufferPct: number;
  allocations: PortfolioPresetAllocation[];
}

export const PORTFOLIO_PRESETS: PortfolioPreset[] = [
  {
    id: "conservative",
    name: "Conservative",
    tagline: "Slow and steady with defensive names and ETFs.",
    risk: "low",
    cashBufferPct: 0.14,
    allocations: [
      { symbol: "VOO", weight: 0.38 },
      { symbol: "SCHD", weight: 0.22 },
      { symbol: "KO", weight: 0.14 },
      { symbol: "JNJ", weight: 0.12 },
      { symbol: "PG", weight: 0.10 }
    ]
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "Balanced exposure with a simple starter mix.",
    risk: "balanced",
    cashBufferPct: 0.10,
    allocations: [
      { symbol: "VTI", weight: 0.28 },
      { symbol: "AAPL", weight: 0.20 },
      { symbol: "MSFT", weight: 0.18 },
      { symbol: "JPM", weight: 0.14 },
      { symbol: "PEP", weight: 0.10 },
      { symbol: "QQQ", weight: 0.10 }
    ]
  },
  {
    id: "aggressive",
    name: "Aggressive",
    tagline: "Bigger swings, bigger bragging rights.",
    risk: "spicy",
    cashBufferPct: 0.07,
    allocations: [
      { symbol: "NVDA", weight: 0.24 },
      { symbol: "TSLA", weight: 0.18 },
      { symbol: "AMD", weight: 0.16 },
      { symbol: "PLTR", weight: 0.14 },
      { symbol: "COIN", weight: 0.10 },
      { symbol: "UBER", weight: 0.10 },
      { symbol: "CRWD", weight: 0.08 }
    ]
  }
];

export function getPortfolioPreset(id?: string | null) {
  const normalized = (id ?? "standard").toLowerCase();
  return PORTFOLIO_PRESETS.find((preset) => preset.id === normalized) ?? PORTFOLIO_PRESETS[1];
}

