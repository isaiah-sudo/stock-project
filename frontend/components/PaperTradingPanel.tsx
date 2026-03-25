"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface Quote {
  symbol: string;
  name: string;
  currentPrice: number;
  changePct: number;
}

export function PaperTradingPanel({ onTradeCompleted }: { onTradeCompleted: () => void }) {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [status, setStatus] = useState("Loading paper trading symbols...");

  useEffect(() => {
    apiFetch<{ symbols: string[] }>("/paper/symbols")
      .then((data) => {
        setSymbols(data.symbols);
        setSymbol(data.symbols[0] ?? "AAPL");
        setStatus("Paper trading ready.");
      })
      .catch(() => setStatus("Link your paper account first from the account linking page."));
  }, []);

  useEffect(() => {
    if (!symbol) return;
    apiFetch<Quote>(`/paper/quote?symbol=${encodeURIComponent(symbol)}`)
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [symbol]);

  async function submitOrder() {
    setStatus("Submitting order...");
    try {
      const result = await apiFetch<{ transaction: { side: string; quantity: number; symbol: string; price: number } }>(
        "/paper/order",
        {
          method: "POST",
          body: JSON.stringify({ symbol, side, quantity })
        }
      );
      setStatus(
        `Order filled: ${result.transaction.side.toUpperCase()} ${result.transaction.quantity} ${result.transaction.symbol} @ $${result.transaction.price}`
      );
      onTradeCompleted();
      const updated = await apiFetch<Quote>(`/paper/quote?symbol=${encodeURIComponent(symbol)}`);
      setQuote(updated);
    } catch {
      setStatus("Order failed. Ensure paper account is linked and quantity is valid.");
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <h3 className="text-lg font-semibold">Paper Trading</h3>
      <p className="mt-1 text-sm text-slate-500">Simulated trading for large-cap symbols with instant fills.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        >
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as "buy" | "sell")}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        >
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        />
        <button onClick={submitOrder} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">
          Submit
        </button>
      </div>
      {quote ? (
        <p className="mt-3 text-sm text-slate-700">
          {quote.name} ({quote.symbol}) ${quote.currentPrice.toFixed(2)} ({quote.changePct.toFixed(2)}%)
        </p>
      ) : null}
      <p className="mt-2 text-sm text-slate-600">{status}</p>
    </div>
  );
}
