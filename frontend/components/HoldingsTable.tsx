"use client";

import type { Holding } from "@stock/shared";

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  const holdingsValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
  const sorted = [...holdings].sort((a, b) => b.quantity * b.currentPrice - a.quantity * a.currentPrice);

  if (holdings.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow">
        <h3 className="mb-2 text-lg font-semibold">Holdings Breakdown</h3>
        <p className="text-sm text-slate-500">No positions yet. Place a paper trade to see live holdings.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Holdings Breakdown</h3>
        <p className="text-xs text-slate-500">Sorted by market value</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th>Symbol</th>
              <th>Name</th>
              <th>Qty</th>
              <th>Live Price</th>
              <th>Market Value</th>
              <th>P/L</th>
              <th>Alloc</th>
              <th>P/L %</th>
              <th>Return Contribution</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => {
              const marketValue = h.quantity * h.currentPrice;
              const costBasis = h.quantity * h.averageCost;
              const pnl = marketValue - costBasis;
              const pnlPct = h.averageCost > 0 ? ((h.currentPrice - h.averageCost) / h.averageCost) * 100 : 0;
              const alloc = holdingsValue > 0 ? (marketValue / holdingsValue) * 100 : 0;
              const returnContribution = holdingsValue > 0 ? (alloc * pnlPct) / 100 : 0;
              return (
              <tr key={h.symbol} className="border-t border-slate-100">
                <td className="py-2 font-medium">{h.symbol}</td>
                <td>{h.name}</td>
                <td>{h.quantity}</td>
                <td>${h.currentPrice.toFixed(2)}</td>
                <td>${marketValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td className={pnl >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td>{alloc.toFixed(1)}%</td>
                <td className={pnlPct >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {pnlPct >= 0 ? "+" : "-"}{Math.abs(pnlPct).toFixed(2)}%
                </td>
                <td className={returnContribution >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {returnContribution >= 0 ? "+" : "-"}{Math.abs(returnContribution).toFixed(2)}%
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
