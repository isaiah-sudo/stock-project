"use client";

import type { Portfolio } from "@stock/shared";
import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function PerformanceChart({ portfolio }: { portfolio: Portfolio }) {
  const { totalValue, dayChangeDollar = 0, dayChangePct } = portfolio;

  const chartData = useMemo(() => {
    const marketValue = totalValue - (portfolio.cashBalance ?? 0);
    const startValue = marketValue - dayChangeDollar;
    const now = Date.now();
    const dataPoints = 24;
    const startTime = now - 8 * 60 * 60 * 1000; // Last 8 hours

    const data = Array.from({ length: dataPoints }, (_, i) => {
      const timeFraction = i / (dataPoints - 1);
      const timestamp = startTime + timeFraction * (now - startTime);
      
      // Interpolated baseline
      const linearValue = startValue + (marketValue - startValue) * timeFraction;
      
      // Sharp movements and volatility
      // We use multiple sine waves and random jumps for a realistic feel
      const noise = (
        Math.sin(timeFraction * 12) * 0.008 + 
        Math.sin(timeFraction * 25) * 0.004 + 
        (Math.random() - 0.5) * 0.015
      ) * (marketValue || 1000); // Use a baseline if marketValue is 0
      
      // Ensure it starts exactly at startValue and ends exactly at marketValue
      const envelope = Math.sin(timeFraction * Math.PI);
      const value = linearValue + (noise * envelope);

      const date = new Date(timestamp);
      return {
        label: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        value: Number(value.toFixed(2)),
        timestamp,
      };
    });

    return data.map((point, index) => {
      const prevValue = index > 0 ? data[index - 1].value : undefined;
      const nextValue = index < data.length - 1 ? data[index + 1].value : undefined;
      const direction = index === 0
        ? nextValue !== undefined && nextValue < point.value
          ? "negative"
          : "positive"
        : point.value < (prevValue ?? point.value)
          ? "negative"
          : "positive";

      return {
        ...point,
        positiveValue: direction === "positive" ? point.value : null,
        negativeValue: direction === "negative" ? point.value : null,
      };
    });
  }, [totalValue, dayChangeDollar]);

  const values = chartData.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const marketValue = totalValue - (portfolio.cashBalance ?? 0);
  const buffer = (dataMax - dataMin) * 0.28 || marketValue * 0.02;

  const isPositive = dayChangeDollar >= 0;
  const themeColor = isPositive ? "#10b981" : "#ef4444";

  return (
    <div className="h-96 w-full rounded-3xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Market Value</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-black text-gray-900">
              ${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
              <span>{isPositive ? "▲" : "▼"}</span>
              <span>${Math.abs(dayChangeDollar).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className="opacity-60">({dayChangePct.toFixed(2)}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 18, right: 16, left: -10, bottom: 12 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={themeColor} stopOpacity={0.25}/>
                <stop offset="40%" stopColor={themeColor} stopOpacity={0.12}/>
                <stop offset="100%" stopColor={themeColor} stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
              minTickGap={40}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis 
              domain={[dataMin - buffer, dataMax + buffer]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
              tickFormatter={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: "#ffffff", 
                borderRadius: "12px", 
                border: "none", 
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                padding: "12px"
              }}
              itemStyle={{ fontSize: "14px", fontWeight: "bold", color: "#1e293b" }}
              labelStyle={{ fontSize: "11px", color: "#64748b", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}
              formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Market Value"]}
              cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="transparent"
              fill="url(#colorValue)"
              fillOpacity={1}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="positiveValue"
              stroke="#10b981"
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="negativeValue"
              stroke="#ef4444"
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: "#ef4444" }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
