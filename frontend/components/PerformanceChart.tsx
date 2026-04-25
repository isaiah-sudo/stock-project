"use client";

import type { Portfolio } from "@stock/shared";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "../lib/api";

type Timeframe = "1D" | "1W" | "1M" | "ALL";
type ChartMode = "line" | "candles";
type BenchmarkSymbol = "SPY" | "QQQ";

interface BenchmarkQuote {
  symbol: BenchmarkSymbol;
  name: string;
  currentPrice: number;
  changePct: number;
  asOf?: string;
}

interface ChartPoint {
  label: string;
  timestamp: number;
  portfolioValue: number;
  benchmarkPct: number | null;
  open: number;
  high: number;
  low: number;
  close: number;
  session: "regular" | "extended";
}

interface PerformanceChartProps {
  portfolio: Portfolio;
  marketOpen: boolean;
}

const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "ALL"];
const BENCHMARKS: BenchmarkSymbol[] = ["SPY", "QQQ"];

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function getStep(range: number) {
  if (range <= 25) return 5;
  if (range <= 60) return 10;
  if (range <= 150) return 25;
  if (range <= 300) return 50;
  if (range <= 800) return 100;
  return 250;
}

function createTicks(minValue: number, maxValue: number) {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return [0];
  }

  if (minValue === maxValue) {
    const pad = minValue === 0 ? 5 : Math.max(5, Math.abs(minValue) * 0.05);
    return [minValue - pad, minValue, minValue + pad];
  }

  const range = maxValue - minValue;
  const step = getStep(range);
  const start = Math.floor(minValue / step) * step;
  const end = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];

  for (let tick = start; tick <= end; tick += step) {
    ticks.push(Number(tick.toFixed(2)));
  }

  return ticks;
}

function etDateParts(timestamp: number) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    month: "numeric",
    day: "numeric",
  });

  const parts = formatter.formatToParts(new Date(timestamp));
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    weekday: weekdays[map.weekday] ?? 0,
    hour: Number(map.hour ?? 0),
    minute: Number(map.minute ?? 0),
    month: Number(map.month ?? 1),
    day: Number(map.day ?? 1),
  };
}

function isRegularSession(timestamp: number) {
  const parts = etDateParts(timestamp);
  if (parts.weekday === 0 || parts.weekday === 6) {
    return false;
  }

  const minutes = parts.hour * 60 + parts.minute;
  return minutes >= 9 * 60 + 30 && minutes <= 16 * 60;
}

function getTimeframeConfig(timeframe: Timeframe) {
  switch (timeframe) {
    case "1D":
      return {
        durationMs: 24 * 60 * 60 * 1000,
        intervalMs: 15 * 60 * 1000,
        label: (timestamp: number) =>
          new Date(timestamp).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
      };
    case "1W":
      return {
        durationMs: 7 * 24 * 60 * 60 * 1000,
        intervalMs: 12 * 60 * 60 * 1000,
        label: (timestamp: number) =>
          new Date(timestamp).toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
      };
    case "1M":
      return {
        durationMs: 30 * 24 * 60 * 60 * 1000,
        intervalMs: 24 * 60 * 60 * 1000,
        label: (timestamp: number) =>
          new Date(timestamp).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          }),
      };
    case "ALL":
      return {
        durationMs: 90 * 24 * 60 * 60 * 1000,
        intervalMs: 7 * 24 * 60 * 60 * 1000,
        label: (timestamp: number) =>
          new Date(timestamp).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          }),
      };
  }
}

