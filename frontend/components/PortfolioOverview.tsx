import type { Portfolio } from "@stock/shared";

export function PortfolioOverview({ portfolio }: { portfolio: Portfolio }) {
  const dayUp = (portfolio.dayChangeDollar ?? 0) >= 0;
  
  // Blended Ranking Logic
  const xp = portfolio.experiencePoints ?? 0;
  const profit = portfolio.totalValue - 100000;
  const traderScore = Number((profit + (xp * 50)).toFixed(2));
  
  const LEVELS = [
    { min: -5000, label: "Rookie", icon: "🌱", color: "bg-emerald-100 text-emerald-700" },
    { min: 5000, label: "Day Trader", icon: "🚀", color: "bg-blue-100 text-blue-700" },
    { min: 15000, label: "Market Pro", icon: "📈", color: "bg-indigo-100 text-indigo-700" },
    { min: 50000, label: "Portfolio Whale", icon: "🐋", color: "bg-purple-100 text-purple-700" },
    { min: 150000, label: "Wall Street Guru", icon: "💎", color: "bg-fuchsia-100 text-fuchsia-700" },
    { min: 500000, label: "Market Legend", icon: "👑", color: "bg-amber-100 text-amber-700" },
  ];

  const currentLevelIndex = [...LEVELS].reverse().findIndex(l => traderScore >= l.min);
  const levelIdx = currentLevelIndex === -1 ? 0 : (LEVELS.length - 1 - currentLevelIndex);
  const currentLevel = LEVELS[levelIdx];
  const nextLevel = LEVELS[levelIdx + 1];

  const progress = nextLevel 
    ? ((traderScore - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;

  const marketValue = portfolio.totalValue - portfolio.cashBalance;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard 
        label="Net Worth" 
        value={`$${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        trend={portfolio.dayChangePct}
        isCurrency
      />
      <StatCard 
        label="Available Cash" 
        value={`$${portfolio.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        icon="💵"
      />
      <StatCard 
        label="Market Value" 
        value={`$${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        icon="📊"
      />
      <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl border border-slate-100 transition-all hover:shadow-2xl hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Level {levelIdx + 1}</p>
            <h4 className="text-sm font-black text-slate-900 mt-0.5">{currentLevel.label}</h4>
          </div>
          <span className="text-2xl">{currentLevel.icon}</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
          <span>{traderScore.toLocaleString()} Score</span>
          {nextLevel && <span>{nextLevel.min.toLocaleString()} Score</span>}
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000" 
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          ></div>
        </div>
        <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] font-medium text-slate-400">
                {xp} XP · ${profit.toLocaleString()} Profit
            </p>
        </div>
      </div>
      <StatCard 
        label="Day Performance" 
        value={`${dayUp ? "+" : ""}${portfolio.dayChangePct.toFixed(2)}%`}
        subValue={`$${Math.abs(portfolio.dayChangeDollar ?? 0).toLocaleString()}`}
        trend={portfolio.dayChangePct}
      />
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  subValue, 
  trend, 
  icon,
  isCurrency 
}: { 
  label: string; 
  value: string; 
  subValue?: string; 
  trend?: number; 
  icon?: string;
  isCurrency?: boolean;
}) {
  const isPositive = (trend ?? 0) >= 0;
  
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl border border-slate-100 transition-all hover:shadow-2xl hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-black tracking-tight text-slate-900">{value}</h3>
      </div>
      {subValue && (
        <p className={`mt-1 text-sm font-bold ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
          {isPositive ? "▲" : "▼"} {subValue}
        </p>
      )}
      {isCurrency && trend !== undefined && (
         <div className={`mt-2 inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {isPositive ? "+" : ""}{trend.toFixed(2)}%
         </div>
      )}
    </div>
  );
}
