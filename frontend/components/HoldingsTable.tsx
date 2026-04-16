"use client";

import { useMemo, useState } from "react";
import type { Holding } from "@stock/shared";

const sortOptions = [
  { value: "marketValue", label: "Market Value" },
  { value: "returnContribution", label: "Return Contribution" },
  { value: "pnl", label: "P/L" },
  { value: "allocation", label: "Allocation" },
];

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  const [sortKey, setSortKey] = useState<string>("marketValue");
  const holdingsValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);

  const sorted = useMemo(() => {
    return [...holdings].sort((a, b) => {
      const aMarketValue = a.quantity * a.currentPrice;
      const bMarketValue = b.quantity * b.currentPrice;
      const aCost = a.quantity * a.averageCost;
      const bCost = b.quantity * b.averageCost;
      const aPnl = aMarketValue - aCost;
      const bPnl = bMarketValue - bCost;
      const aPnlPct = a.averageCost > 0 ? ((a.currentPrice - a.averageCost) / a.averageCost) * 100 : 0;
      const bPnlPct = b.averageCost > 0 ? ((b.currentPrice - b.averageCost) / b.averageCost) * 100 : 0;
      const aAlloc = holdingsValue > 0 ? (aMarketValue / holdingsValue) * 100 : 0;
      const bAlloc = holdingsValue > 0 ? (bMarketValue / holdingsValue) * 100 : 0;
      const aReturnContribution = holdingsValue > 0 ? (aAlloc * aPnlPct) / 100 : 0;
      const bReturnContribution = holdingsValue > 0 ? (bAlloc * bPnlPct) / 100 : 0;

      switch (sortKey) {
        case "returnContribution":
          return bReturnContribution - aReturnContribution;
        case "pnl":
          return bPnl - aPnl;
        case "allocation":
          return bAlloc - aAlloc;
        case "marketValue":
        default:
          return bMarketValue - aMarketValue;
      }
    });
  }, [holdings, holdingsValue, sortKey]);

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
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">Holdings Breakdown</h3>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <label htmlFor="sortKey" className="font-medium">Sorted by</label>
          <select
            id="sortKey"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
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