function buildEstimatedSeries(args: {
  timeframe: Timeframe;
  marketValue: number;
  dayChangeDollar: number;
  benchmarkQuote: BenchmarkQuote | null;
}) {
  const { timeframe, marketValue, dayChangeDollar, benchmarkQuote } = args;
  const config = getTimeframeConfig(timeframe);
  const endMs = Date.now();
  const startMs = endMs - config.durationMs;
  const points: number[] = [];

  for (let timestamp = startMs; timestamp <= endMs; timestamp += config.intervalMs) {
    points.push(timestamp);
  }

  if (points[points.length - 1] !== endMs) {
    points.push(endMs);
  }

  const hasRealIntradayShape = timeframe === "1D" && marketValue > 0;
  const startValue = timeframe === "1D" ? Math.max(0, marketValue - dayChangeDollar) : marketValue;
  const benchmarkStart =
    benchmarkQuote && benchmarkQuote.changePct !== -100
      ? benchmarkQuote.currentPrice / (1 + benchmarkQuote.changePct / 100)
      : null;

  return points.map((timestamp, index) => {
    const progress = points.length === 1 ? 1 : index / (points.length - 1);
    const wave = Math.sin(progress * Math.PI * 2.2) * 0.012 + Math.sin(progress * Math.PI * 6) * 0.005;
    const envelope = Math.sin(progress * Math.PI);
    const estimated = hasRealIntradayShape
      ? startValue + (marketValue - startValue) * progress + startValue * wave * envelope
      : marketValue;
    const close = Number((marketValue <= 0 ? 0 : estimated).toFixed(2));
    const open = Number((index === 0 ? close : Number((close - startValue * wave * 0.35).toFixed(2))).toFixed(2));
    const high = Number(Math.max(open, close, close + Math.abs(close * 0.004)).toFixed(2));
    const low = Number(Math.min(open, close, close - Math.abs(close * 0.004)).toFixed(2));

    let benchmarkPct: number | null = null;
    if (benchmarkQuote && benchmarkStart && timeframe === "1D") {
      const benchmarkWave = Math.sin(progress * Math.PI * 1.8) * 0.2;
      const benchmarkValue =
        benchmarkStart +
        (benchmarkQuote.currentPrice - benchmarkStart) * progress +
        benchmarkStart * (benchmarkWave / 100) * envelope;
      benchmarkPct = Number((((benchmarkValue - benchmarkStart) / benchmarkStart) * 100).toFixed(2));
    } else if (benchmarkQuote && timeframe !== "1D") {
      benchmarkPct = Number(benchmarkQuote.changePct.toFixed(2));
    }

    return {
      label: config.label(timestamp),
      timestamp,
      portfolioValue: close,
      benchmarkPct,
      open,
      high,
      low,
      close,
      session: isRegularSession(timestamp) ? "regular" : "extended",
    } satisfies ChartPoint;
  });
}

function getSessionBands(data: ChartPoint[]) {
  const bands: Array<{ start: number; end: number }> = [];
  let activeBand: { start: number; end: number } | null = null;

  for (const point of data) {
    if (point.session === "extended") {
      if (!activeBand) {
        activeBand = { start: point.timestamp, end: point.timestamp };
      } else {
        activeBand.end = point.timestamp;
      }
    } else if (activeBand) {
      bands.push(activeBand);
      activeBand = null;
    }
  }

  if (activeBand) {
    bands.push(activeBand);
  }

  return bands;
}

function ChartTooltip(args: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  label?: string;
  showBenchmark: boolean;
  benchmarkSymbol: BenchmarkSymbol;
}) {
  const { active, payload, showBenchmark, benchmarkSymbol } = args;
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl shadow-slate-200/60 backdrop-blur">
      <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{point.label}</div>
      <div className="mt-2 text-lg font-black text-slate-900">{formatCurrency(point.portfolioValue)}</div>
      {showBenchmark && point.benchmarkPct !== null ? (
        <div className="mt-1 text-sm font-semibold text-slate-500">
          {benchmarkSymbol} {formatPercent(point.benchmarkPct)}
        </div>
      ) : null}
    </div>
  );
}

function CandlestickSeries(props: {
  data?: ChartPoint[];
  offset?: { left: number; top: number; width: number; height: number };
  yAxisMap?: Record<string, { scale: (value: number) => number }>;
}) {
  const { data = [], offset, yAxisMap } = props;

  if (!offset || !yAxisMap) {
    return null;
  }

  const yAxis = Object.values(yAxisMap)[0];
  if (!yAxis) {
    return null;
  }

  const candleWidth = Math.max(4, Math.min(12, offset.width / Math.max(data.length, 1) / 2));

  return (
    <g>
      {data.map((point, index) => {
        const step = offset.width / Math.max(data.length, 1);
        const x = offset.left + step * index + step / 2;
        const highY = yAxis.scale(point.high);
        const lowY = yAxis.scale(point.low);
        const openY = yAxis.scale(point.open);
        const closeY = yAxis.scale(point.close);
        const top = Math.min(openY, closeY);
        const height = Math.max(Math.abs(openY - closeY), 1.5);
        const positive = point.close >= point.open;
        const color = positive ? "#10b981" : "#ef4444";

        return (
          <g key={point.timestamp}>
            <line x1={x} x2={x} y1={highY} y2={lowY} stroke={color} strokeWidth={1.5} opacity={0.9} />
            <rect
              x={x - candleWidth / 2}
              y={top}
              width={candleWidth}
              height={height}
              rx={2}
              fill={color}
              fillOpacity={0.9}
            />
          </g>
        );
      })}
    </g>
  );
}

