export interface Level {
  min: number;
  label: string;
  icon: string;
  color: string;
}

export const LEVELS: Level[] = [
  { min: -10000, label: "Novice", icon: "🌱", color: "bg-emerald-100 text-emerald-700" },
  { min: -5000, label: "Rookie", icon: "🌱", color: "bg-emerald-100 text-emerald-700" },
  { min: 0, label: "Beginner", icon: "🚀", color: "bg-blue-100 text-blue-700" },
  { min: 5000, label: "Day Trader", icon: "🚀", color: "bg-blue-100 text-blue-700" },
  { min: 10000, label: "Active Trader", icon: "📈", color: "bg-indigo-100 text-indigo-700" },
  { min: 15000, label: "Market Pro", icon: "📈", color: "bg-indigo-100 text-indigo-700" },
  { min: 25000, label: "Experienced Trader", icon: "🐋", color: "bg-purple-100 text-purple-700" },
  { min: 50000, label: "Portfolio Whale", icon: "🐋", color: "bg-purple-100 text-purple-700" },
  { min: 100000, label: "Wealth Builder", icon: "💎", color: "bg-fuchsia-100 text-fuchsia-700" },
  { min: 150000, label: "Wall Street Guru", icon: "💎", color: "bg-fuchsia-100 text-fuchsia-700" },
  { min: 250000, label: "Elite Investor", icon: "👑", color: "bg-amber-100 text-amber-700" },
  { min: 500000, label: "Market Legend", icon: "👑", color: "bg-amber-100 text-amber-700" },
];

export function getCurrentLevel(traderScore: number): Level {
  const currentLevelIndex = [...LEVELS].reverse().findIndex(l => traderScore >= l.min);
  const levelIdx = currentLevelIndex === -1 ? 0 : (LEVELS.length - 1 - currentLevelIndex);
  return LEVELS[levelIdx];
}

export function getNextLevel(traderScore: number): Level | null {
  const currentLevel = getCurrentLevel(traderScore);
  const currentIndex = LEVELS.indexOf(currentLevel);
  return LEVELS[currentIndex + 1] || null;
}

export function getLevelProgress(traderScore: number): number {
  const currentLevel = getCurrentLevel(traderScore);
  const nextLevel = getNextLevel(traderScore);
  if (!nextLevel) return 100;
  return ((traderScore - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100;
}