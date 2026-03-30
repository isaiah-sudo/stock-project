import type { Portfolio } from "@stock/shared";

export function PortfolioOverview({ portfolio }: { portfolio: Portfolio }) {
  const dayUp = (portfolio.dayChangeDollar ?? 0) >= 0;
  
  // Dynamic Rank Calculation
  const getRank = (val: number) => {
    if (val < 11000) return { label: "Rookie", icon: "🌱", color: "bg-emerald-100 text-emerald-700" };
    if (val < 15000) return { label: "Pro Trader", icon: "🚀", color: "bg-blue-100 text-blue-700" };
    if (val < 25000) return { label: "Market Whale", icon: "🐋", color: "bg-purple-100 text-purple-700" };
    return { label: "Legend", icon: "👑", color: "bg-amber-100 text-amber-700" };
  };

  const rank = getRank(portfolio.totalValue);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl border border-slate-100 transition-all hover:shadow-2xl hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Trader Rank</p>
          <span className="text-2xl">{rank.icon}</span>
        </div>
        <p className={`mt-2 inline-block rounded-xl px-3 py-1 text-sm font-extrabold ${rank.color}`}>
          {rank.label}
        </p>
        <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000" 
            style={{ width: `${Math.min(100, (portfolio.totalValue / 25000) * 100)}%` }}
          ></div>
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
