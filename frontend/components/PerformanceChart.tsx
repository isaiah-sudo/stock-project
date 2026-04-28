"use client";

import type { Portfolio } from "@stock/shared";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "../lib/api";

type Timeframe = "1D" | "1W" | "1M" | "ALL";
type BenchmarkSymbol = "SPY" | "QQQ";

interface HistoryPoint {
  timestamp: string;
}

interface PortfolioHistoryPoint extends HistoryPoint {
  total_market_value: number;
}

interface BenchmarkHistoryPoint extends HistoryPoint {
  price: number | null;
}

interface PerformanceHistoryResponse {
  timeframe: Timeframe;
  benchmark: {
    symbol: BenchmarkSymbol;
    name: string;
  };
  portfolio_history: PortfolioHistoryPoint[];
  benchmark_history: BenchmarkHistoryPoint[];
}

interface ChartPoint {
  label: string;
  timestamp: number;
  portfolioValue: number;
  benchmarkValue: number | null;
}

interface PerformanceChartProps {
  portfolio: Portfolio;
  marketOpen: boolean;
}

const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "ALL"];
const BENCHMARKS: BenchmarkSymbol[] = ["SPY", "QQQ"];
const PORTFOLIO_COLOR = "#0f766e";
const BENCHMARK_COLOR = "#94a3b8";
const MARKET_OPEN_ET_MINUTES = 9 * 60 + 30;
const MARKET_STEP_MS = 30 * 60 * 1000;

const ET_WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const ET_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23",
});

const ET_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

interface RawSeriesPoint {
  timestamp: number;
  value: number;
}

interface EtDateParts {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getStep(range: number) {
  if (range <= 25) return 5;
  if (range <= 60) return 10;
  if (range <= 150) return 25;
  if (range <= 300) return 50;
  if (range <= 800) return 100;
  if (range <= 2500) return 250;
  return 1000;
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

function formatTimestampLabel(timestamp: number, timeframe: Timeframe) {
  const date = new Date(timestamp);

  switch (timeframe) {
    case "1D":
      return ET_TIME_FORMATTER.format(date);
    case "1W":
      return date.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    case "1M":
    case "ALL":
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
  }
}

function getEtDateParts(date: Date): EtDateParts {
  const parts = ET_DATE_FORMATTER.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  const weekdayLabel = parts.find((part) => part.type === "weekday")?.value ?? "Mon";

  return {
    year,
    month,
    day,
    weekday: ET_WEEKDAY[weekdayLabel] ?? 1,
    hour,
    minute,
  };
}

function isEasternDstDate(year: number, month: number, day: number) {
  const marchFirst = new Date(Date.UTC(year, 2, 1));
  const marchOffset = (7 - marchFirst.getUTCDay()) % 7;
  const secondSundayInMarch = 1 + marchOffset + 7;

  const novemberFirst = new Date(Date.UTC(year, 10, 1));
  const novemberOffset = (7 - novemberFirst.getUTCDay()) % 7;
  const firstSundayInNovember = 1 + novemberOffset;

  const afterSpringForward = month > 3 || (month === 3 && day >= secondSundayInMarch);
  const beforeFallBack = month < 11 || (month === 11 && day < firstSundayInNovember);

  return afterSpringForward && beforeFallBack;
}

function getEtOffsetHours(year: number, month: number, day: number) {
  return isEasternDstDate(year, month, day) ? 4 : 5;
}

function isWeekend(parts: EtDateParts) {
  return parts.weekday === 0 || parts.weekday === 6;
}

function shiftEtDate(parts: EtDateParts, dayDelta: number) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + dayDelta, 12));
  return getEtDateParts(shifted);
}

function getCurrentTradingSessionDate(now = new Date()) {
  let parts = getEtDateParts(now);
  const currentMinutes = parts.hour * 60 + parts.minute;

  if (isWeekend(parts) || currentMinutes < MARKET_OPEN_ET_MINUTES) {
    do {
      parts = shiftEtDate(parts, -1);
    } while (isWeekend(parts));
  }

  return parts;
}

function getTradingSessionWindow(now = new Date()) {
  const sessionDate = getCurrentTradingSessionDate(now);
  const offsetHours = getEtOffsetHours(sessionDate.year, sessionDate.month, sessionDate.day);

  return {
    start: Date.UTC(sessionDate.year, sessionDate.month - 1, sessionDate.day, 9 + offsetHours, 30),
    end: Date.UTC(sessionDate.year, sessionDate.month - 1, sessionDate.day, 16 + offsetHours, 0),
    sessionDate,
  };
}

function isSameEtDate(timestamp: number, session: EtDateParts) {
  const parts = getEtDateParts(new Date(timestamp));
  return parts.year === session.year && parts.month === session.month && parts.day === session.day;
}

function toSeriesPoints<T extends { timestamp: string }>(
  points: Array<T & { value: number | null }>
) {
  return points
    .map((point) => ({
      timestamp: new Date(point.timestamp).getTime(),
      value: point.value,
    }))
    .filter((point): point is RawSeriesPoint => Number.isFinite(point.timestamp) && Number.isFinite(point.value));
}

