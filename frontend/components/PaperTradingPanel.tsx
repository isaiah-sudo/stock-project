"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../lib/api";

interface StockMetadata {
  symbol: string;
  name: string;
}

interface Quote {
  symbol: string;
  name: string;
  currentPrice: number;
  changePct: number;
}

export function PaperTradingPanel({ onTradeCompleted, buyingPower }: { onTradeCompleted: () => void; buyingPower?: number }) {
  const [metadata, setMetadata] = useState<StockMetadata[]>([]);
  const [search, setSearch] = useState("");
  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [status, setStatus] = useState("Loading paper trading symbols...");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    apiFetch<{ symbols: string[]; metadata: StockMetadata[] }>("/paper/symbols")
      .then((data) => {
        setMetadata(data.metadata || []);
        setSymbol(data.symbols[0] ?? "AAPL");
        setStatus("Paper trading ready.");
      })
      .catch((err) => setStatus(err.message));
  }, []);

  useEffect(() => {
    if (!symbol) return;
    apiFetch<Quote>(`/paper/quote?symbol=${encodeURIComponent(symbol)}`)
      .then(setQuote)
      .catch((err) => {
        console.error(err);
        setQuote(null);
      });
  }, [symbol]);

  const filteredMetadata = useMemo(() => {
    if (!search.trim()) return metadata;
    const s = search.toLowerCase();
    return metadata.filter(m => 
      m.symbol.toLowerCase().includes(s) || 
      m.name.toLowerCase().includes(s)
    );
  }, [metadata, search]);

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
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  const selectedStock = metadata.find(m => m.symbol === symbol);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Execute Trade</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search for stocks and place simulated orders.</p>
      
      <div className="mt-6 space-y-4">
        <div className="relative">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Search Stock</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name or symbol (e.g. Apple or AAPL)"
                value={search}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {isDropdownOpen && filteredMetadata.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 py-1 shadow-xl">
                  {filteredMetadata.map((m) => (
                    <button
                      key={m.symbol}
                      onClick={() => {
                        setSymbol(m.symbol);
                        setSearch("");
                        setIsDropdownOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      <span className="font-bold text-slate-900 dark:text-slate-100">{m.symbol}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Action</label>
            <div className="flex rounded-xl bg-slate-50 dark:bg-slate-700 p-1 border border-slate-200 dark:border-slate-600">
              <button
                onClick={() => setSide("buy")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  side === "buy" ? "bg-white dark:bg-slate-600 text-emerald-600 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setSide("sell")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  side === "sell" ? "bg-white dark:bg-slate-600 text-red-600 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                SELL
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {quote && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-4 border border-slate-100 dark:border-slate-600">
            <div className="grid gap-4 lg:grid-cols-[200px_1fr] lg:items-center">
              <div className="space-y-3 text-slate-500 text-xs">
                <div>
                  <p className="font-semibold text-slate-400 uppercase tracking-wide">Estimated Total</p>
                  <p>${(quote.currentPrice * quantity).toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-400 uppercase tracking-wide">Estimated Transaction Fee</p>
                  <p>$0.00</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-400 uppercase tracking-wide">Cash / Buying Power</p>
                  <p>${(buyingPower ?? 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-600">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{quote.name}</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100">{quote.symbol}</p>
                </div>
                <div className="mt-3 text-right">
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100">${quote.currentPrice.toFixed(2)}</p>
                  <p className={`text-xs font-bold ${quote.changePct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {quote.changePct >= 0 ? "+" : ""}{quote.changePct.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={submitOrder}
          className={`w-full rounded-xl py-3 text-sm font-black text-white transition-all shadow-lg ${
            side === "buy" 
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" 
              : "bg-red-600 hover:bg-red-700 shadow-red-200"
          }`}
        >
          {side.toUpperCase()} {quantity} {symbol}
        </button>

        <p className={`text-center text-xs font-medium ${
          status.includes("filled") ? "text-emerald-600" : status.includes("failed") ? "text-red-600" : "text-slate-500"
        }`}>
          {status}
        </p>
      </div>

      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}