export function PerformanceChart({ portfolio, marketOpen }: PerformanceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [mode, setMode] = useState<ChartMode>("line");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [benchmarkEnabled, setBenchmarkEnabled] = useState(true);
  const [benchmarkSymbol, setBenchmarkSymbol] = useState<BenchmarkSymbol>("SPY");
  const [benchmarkQuote, setBenchmarkQuote] = useState<BenchmarkQuote | null>(null);

  const marketValue = Number((portfolio.totalValue - (portfolio.cashBalance ?? 0)).toFixed(2));
  const dayChangeDollar = portfolio.dayChangeDollar ?? 0;
  const hasHoldings = portfolio.holdings.length > 0 && marketValue > 0;

  useEffect(() => {
    let cancelled = false;

    apiFetch<BenchmarkQuote>(`/paper/quote?symbol=${benchmarkSymbol}`)
      .then((quote) => {
        if (!cancelled) {
          setBenchmarkQuote(quote);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBenchmarkQuote(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [benchmarkSymbol]);

  useEffect(() => {
    if (timeframe !== "1D" && mode === "candles") {
      setMode("line");
    }
    if (timeframe !== "1D" && benchmarkEnabled) {
      setBenchmarkEnabled(false);
    }
  }, [timeframe, mode, benchmarkEnabled]);

  const chartData = useMemo(
    () =>
      buildEstimatedSeries({
        timeframe,
        marketValue: hasHoldings ? marketValue : 0,
        dayChangeDollar: hasHoldings ? dayChangeDollar : 0,
        benchmarkQuote,
      }),
    [benchmarkQuote, dayChangeDollar, hasHoldings, marketValue, timeframe]
  );

  const activePoint = hoveredIndex !== null ? chartData[hoveredIndex] : chartData[chartData.length - 1];
  const startPoint = chartData[0];
  const currentValue = activePoint?.portfolioValue ?? marketValue;
  const isPositive = (activePoint?.portfolioValue ?? marketValue) >= (startPoint?.portfolioValue ?? marketValue);
  const lineColor = isPositive ? "#10b981" : "#ef4444";
  const values = chartData.map((point) => point.portfolioValue);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const yTicks = createTicks(dataMin, dataMax);
  const sessionBands = timeframe === "1D" ? getSessionBands(chartData) : [];
  const showBenchmark = benchmarkEnabled && timeframe === "1D" && benchmarkQuote !== null;

  return (
    <div className="h-[560px] w-full rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Market Value</p>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${marketOpen ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                {marketOpen ? "Regular Session" : "Markets Closed"}
              </span>
              {showBenchmark ? (
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-600">
                  vs {benchmarkSymbol}
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">{formatCurrency(currentValue)}</h2>
              <div className={`flex items-center gap-2 text-sm font-bold ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                <span>{formatCurrency(Math.abs(currentValue - (startPoint?.portfolioValue ?? currentValue)))}</span>
                <span className="text-slate-400">
                  ({formatPercent(startPoint?.portfolioValue ? ((currentValue - startPoint.portfolioValue) / startPoint.portfolioValue) * 100 : 0)})
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {hasHoldings
                ? timeframe === "1D"
                  ? "Header tracks the active chart point, with regular and extended trading separated visually."
                  : "Longer ranges pin to the latest live portfolio value until historical snapshots are available."
                : "No open positions yet, so your portfolio line stays flat at zero. Turn on a benchmark to watch the market alongside it."}
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap items-center gap-2 rounded-full bg-slate-100 p-1">
              {TIMEFRAMES.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeframe(range)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    timeframe === range ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-slate-200 p-1">
                <button
                  type="button"
                  onClick={() => setMode("line")}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    mode === "line" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Line
                </button>
                <button
                  type="button"
                  onClick={() => timeframe === "1D" && setMode("candles")}
                  disabled={timeframe !== "1D"}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    mode === "candles"
                      ? "bg-slate-900 text-white"
                      : timeframe === "1D"
                        ? "text-slate-500 hover:text-slate-900"
                        : "cursor-not-allowed text-slate-300"
                  }`}
                >
                  Candles
                </button>
              </div>

              <button
                type="button"
                onClick={() => timeframe === "1D" && setBenchmarkEnabled((value) => !value)}
                disabled={timeframe !== "1D"}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  showBenchmark
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : timeframe === "1D"
                      ? "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
                      : "cursor-not-allowed border-slate-200 text-slate-300"
                }`}
              >
                {showBenchmark ? "Hide Benchmark" : "Compare"}
              </button>

              <div className="flex items-center gap-1 rounded-full border border-slate-200 p-1">
                {BENCHMARKS.map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => setBenchmarkSymbol(symbol)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      benchmarkSymbol === symbol ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lineColor }} />
            Portfolio
          </span>
          {showBenchmark ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              {benchmarkQuote?.name ?? benchmarkSymbol} return
            </span>
          ) : null}
          {timeframe === "1D" ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
              Gray shading marks pre-market and after-hours activity
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              Historical account snapshots are not available yet for this range
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 h-[390px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 18, right: 18, left: 4, bottom: 8 }}
            onMouseMove={(state) => {
              if (typeof state.activeTooltipIndex === "number") {
                setHoveredIndex(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.28} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {sessionBands.map((band) => (
              <ReferenceArea
                key={`${band.start}-${band.end}`}
                x1={band.start}
                x2={band.end}
                yAxisId="portfolio"
                fill="#e2e8f0"
                fillOpacity={0.3}
                ifOverflow="extendDomain"
              />
            ))}

            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
              tickFormatter={(value: number) => {
                const point = chartData.find((entry) => entry.timestamp === value);
                return point?.label ?? "";
              }}
            />
            <YAxis
              yAxisId="portfolio"
              domain={dataMin === dataMax ? [dataMin - 5, dataMax + 5] : ["auto", "auto"]}
              ticks={yTicks}
              tickLine={false}
              axisLine={false}
              width={68}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
              tickFormatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
            {showBenchmark ? (
              <YAxis
                yAxisId="benchmark"
                orientation="right"
                domain={["auto", "auto"]}
                tickLine={false}
                axisLine={false}
                width={52}
                tick={{ fontSize: 11, fill: "#38bdf8", fontWeight: 700 }}
                tickFormatter={(value: number) => `${value.toFixed(1)}%`}
              />
            ) : null}
            <Tooltip
              content={<ChartTooltip showBenchmark={showBenchmark} benchmarkSymbol={benchmarkSymbol} />}
              cursor={{ stroke: "#cbd5e1", strokeWidth: 1.5, strokeDasharray: "3 4" }}
            />
            {mode === "line" ? (
              <>
                <Area
                  yAxisId="portfolio"
                  type="monotone"
                  dataKey="portfolioValue"
                  stroke="transparent"
                  fill="url(#portfolioFill)"
                  fillOpacity={1}
                  name="Portfolio"
                  isAnimationActive
                  animationDuration={900}
                />
                <Line
                  yAxisId="portfolio"
                  type="monotone"
                  dataKey="portfolioValue"
                  stroke={lineColor}
                  strokeWidth={3.5}
                  dot={false}
                  activeDot={{ r: 5, fill: lineColor, strokeWidth: 0 }}
                  name="Portfolio"
                  isAnimationActive
                  animationDuration={900}
                />
              </>
            ) : (
              <>
                <Line yAxisId="portfolio" type="monotone" dataKey="portfolioValue" stroke="transparent" dot={false} />
                <Customized component={<CandlestickSeries data={chartData} />} />
              </>
            )}

            {showBenchmark ? (
              <Line
                yAxisId="benchmark"
                type="monotone"
                dataKey="benchmarkPct"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name={`${benchmarkSymbol} Return`}
                activeDot={{ r: 4, fill: "#0ea5e9", strokeWidth: 0 }}
                isAnimationActive
                animationDuration={900}
              />
            ) : null}

            {showBenchmark ? <ReferenceArea yAxisId="benchmark" y1={0} y2={0} fillOpacity={0} /> : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
