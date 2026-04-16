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
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Overview</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Trillium Finance</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Your paper trading dashboard with a clearer performance hierarchy, market status, and fast access to the tools you use most.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              onClick={() => setIsTradeModalOpen(true)}
              className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200/60 transition hover:bg-blue-700"
            >
              + Buy Stocks
            </button>
            <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 border border-slate-200">
              <span className={`h-3.5 w-3.5 rounded-full ${marketOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              {marketOpen ? "Markets Open" : "Markets Closed"}
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-3xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-100">
            {error}
          </div>
        ) : null}

        {portfolio ? (
          <>
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Financial summary</p>
                    <h2 className="mt-2 text-3xl font-black text-slate-900">Total portfolio health</h2>
                  </div>
                  <div className="rounded-3xl bg-slate-50 px-5 py-4 text-right shadow-inner border border-slate-200">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Net worth</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{formatCurrency(portfolio.totalValue)}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl bg-slate-50 p-5 shadow-sm border border-slate-200">
                    <p className="text-sm font-semibold text-slate-500">Available Cash</p>
                    <p className="mt-3 text-2xl font-bold text-slate-900">{formatCurrency(portfolio.cashBalance)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5 shadow-sm border border-slate-200">
                    <p className="text-sm font-semibold text-slate-500">Market Value</p>
                    <p className="mt-3 text-2xl font-bold text-slate-900">{formatCurrency(marketValue)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5 shadow-sm border border-slate-200">
                    <p className="text-sm font-semibold text-slate-500">Total Performance</p>
                    <p className={`mt-3 text-2xl font-bold ${totalPerformanceDollar >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {totalPerformanceDollar >= 0 ? "+" : ""}{formatCurrency(totalPerformanceDollar)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {totalPerformancePct >= 0 ? "+" : ""}{totalPerformancePct.toFixed(2)}%
                    </p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5 shadow-sm border border-slate-200">
                    <p className="text-sm font-semibold text-slate-500">Day Performance</p>
                    <p className={`mt-3 text-2xl font-bold ${dayPerformanceDollar >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {dayPerformanceDollar >= 0 ? "+" : ""}{formatCurrency(dayPerformanceDollar)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {portfolio.dayChangePct >= 0 ? "+" : ""}{portfolio.dayChangePct.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
                <PortfolioOverview portfolio={portfolio} />
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-2 shadow-sm border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] bg-slate-50 p-2">
                {(["portfolio", "chat", "rankings", "achievements"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                      activeTab === tab
                        ? "bg-white text-blue-600 shadow-sm shadow-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-8">
                {activeTab === "portfolio" && (
                  <div className="space-y-8">
                    <PerformanceChart portfolio={portfolio} />
                    <HoldingsTable holdings={portfolio.holdings} />
                  </div>
                )}

                {activeTab === "chat" && (
                  <div className="rounded-3xl bg-slate-50 p-6">
                    <ChatAssistant />
                  </div>
                )}

                {activeTab === "rankings" && (
                  <div className="rounded-3xl bg-slate-50 p-6">
                    <Leaderboard />
                  </div>
                )}

                {activeTab === "achievements" && (
                  <div className="rounded-3xl bg-slate-50 p-6">
                    <TrophyRoom />
                  </div>
                )}
              </div>
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