function resampleSeries(points: RawSeriesPoint[], targetTimestamps: number[]) {
  if (points.length === 0 || targetTimestamps.length === 0) {
    return [] as Array<{ timestamp: number; value: number }>;
  }

  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
  const resampled: Array<{ timestamp: number; value: number }> = [];
  let nextIndex = 0;

  for (const targetTimestamp of targetTimestamps) {
    while (nextIndex < sorted.length && sorted[nextIndex].timestamp < targetTimestamp) {
      nextIndex += 1;
    }

    const exactPoint = sorted[nextIndex];
    if (exactPoint && exactPoint.timestamp === targetTimestamp) {
      resampled.push({ timestamp: targetTimestamp, value: exactPoint.value });
      continue;
    }

    const previousPoint = nextIndex > 0 ? sorted[nextIndex - 1] : null;
    const nextPoint = sorted[nextIndex] ?? null;

    if (previousPoint && nextPoint) {
      const span = nextPoint.timestamp - previousPoint.timestamp;
      const ratio = span === 0 ? 0 : (targetTimestamp - previousPoint.timestamp) / span;
      resampled.push({
        timestamp: targetTimestamp,
        value: Number((previousPoint.value + (nextPoint.value - previousPoint.value) * ratio).toFixed(2)),
      });
      continue;
    }

    if (previousPoint) {
      resampled.push({ timestamp: targetTimestamp, value: previousPoint.value });
      continue;
    }

    if (nextPoint) {
      resampled.push({ timestamp: targetTimestamp, value: nextPoint.value });
    }
  }

  return resampled;
}

function buildUniformTradingSessionData(history: PerformanceHistoryResponse, timeframe: Timeframe) {
  if (timeframe !== "1D") {
    return null;
  }

  const portfolioSeries = toSeriesPoints(
    (history.portfolio_history ?? []).map((point) => ({
      timestamp: point.timestamp,
      value: point.total_market_value,
    }))
  );
  const benchmarkSeries = toSeriesPoints(
    (history.benchmark_history ?? []).map((point) => ({
      timestamp: point.timestamp,
      value: point.price,
    }))
  );

  const { start, end, sessionDate } = getTradingSessionWindow();
  const targetTimestamps: number[] = [];

  for (let timestamp = start; timestamp <= end; timestamp += MARKET_STEP_MS) {
    targetTimestamps.push(timestamp);
  }

  const sessionPortfolioPoints = portfolioSeries.filter(
    (point) => isSameEtDate(point.timestamp, sessionDate) && point.timestamp >= start && point.timestamp <= end
  );
  const sessionBenchmarkPoints = benchmarkSeries.filter(
    (point) => isSameEtDate(point.timestamp, sessionDate) && point.timestamp >= start && point.timestamp <= end
  );

  if (sessionPortfolioPoints.length === 0) {
    return null;
  }

  const portfolioValues = resampleSeries(sessionPortfolioPoints, targetTimestamps);
  const benchmarkValues = resampleSeries(sessionBenchmarkPoints, targetTimestamps);

  return portfolioValues.map((point, index) => ({
    label: formatTimestampLabel(point.timestamp, timeframe),
    timestamp: point.timestamp,
    portfolioValue: point.value,
    benchmarkValue: benchmarkValues[index]?.value ?? null,
  })) satisfies ChartPoint[];
}

function ChartTooltip(args: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  benchmarkLabel: string;
}) {
  const point = args.payload?.[0]?.payload;

  if (!args.active || !point) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/95 dark:bg-slate-800/95 px-4 py-3 shadow-xl shadow-slate-200/60 dark:shadow-black/30 backdrop-blur">
      <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{point.label}</div>
      <div className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100 font-num">{formatCurrency(point.portfolioValue)}</div>
      {point.benchmarkValue !== null ? (
        <div className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400 font-num">
          {args.benchmarkLabel} {formatCurrency(point.benchmarkValue)}
        </div>
      ) : null}
    </div>
  );
}

