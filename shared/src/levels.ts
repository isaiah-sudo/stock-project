export interface Level {
  min: number;
  label: string;
  icon: string;
  color: string;
}

export const LEVELS: Level[] = [
  { min: 0, label: "Novice", icon: "🌱", color: "bg-emerald-100 text-emerald-700" },
  { min: 5000, label: "Rookie", icon: "🌱", color: "bg-emerald-100 text-emerald-700" },
  { min: 10000, label: "Beginner", icon: "🚀", color: "bg-blue-100 text-blue-700" },
  { min: 20000, label: "Day Trader", icon: "🚀", color: "bg-blue-100 text-blue-700" },
  { min: 35000, label: "Active Trader", icon: "📈", color: "bg-indigo-100 text-indigo-700" },
  { min: 50000, label: "Market Pro", icon: "📈", color: "bg-indigo-100 text-indigo-700" },
  { min: 80000, label: "Experienced Trader", icon: "🐋", color: "bg-purple-100 text-purple-700" },
  { min: 125000, label: "Portfolio Whale", icon: "🐋", color: "bg-purple-100 text-purple-700" },
  { min: 200000, label: "Wealth Builder", icon: "💎", color: "bg-fuchsia-100 text-fuchsia-700" },
  { min: 300000, label: "Wall Street Guru", icon: "💎", color: "bg-fuchsia-100 text-fuchsia-700" },
  { min: 400000, label: "Elite Investor", icon: "👑", color: "bg-amber-100 text-amber-700" },
  { min: 500000, label: "Market Legend", icon: "👑", color: "bg-amber-100 text-amber-700" },
];

export function normalizeScore(traderScore: number): number {
  return Math.max(0, traderScore);
}

export function getCurrentLevelIndex(traderScore: number): number {
  const score = normalizeScore(traderScore);
  for (let index = LEVELS.length - 1; index >= 0; index -= 1) {
    if (score >= LEVELS[index].min) {
      return index;
    }
  }
  return 0;
}

export function getCurrentLevel(traderScore: number): Level {
  return LEVELS[getCurrentLevelIndex(traderScore)];
}

export function getNextLevel(traderScore: number): Level | null {
  const currentIndex = getCurrentLevelIndex(traderScore);
  return LEVELS[currentIndex + 1] || null;
}

export function getLevelProgress(traderScore: number): number {
  const score = normalizeScore(traderScore);
  const currentIndex = getCurrentLevelIndex(traderScore);
  const currentLevel = LEVELS[currentIndex];
  const nextLevel = LEVELS[currentIndex + 1];
  if (!nextLevel) return 100;
  return ((score - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100;
}
