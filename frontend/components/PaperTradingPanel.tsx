"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  EducationalOrderType,
  PaperOrderResponse,
  TradePreview,
} from "@stock/shared";
import { apiFetch } from "../lib/api";

type TradeSide = "buy" | "sell";

const ORDER_TYPE_HELPERS: Record<
  EducationalOrderType,
  { title: string; helper: string; fieldLabel?: string; fieldHelper?: string }
> = {
  market: {
    title: "Market order",
    helper:
      "Uses the current market price in this simulator. It is the simplest order type for beginners to understand.",
  },
  limit: {
    title: "Limit order",
    helper:
      "Lets you name the maximum buy price or minimum sell price you would prefer. In this learning app, the preview explains the concept before a simulated market-style execution.",
    fieldLabel: "Limit price",
    fieldHelper: "Example: a buy limit says “only buy at this price or lower.”",
  },
  stop: {
    title: "Stop order",
    helper:
      "Lets you set a trigger price that would turn into an order if the market reaches it. Here it is used for education and preview only.",
    fieldLabel: "Stop price",
    fieldHelper:
      "Example: a sell stop can help students understand downside planning.",
  },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getToneClasses(tone: "good" | "caution" | "neutral") {
  if (tone === "good") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "caution") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-900";
}

function getRiskClasses(riskLevel: string) {
  const normalized = riskLevel.toLowerCase();

  if (normalized.includes("low")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (normalized.includes("high")) {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  return "border-amber-200 bg-amber-50 text-amber-900";
}

export function PaperTradingPanel({
  onTradeCompleted,
}: {
  onTradeCompleted: () => void;
}) {
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<TradeSide>("buy");
  const [quantity, setQuantity] = useState("1");
  const [orderType, setOrderType] = useState<EducationalOrderType>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [preview, setPreview] = useState<TradePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [orderResult, setOrderResult] = useState<PaperOrderResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedSymbol = useMemo(() => symbol.trim().toUpperCase(), [symbol]);
  const quantityNumber = Number(quantity);
  const limitPriceNumber = Number(limitPrice);
  const stopPriceNumber = Number(stopPrice);

  const priceFieldValue =
    orderType === "limit"
      ? limitPrice
      : orderType === "stop"
        ? stopPrice
        : "";

  const isPriceFieldValid =
    orderType === "market"
      ? true
      : orderType === "limit"
        ? Number.isFinite(limitPriceNumber) && limitPriceNumber > 0
        : Number.isFinite(stopPriceNumber) && stopPriceNumber > 0;

  const canPreview =
    normalizedSymbol.length > 0 &&
    Number.isFinite(quantityNumber) &&
    quantityNumber > 0 &&
    isPriceFieldValid;

  useEffect(() => {
    setPreview(null);
    setPreviewError("");
    setOrderResult(null);
    setSubmitError("");
  }, [normalizedSymbol, side, quantity, orderType, limitPrice, stopPrice]);

  useEffect(() => {
    if (!canPreview) {
      setPreview(null);

      if (normalizedSymbol.length === 0 || quantity.length === 0) {
        setPreviewError("");
      } else if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
        setPreviewError("Enter a share quantity greater than 0 to see the learning preview.");
      } else if (!isPriceFieldValid) {
        setPreviewError(
          `Enter a valid ${orderType === "limit" ? "limit" : "stop"} price to see the learning preview.`,
        );
      }

      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError("");

      try {
        const payload = {
          symbol: normalizedSymbol,
          side,
          quantity: quantityNumber,
          orderType,
          ...(orderType === "limit" ? { limitPrice: limitPriceNumber } : {}),
          ...(orderType === "stop" ? { stopPrice: stopPriceNumber } : {}),
        };

        const result = await apiFetch<TradePreview>("/paper/preview", {
          method: "POST",
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        setPreview(result);
      } catch (error) {
        if (!controller.signal.aborted) {
          setPreview(null);
          setPreviewError(
            error instanceof Error
              ? error.message
              : "We could not prepare the learning preview right now.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setPreviewLoading(false);
        }
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [
    canPreview,
    isPriceFieldValid,
    limitPriceNumber,
    normalizedSymbol,
    orderType,
    quantity,
    quantityNumber,
    side,
    stopPriceNumber,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitError("");
    setOrderResult(null);

    if (!canPreview) {
      setSubmitError("Complete the trade details first so the simulator can explain the trade.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        symbol: normalizedSymbol,
        side,
        quantity: quantityNumber,
        orderType,
        ...(orderType === "limit" ? { limitPrice: limitPriceNumber } : {}),
        ...(orderType === "stop" ? { stopPrice: stopPriceNumber } : {}),
      };

      const result = await apiFetch<PaperOrderResponse>("/paper/order", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setOrderResult(result);
      onTradeCompleted();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The paper trade could not be completed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedOrderType = ORDER_TYPE_HELPERS[orderType];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sky-950">
        <h2 className="text-xl font-semibold">Educational paper trading simulator</h2>
        <p className="mt-2 text-sm leading-6 text-sky-900">
          This tool is for learning only. It uses simulated trades and plain-language coaching to
          help you understand order types, risk, and diversification before you place a paper trade.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900" htmlFor="paper-symbol">
                Stock symbol
              </label>
              <input
                id="paper-symbol"
                type="text"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                placeholder="Example: AAPL"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                autoComplete="off"
              />
              <p className="text-sm text-slate-600">
                Type a symbol to explore what this trade could mean for a beginner portfolio.
              </p>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-slate-900">Trade side</span>
              <div className="grid grid-cols-2 gap-3">
                {(["buy", "sell"] as TradeSide[]).map((option) => {
                  const selected = side === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSide(option)}
                      aria-pressed={selected}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        selected
                          ? "border-sky-500 bg-sky-50 text-sky-950"
                          : "border-slate-300 bg-white text-slate-800 hover:border-slate-400"
                      }`}
                    >
                      <div className="text-sm font-semibold">{titleCase(option)}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {option === "buy"
                          ? "Adds shares in the simulator."
                          : "Reduces shares in the simulator."}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-slate-600">
                The preview explains how buying or selling changes your paper portfolio.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900" htmlFor="paper-quantity">
                Number of shares
              </label>
              <input
                id="paper-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
              <p className="text-sm text-slate-600">
                Share count affects your cash balance and how concentrated your portfolio becomes.
              </p>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-slate-900">Order type lesson</span>
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(ORDER_TYPE_HELPERS) as EducationalOrderType[]).map((option) => {
                  const selected = orderType === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setOrderType(option)}
                      aria-pressed={selected}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        selected
                          ? "border-sky-500 bg-sky-50 text-sky-950"
                          : "border-slate-300 bg-white text-slate-800 hover:border-slate-400"
                      }`}
                    >
                      <div className="text-sm font-semibold">{ORDER_TYPE_HELPERS[option].title}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {option === "market" ? "Uses the live quote." : "Educational concept preview."}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-slate-600">{selectedOrderType.helper}</p>
            </div>
          </div>

          {orderType !== "market" ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label
                className="block text-sm font-medium text-slate-900"
                htmlFor={orderType === "limit" ? "paper-limit-price" : "paper-stop-price"}
              >
                {selectedOrderType.fieldLabel}
              </label>
              <input
                id={orderType === "limit" ? "paper-limit-price" : "paper-stop-price"}
                type="number"
                min="0.01"
                step="0.01"
                value={priceFieldValue}
                onChange={(event) =>
                  orderType === "limit"
                    ? setLimitPrice(event.target.value)
                    : setStopPrice(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
              <p className="mt-2 text-sm text-slate-600">{selectedOrderType.fieldHelper}</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Pre-trade learning preview</h3>
              <p className="mt-1 text-sm text-slate-600">
                This section updates automatically when your inputs are valid.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {previewLoading ? "Preparing preview..." : preview ? "Preview ready" : "Waiting for details"}
            </div>
          </div>

          {previewError ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <div className="font-semibold">Preview note</div>
              <p className="mt-1">{previewError}</p>
            </div>
          ) : null}

          {!preview && !previewLoading && !previewError ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              Enter a symbol, choose buy or sell, set your quantity, and pick an order type to see
              estimated cost, risk cues, and beginner-friendly lessons.
            </div>
          ) : null}

          {preview ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Estimated {preview.side === "buy" ? "cost" : "proceeds"}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCurrency(preview.estimatedNotional)}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Based on an estimated price of {formatCurrency(preview.estimatedPrice)}.
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Projected cash
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCurrency(preview.projectedCashBalance)}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Current cash: {formatCurrency(preview.currentCashBalance)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Diversification
                  </div>
                  <div className="mt-2">
                    <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-900">
                      {titleCase(preview.diversificationLabel)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Largest position after trade: {formatPercent(preview.largestPositionSharePct)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Risk level
                  </div>
                  <div className="mt-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-semibold ${getRiskClasses(
                        String(preview.riskLevel),
                      )}`}
                    >
                      {titleCase(String(preview.riskLevel))}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Position change: {preview.positionQuantityBefore} → {preview.positionQuantityAfter} shares
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-base font-semibold text-slate-950">Beginner summary</h4>
                <p className="mt-2 text-sm leading-6 text-slate-700">{preview.beginnerSummary}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Order type explanation</div>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {preview.orderTypeExplanation}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Market context</div>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{preview.marketContext}</p>
                  </div>
                </div>
              </div>

              {preview.warnings.length > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h4 className="text-base font-semibold text-amber-950">Warnings to read before you trade</h4>
                  <ul className="mt-3 space-y-2 text-sm text-amber-900">
                    {preview.warnings.map((warning) => (
                      <li key={warning} className="flex items-start gap-2">
                        <span className="mt-0.5 font-bold" aria-hidden="true">
                          !
                        </span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <h4 className="text-base font-semibold text-slate-950">Learning bullets</h4>
                <div className="mt-3 grid gap-3">
                  {preview.learningBullets.map((bullet) => (
                    <div
                      key={`${bullet.label}-${bullet.explanation}`}
                      className={`rounded-xl border p-4 ${getToneClasses(bullet.tone)}`}
                    >
                      <div className="text-sm font-semibold">{bullet.label}</div>
                      <p className="mt-1 text-sm leading-6">{bullet.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Place simulated paper trade</h3>
              <p className="mt-1 text-sm text-slate-600">
                Submitting records a paper trade for practice. It does not place a real market order.
              </p>
            </div>
            <button
              type="submit"
              disabled={!canPreview || previewLoading || isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Submitting paper trade..." : `Submit ${titleCase(side)} Paper Trade`}
            </button>
          </div>

          {submitError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
              <div className="font-semibold">Trade could not be completed</div>
              <p className="mt-1">{submitError}</p>
            </div>
          ) : null}
        </div>
      </form>

      {orderResult ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Paper trade recorded</h3>
              <p className="mt-1 text-sm text-emerald-900">
                Your simulated {orderResult.transaction.side} trade for {orderResult.transaction.symbol} was
                saved for learning.
              </p>
            </div>
            <div className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-900">
              Cash balance: {formatCurrency(orderResult.cashBalance)}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-5">
            <h4 className="text-base font-semibold text-slate-950">
              {orderResult.education.title}
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-700">{orderResult.education.summary}</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">What happened operationally</div>
                <p className="mt-1 text-sm leading-6 text-slate-700">{orderResult.education.outcome}</p>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Risk takeaway</div>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {orderResult.education.riskTakeaway}
                </p>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Diversification takeaway</div>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {orderResult.education.diversificationTakeaway}
                </p>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Strategy takeaway</div>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {orderResult.education.strategyTakeaway}
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm font-semibold text-slate-900">Psychology takeaway</div>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {orderResult.education.psychologyTakeaway}
                </p>
              </div>
            </div>

            {orderResult.education.lessonTags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {orderResult.education.lessonTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    Lesson: {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}