export function PerformanceChart({ portfolio, marketOpen }: PerformanceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [benchmarkSymbol, setBenchmarkSymbol] = useState<BenchmarkSymbol>("SPY");
  const [history, setHistory] = useState<PerformanceHistoryResponse | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    apiFetch<PerformanceHistoryResponse>(`/paper/performance?timeframe=${timeframe}&benchmark=${benchmarkSymbol}`)
      .then((response) => {
        if (!cancelled) {
          setHistory(response);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setHistory(null);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [benchmarkSymbol, timeframe, portfolio.totalValue, portfolio.cashBalance, portfolio.holdings.length]);

  const chartData = useMemo(() => {
    const portfolioHistory = history?.portfolio_history ?? [];
    const benchmarkByTimestamp = new Map(
      (history?.benchmark_history ?? []).map((point) => [point.timestamp, point.price] as const)
    );

    if (portfolioHistory.length === 0) {
      const marketValue = Number((portfolio.totalValue - portfolio.cashBalance).toFixed(2));
      return [
        {
          label: formatTimestampLabel(Date.now(), timeframe),
          timestamp: Date.now(),
          portfolioValue: marketValue,
          benchmarkValue: null,
        },
      ] satisfies ChartPoint[];
    }

    if (history) {
      const uniformSessionData = buildUniformTradingSessionData(history, timeframe);
      if (uniformSessionData) {
        return uniformSessionData;
      }
    }

    return portfolioHistory.map((point) => {
      const timestamp = new Date(point.timestamp).getTime();
      return {
        label: formatTimestampLabel(timestamp, timeframe),
        timestamp,
        portfolioValue: point.total_market_value,
        benchmarkValue: benchmarkByTimestamp.get(point.timestamp) ?? null,
      } satisfies ChartPoint;
    });
  }, [history, portfolio.cashBalance, portfolio.totalValue, timeframe]);

  const activePoint = hoveredIndex !== null ? chartData[hoveredIndex] : chartData[chartData.length - 1];
  const startPoint = chartData[0];
  const currentValue = activePoint?.portfolioValue ?? 0;
  const deltaValue = currentValue - (startPoint?.portfolioValue ?? currentValue);
  const deltaPct =
    startPoint?.portfolioValue && startPoint.portfolioValue !== 0
      ? (deltaValue / startPoint.portfolioValue) * 100
      : 0;
  const values = chartData.map((point) => point.portfolioValue);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const yTicks = createTicks(dataMin, dataMax);
  const benchmarkValues = chartData
    .map((point) => point.benchmarkValue)
    .filter((value): value is number => value !== null);
  const benchmarkLabel = history?.benchmark?.symbol ?? benchmarkSymbol;

  return (
    <div className="w-full rounded-[2rem] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:gap-5">
        <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Market Value</p>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  marketOpen ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                {marketOpen ? "Regular Session" : "Markets Closed"}
              </span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                vs {benchmarkLabel}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-num sm:text-3xl">{formatCurrency(currentValue)}</h2>
              <div className={`flex items-center gap-1 text-xs font-bold font-num sm:gap-2 sm:text-sm ${deltaValue >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                <span>{deltaValue >= 0 ? "+" : ""}{formatCurrency(deltaValue)}</span>
                <span className="text-slate-400">
                  ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(2)}%)
                </span>
              </div>
            </div>
            <p className="mt-2 hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
              Historical portfolio snapshots are joined to the selected benchmark on a shared timestamp so both lines stay aligned.
            </p>
            {timeframe === "1D" ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                Regular-session view only, resampled to 30-minute intervals
              </p>
            ) : null}
            {error ? <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p> : null}
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-700 p-1">
              {TIMEFRAMES.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeframe(range)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    timeframe === range ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-600 p-1">
              {BENCHMARKS.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  onClick={() => setBenchmarkSymbol(symbol)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    benchmarkSymbol === symbol ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PORTFOLIO_COLOR }} />
            Portfolio
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            {history?.benchmark?.name ?? benchmarkLabel}
          </span>
          {loading ? (
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Refreshing history…
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 h-[260px] w-full sm:mt-6 sm:h-[390px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 4, left: 0, bottom: 4 }}
            onMouseMove={(state) => {
              if (typeof state.activeTooltipIndex === "number") {
                setHoveredIndex(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PORTFOLIO_COLOR} stopOpacity={0.24} />
                <stop offset="95%" stopColor={PORTFOLIO_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
              tickFormatter={(value: number) => formatTimestampLabel(value, timeframe)}
            />
            <YAxis
              yAxisId="portfolio"
              domain={dataMin === dataMax ? [dataMin - 5, dataMax + 5] : ["auto", "auto"]}
              ticks={yTicks}
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
              tickFormatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
            {benchmarkValues.length > 0 ? (
              <YAxis
                yAxisId="benchmark"
                orientation="right"
                domain={["auto", "auto"]}
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                tickFormatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              />
            ) : null}
            <Tooltip
              content={<ChartTooltip benchmarkLabel={benchmarkLabel} />}
              cursor={{ stroke: "#cbd5e1", strokeWidth: 1.5, strokeDasharray: "3 4" }}
            />

            <Area
              yAxisId="portfolio"
              type="monotone"
              dataKey="portfolioValue"
              stroke="transparent"
              fill="url(#portfolioFill)"
              fillOpacity={1}
              name="Portfolio"
              isAnimationActive
              animationDuration={700}
            />
            <Line
              yAxisId="portfolio"
              type="monotone"
              dataKey="portfolioValue"
              stroke={PORTFOLIO_COLOR}
              strokeWidth={3.5}
              dot={false}
              activeDot={{ r: 5, fill: PORTFOLIO_COLOR, strokeWidth: 0 }}
              name="Portfolio"
              isAnimationActive
              animationDuration={700}
            />
            {benchmarkValues.length > 0 ? (
              <Line
                yAxisId="benchmark"
                type="monotone"
                dataKey="benchmarkValue"
                stroke={BENCHMARK_COLOR}
                strokeWidth={2.25}
                strokeDasharray="6 6"
                dot={false}
                activeDot={{ r: 4, fill: BENCHMARK_COLOR, strokeWidth: 0 }}
                name={benchmarkLabel}
                connectNulls={false}
                isAnimationActive
                animationDuration={700}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
