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
    
    const now = new Date();
    const endMs = now.getTime();
    
    // Show the last 8 hours, aligned to the hour
    const lookbackMs = 8 * 60 * 60 * 1000;
    const startMsRaw = endMs - lookbackMs;
    const startDate = new Date(startMsRaw);
    startDate.setMinutes(0, 0, 0);
    const startMs = startDate.getTime();
    
    // Generate points every 15 minutes for a smooth line
    const intervalMs = 15 * 60 * 1000;
    const points: number[] = [];
    for (let t = startMs; t <= endMs; t += intervalMs) {
      points.push(t);
    }
    
    // Ensure the last point is exactly 'now' for the current price
    if (points[points.length - 1] < endMs) {
      points.push(endMs);
    }

    const timeSpan = endMs - startMs;

    return points.map((timestamp) => {
      const relativeFraction = timeSpan > 0 ? (timestamp - startMs) / timeSpan : 0;

      // Interpolated baseline
      const linearValue = startValue + (marketValue - startValue) * relativeFraction;

      // Use absolute time for stable noise generation
      const hoursEpoch = timestamp / (1000 * 60 * 60);
      const timeScale = hoursEpoch / 8; // scale to match original 8-hour window frequency
      
      // Deterministic pseudo-random based on timestamp
      const pseudoRandom = Math.abs(Math.sin(timestamp * 12.9898) * 43758.5453) % 1;

      // Sharp movements and volatility (deterministic)
      const noise = (
        Math.sin(timeScale * 12) * 0.008 + 
        Math.sin(timeScale * 25) * 0.004 + 
        (pseudoRandom - 0.5) * 0.015
      ) * (startValue || 1000);

      // Scale noise so it doesn't deviate from start/end points
      const envelope = Math.sin(relativeFraction * Math.PI);
      const value = linearValue + (noise * envelope);

      const date = new Date(timestamp);
      // Clean labels like "2:00 PM"
      const label = date.toLocaleTimeString([], { 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true 
      });

      return {
        label,
        value: Number(value.toFixed(2)),
        timestamp,
      };
    });
  }, [totalValue, dayChangeDollar, portfolio.cashBalance]);

  const values = chartData.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const marketValue = totalValue - (portfolio.cashBalance ?? 0);

  // Generate ticks: min, max, and every $100 in between
  const ticks = [dataMin];
  const firstHundred = Math.ceil(dataMin / 100) * 100;
  const lastHundred = Math.floor(dataMax / 100) * 100;
  
  for (let i = firstHundred; i <= lastHundred; i += 100) {
    // Prevent overlapping labels by requiring at least $15 distance from min/max
    if (i - dataMin > 15 && dataMax - i > 15) {
      ticks.push(i);
    }
  }
  
  if (dataMax > dataMin) {
    ticks.push(dataMax);
  }

  const isPositive = dayChangeDollar >= 0;
  const lineColor = isPositive ? "#10b981" : "#ef4444";

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
              domain={[dataMin, dataMax]} 
              ticks={ticks}
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
              fill={lineColor}
              fillOpacity={0.12}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: lineColor }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
