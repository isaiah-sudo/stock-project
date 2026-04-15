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
    }, 30_000); // 30s for better performance
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Trillium <span className="text-blue-600">Finance</span>
            </h1>
            <p className="text-sm font-medium text-slate-500">Welcome to Trillium Finance. Master the markets, risk-free.</p>
          </div>
          <div className="flex items-center gap-3">
             <button
                onClick={() => setIsTradeModalOpen(true)}
                className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
             >
                + Buy Stocks
             </button>
             <span className="rounded-2xl bg-white px-5 py-2.5 text-sm font-bold shadow-sm border border-slate-100 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${marketOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                {marketOpen ? "Markets Open" : "Markets Closed"}
             </span>
          </div>
        </header>

        {error ? <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-100">{error}</p> : null}
        
        {portfolio ? (
          <div className="space-y-8">
          <div className="bg-slate-100 p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center">Net Worth</h2>
            <p className="text-xl font-semibold text-center">$0.00</p>
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold">Available Cash</h3>
                <p className="text-xl font-bold">$0.00</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold">Market Value</h3>
                <p className="text-xl font-bold">$0.00</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold">Total Performance</h3>
                <p className="text-xl font-bold">$0.00</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold">Day Performance</h3>
                <p className="text-xl font-bold">$0.00</p>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-4xl space-y-8">
          <div className="bg-slate-100 p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center">Net Worth</h2>
            <p className="text-xl font-semibold text-center">$0.00</p>
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold">Available Cash</h3>
                <p className="text-xl font-bold">$0.00</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold">Market Value</h3>
                <p className="text-xl font-bold">$0.00</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold">Total Performance</h3>
                <p className="text-xl font-bold">$0.00</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold">Day Performance</h3>
                <p className="text-xl font-bold">$0.00</p>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-4xl space-y-8">
            <PortfolioOverview portfolio={portfolio} />
          <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100/50 p-1.5 border border-slate-200/60 max-w-fit mx-auto">
            
            <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100/50 p-1.5 border border-slate-200/60 max-w-fit mx-auto">
              {(["portfolio", "chat", "rankings", "achievements"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                    activeTab === tab 
                      ? "bg-white text-blue-600 shadow-sm border border-slate-100" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="transition-all duration-300">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Settings</span>
                  <span className="text-sm font-medium">Log Out</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Settings</span>
                  <span className="text-sm font-medium">Log Out</span>
                </div>
              </div>
              {activeTab === "portfolio" && (
                <div className="mx-auto max-w-4xl space-y-8">
                  <PerformanceChart portfolio={portfolio} />
                  <HoldingsTable holdings={portfolio.holdings} />
                </div>
              )}

              {activeTab === "chat" && (
                <div className="mx-auto max-w-3xl">
                  <ChatAssistant />
                </div>
              )}

              {activeTab === "rankings" && (
                <div className="mx-auto max-w-4xl">
                  <Leaderboard />
                </div>
              )}

              {activeTab === "achievements" && (
                <div className="mx-auto max-w-2xl">
                  <TrophyRoom />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-200"></div>
          </div>
        )}

        {isTradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-200"></div>
          </div>
        )}

        {isTradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-200"></div>
          </div>
        )}

        {isTradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-200"></div>
          </div>
        )}

        {isTradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-md relative bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              <button 
                onClick={() => setIsTradeModalOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 transition-colors z-10"
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
