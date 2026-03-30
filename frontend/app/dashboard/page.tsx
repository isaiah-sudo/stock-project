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

const PerformanceChart = dynamic(() => import("../../components/PerformanceChart").then((mod) => mod.PerformanceChart), { 
  ssr: false, 
  loading: () => <div className="h-64 rounded-3xl bg-slate-50 animate-pulse border border-slate-100 flex items-center justify-center text-slate-400">Loading chart...</div> 
});

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState("");
  const [marketOpen, setMarketOpen] = useState(true);

  function loadPortfolio() {
    apiFetch<Portfolio>("/paper/portfolio")
      .then(setPortfolio)
      .catch((err) => {
        console.error(err);
        setError("Could not load portfolio. Please sign in again.");
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
              Virtual <span className="text-blue-600">Trading</span> Hub
            </h1>
            <p className="text-sm font-medium text-slate-500">Welcome to Simulator Pro. Master the markets, risk-free.</p>
          </div>
          <div className="flex items-center gap-3">
             <span className="rounded-2xl bg-white px-5 py-2.5 text-sm font-bold shadow-sm border border-slate-100 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${marketOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                {marketOpen ? "Markets Open" : "Markets Closed"}
             </span>
          </div>
        </header>

        {error ? <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-100">{error}</p> : null}
        
        {portfolio ? (
          <>
            <PortfolioOverview portfolio={portfolio} />
            
            <div className="grid gap-8 lg:grid-cols-[1.5fr,1fr]">
              <div className="space-y-8">
                <PerformanceChart portfolio={portfolio} />
                <PaperTradingPanel onTradeCompleted={loadPortfolio} />
                <HoldingsTable holdings={portfolio.holdings} />
              </div>
              <div className="space-y-8">
                <TrophyRoom />
                <ChatAssistant />
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center p-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-200"></div>
          </div>
        )}
      </main>
    </div>
  );
}
