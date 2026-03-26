"use client";

import type { Portfolio } from "@stock/shared";
import { useMemo } from "react";
import {
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
    // We'll generate 24 points representing a volatile path for today
    const dataPoints = 24;
    const startValue = totalValue - dayChangeDollar;
    const now = Date.now();
    const startTime = now - 8 * 60 * 60 * 1000; // Last 8 hours

    return Array.from({ length: dataPoints }, (_, i) => {
      const timeFraction = i / (dataPoints - 1);
      const timestamp = startTime + timeFraction * (now - startTime);
      
      // Interpolated baseline
      const linearValue = startValue + (totalValue - startValue) * timeFraction;
      
      // Sharp movements and volatility
      // We use multiple sine waves and random jumps for a realistic feel
      const noise = (
        Math.sin(timeFraction * 12) * 0.008 + 
        Math.sin(timeFraction * 25) * 0.004 + 
        (Math.random() - 0.5) * 0.015
      ) * totalValue;
      
      // Ensure it starts exactly at startValue and ends exactly at totalValue
      const envelope = Math.sin(timeFraction * Math.PI);
      const value = linearValue + (noise * envelope);

      const date = new Date(timestamp);
      return {
        label: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        value: Number(value.toFixed(2)),
        timestamp,
      };
    });
  }, [totalValue, dayChangeDollar]);

  const values = chartData.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const buffer = (dataMax - dataMin) * 0.2 || totalValue * 0.01;

  const isPositive = dayChangeDollar >= 0;
  const themeColor = isPositive ? "#10b981" : "#ef4444";

  return (
    <div className="h-80 w-full rounded-3xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Portfolio Balance</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-black text-gray-900">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColor} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
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
              formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Balance"]}
              cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={themeColor}
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: themeColor }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
