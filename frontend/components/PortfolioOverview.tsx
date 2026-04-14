import { useEffect, useState } from "react";
import type { Portfolio } from "@stock/shared";
import { LEVELS, getCurrentLevel, getNextLevel, getLevelProgress } from "@stock/shared";

export function PortfolioOverview({ portfolio }: { portfolio: Portfolio }) {
  const dayUp = (portfolio.dayChangeDollar ?? 0) >= 0;
  
  // Blended Ranking Logic
  const xp = portfolio.experiencePoints ?? 0;
  const profit = portfolio.totalValue - 100000;
  const traderScore = Number((profit + (xp * 50)).toFixed(2));
  
  const currentLevel = getCurrentLevel(traderScore);
  const nextLevel = getNextLevel(traderScore);
  const progress = getLevelProgress(traderScore);
  const levelNumber = LEVELS.indexOf(currentLevel) + 1;

  const [levelUp, setLevelUp] = useState(false);

  useEffect(() => {
    const prevScoreStr = localStorage.getItem('prevTraderScore');
    if (prevScoreStr) {
      const prevScore = Number(prevScoreStr);
      const prevLevel = getCurrentLevel(prevScore);
      const prevLevelIndex = LEVELS.indexOf(prevLevel);
      const currentLevelIndex = LEVELS.indexOf(currentLevel);
      if (currentLevelIndex > prevLevelIndex) {
        setLevelUp(true);
        setTimeout(() => setLevelUp(false), 5000); // hide after 5s
      }
    }
    localStorage.setItem('prevTraderScore', traderScore.toString());
  }, [traderScore, currentLevel]);

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
        {levelUp && (
          <div className="mb-4 p-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium animate-pulse">
            🎉 Congratulations! You leveled up to {currentLevel.label}!
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Level {levelNumber}</p>
            <h4 className="text-sm font-black text-slate-900 mt-0.5">{currentLevel.label}</h4>
          </div>
          <span className="text-2xl">{currentLevel.icon}</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
          <span>{traderScore.toLocaleString()} Score</span>
          {nextLevel && <span> / {nextLevel.min.toLocaleString()} Score</span>}
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
