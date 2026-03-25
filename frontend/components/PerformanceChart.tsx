"use client";

import type { Portfolio } from "@stock/shared";
import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DataPoint {
  label: string;
  value: number;
  timestamp: number;
}

export function PerformanceChart({ portfolio }: { portfolio: Portfolio }) {
  const investedMoney = portfolio.totalValue - portfolio.cashBalance;
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [basePrice] = useState(investedMoney);

  // Initialize chart with 3-hour history on mount
  useEffect(() => {
    const now = Date.now();
    const threeHoursMs = 3 * 60 * 60 * 1000;
    const dataPoints = 36; // One point every 5 minutes for 3 hours

    const initialData = Array.from({ length: dataPoints }, (_, i) => {
      const timeFraction = i / (dataPoints - 1);
      const timestamp = now - threeHoursMs + timeFraction * threeHoursMs;
      
      // Generate realistic price movement with trending + volatility
      const trend = (Math.sin(timeFraction * Math.PI * 2) * 0.03 + 0.02) * basePrice;
      const volatility = (Math.random() - 0.5) * 0.04 * basePrice;
      const value = basePrice + trend + volatility;

      const date = new Date(timestamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const label = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

      return { label, value: Number(value.toFixed(2)), timestamp };
    });

    setChartData(initialData);
  }, [basePrice]);

  // Update chart every 5 seconds with new data point (rolling window)
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prevData) => {
        const now = Date.now();
        
        // Add new data point
        const timeFraction = (now - (prevData[prevData.length - 1]?.timestamp || now)) / (5 * 60 * 1000);
        const lastValue = prevData[prevData.length - 1]?.value || basePrice;
        
        // Create realistic next point with smaller random movement
        const volatility = (Math.random() - 0.5) * 0.02 * basePrice;
        const momentum = (Math.random() - 0.5) * 0.01 * basePrice;
        const newValue = lastValue + volatility + momentum;

        const date = new Date(now);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const label = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

        const newPoint: DataPoint = {
          label,
          value: Number(newValue.toFixed(2)),
          timestamp: now
        };

        // Keep only last 36 points (3 hours at 5-minute intervals) 
        const updated = [...prevData, newPoint].slice(-36);
        return updated;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [basePrice]);

  if (chartData.length === 0) {
    return <div className="h-64 rounded-2xl bg-white p-4 shadow animate-pulse" />;
  }

  const values = chartData.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const buffer = Math.max((dataMax - dataMin) * 0.15, Math.max(dataMax * 0.005, 0.5));

  // Only show select labels to avoid crowding
  const displayData = chartData.map((point, i) => ({
    ...point,
    displayLabel: i % 6 === 0 || i === chartData.length - 1 ? point.label : ""
  }));

  return (
    <div className="h-64 rounded-2xl bg-white p-4 shadow">
      <h3 className="mb-3 text-lg font-semibold">Performance (Last 3 Hours)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={displayData}>
          <XAxis dataKey="displayLabel" />
          <YAxis
            domain={[Math.max(0, dataMin - buffer), dataMax + buffer]}
            tickFormatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
