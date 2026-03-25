"use client";

import type { Portfolio } from "@stock/shared";

export function PortfolioOverview({ portfolio }: { portfolio: Portfolio }) {
  const dayUp = (portfolio.dayChangeDollar ?? 0) >= 0;
  const dayArrow = dayUp ? "↑" : "↓";
  const dayColor = dayUp ? "text-emerald-600" : "text-rose-600";
  const dollar = portfolio.dayChangeDollar;
  const dollarStr =
    dollar === undefined
      ? ""
      : ` (${dayUp ? "+" : "-"}$${Math.abs(dollar).toLocaleString(undefined, { maximumFractionDigits: 2 })})`;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card label="Total Value" value={`$${portfolio.totalValue.toLocaleString()}`} />
      <Card label="Cash Balance" value={`$${portfolio.cashBalance.toLocaleString()}`} />
      <Card
        label="Day change (est.)"
        sublabel="Live quote day %, cash-weighted"
        value={`${dayArrow} ${portfolio.dayChangePct.toFixed(2)}%${dollarStr}`}
        className={dayColor}
      />
    </div>
  );
}

function Card({
  label,
  sublabel,
  value,
  className
}: {
  label: string;
  sublabel?: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      {sublabel ? <p className="text-xs text-slate-400">{sublabel}</p> : null}
      <p className={`text-2xl font-semibold ${className ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}
