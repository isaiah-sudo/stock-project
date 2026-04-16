"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Portfolio } from "@stock/shared";
import { apiFetch } from "../../lib/api";
import { ChatAssistant } from "../../components/ChatAssistant";
import { HoldingsTable } from "../../components/HoldingsTable";
import { PaperTradingPanel } from "../../components/PaperTradingPanel";
import { PortfolioOverview } from "../../components/PortfolioOverview";
import { TrophyRoom } from "../../components/TrophyRoom";
import { Navbar } from "../../components/Navbar";
import { Leaderboard } from "../../components/Leaderboard";

const PerformanceChart = dynamic(() => import("../../components/PerformanceChart").then((mod) => mod.PerformanceChart), { 
  ssr: false, 
  loading: () => <div className="h-64 rounded-3xl bg-slate-50 animate-pulse border border-slate-100 flex items-center justify-center text-slate-400">Loading chart...</div> 
});

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState("");
  const [marketOpen, setMarketOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"portfolio" | "chat" | "rankings" | "achievements">("portfolio");
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const initialBalance = 10000;
  const marketValue = portfolio ? portfolio.totalValue - portfolio.cashBalance : 0;
  const totalPerformanceDollar = portfolio ? portfolio.totalValue - initialBalance : 0;
  const totalPerformancePct = portfolio ? Number(((totalPerformanceDollar / initialBalance) * 100).toFixed(2)) : 0;
  const dayPerformanceDollar = portfolio?.dayChangeDollar ?? 0;

  function formatCurrency(value: number) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function loadPortfolio() {
    apiFetch<Portfolio>("/paper/portfolio")
      .then(setPortfolio)
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }

  function loadMarketStatus() {
    apiFetch<{ open: boolean }>("/paper/market-status")
      .then((data) => setMarketOpen(data.open))
      .catch(() => {});
  }

  useEffect(() => {
    loadPortfolio();
    loadMarketStatus();
    const interval = window.setInterval(() => {
      loadPortfolio();
      loadMarketStatus();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
        {error ? (
          <div className="rounded-3xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-100">
            {error}
          </div>
        ) : null}

        {portfolio ? (
          <>
            <section className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div className="text-3xl font-black text-slate-900">{formatCurrency(portfolio.totalValue)}</div>
                <div className="text-sm font-semibold text-emerald-500">Financial Summary</div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Available Cash</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(portfolio.cashBalance)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Market Value</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(marketValue)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Total Performance</p>
                  <p className={`text-2xl font-bold ${totalPerformanceDollar >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {totalPerformanceDollar >= 0 ? "+" : ""}{formatCurrency(totalPerformanceDollar)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {totalPerformancePct >= 0 ? "+" : ""}{totalPerformancePct.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Day Performance</p>
                  <p className={`text-2xl font-bold ${dayPerformanceDollar >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {dayPerformanceDollar >= 0 ? "+" : ""}{formatCurrency(dayPerformanceDollar)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {portfolio.dayChangePct >= 0 ? "+" : ""}{portfolio.dayChangePct.toFixed(2)}%
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
              <PerformanceChart portfolio={portfolio} />
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Holdings Breakdown</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full ${marketOpen ? "bg-green-500" : "bg-red-500"}`}></span>
                    {marketOpen ? "Markets Open" : "Markets Closed"}
                  </div>
                  <button
                    onClick={() => setIsTradeModalOpen(true)}
                    className="rounded-3xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200/60 transition hover:bg-blue-700"
                  >
                    + Buy Stocks
                  </button>
                </div>
              </div>
              <HoldingsTable holdings={portfolio.holdings} />
            </section>
          </>
        ) : (
          <div className="flex min-h-[56vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-200"></div>
          </div>
        )}

        {isTradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-xl relative rounded-[2rem] bg-white shadow-2xl border border-slate-100 overflow-hidden">
              <button
                onClick={() => setIsTradeModalOpen(false)}
                className="absolute right-4 top-4 h-10 w-10 rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                ✕
              </button>
              <PaperTradingPanel
                onTradeCompleted={() => {
                  loadPortfolio();
                  setIsTradeModalOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
