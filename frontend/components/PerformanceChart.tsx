"use client";

import type { Portfolio } from "@stock/shared";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PerformanceChart({ portfolio }: { portfolio: Portfolio }) {
  const currentValue = portfolio.totalValue;
  const dayChangePct = portfolio.dayChangePct ?? 0;
  const prevValue = dayChangePct !== -100 ? Number((currentValue / (1 + dayChangePct / 100)).toFixed(2)) : Math.max(0, currentValue - (portfolio.dayChangeDollar ?? 0));

  // Build a richer line dataset to show better stock-like movement even for small changes.
  const points = 8;
  const delta = currentValue - prevValue;
  const baseData = Array.from({ length: points + 1 }, (_, i) => {
    const t = i / points;
    const trendValue = prevValue + delta * t;
    const swing = (Math.sin(Math.PI * 2 * t) * 0.4 + 0.6) * (Math.abs(delta) * 0.3);
    const wiggle = (i === 0 || i === points) ? 0 : (Math.random() - 0.5) * swing;
    return {
      label: i === 0 ? "Open" : i === points ? "Now" : `T${i}`,
      value: Number(Math.max(0, trendValue + wiggle).toFixed(2))
    };
  });

  const values = baseData.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const buffer = Math.max((dataMax - dataMin) * 0.12, Math.max(dataMax * 0.002, 0.5));

  return (
    <div className="h-64 rounded-2xl bg-white p-4 shadow">
      <h3 className="mb-3 text-lg font-semibold">Performance (Today)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={baseData}>
          <XAxis dataKey="label" />
          <YAxis
            domain={[Math.max(0, dataMin - buffer), dataMax + buffer]}
            tickFormatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
