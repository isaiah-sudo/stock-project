"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Portfolio } from "@stock/shared";
import { apiFetch } from "../../lib/api";
import { ChatAssistant } from "../../components/ChatAssistant";
import { HoldingsTable } from "../../components/HoldingsTable";
import { PaperTradingPanel } from "../../components/PaperTradingPanel";
const PerformanceChart = dynamic(() => import("../../components/PerformanceChart").then((mod) => mod.PerformanceChart), { ssr: false, loading: () => <div>Loading chart...</div> });
import { PortfolioOverview } from "../../components/PortfolioOverview";

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState("");

  function loadPortfolio() {
    apiFetch<Portfolio>("/portfolio")
      .then(setPortfolio)
      .catch(() => setError("Could not load portfolio. Please sign in again."));
  }

  useEffect(() => {
    loadPortfolio();
    const interval = window.setInterval(loadPortfolio, 15_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Portfolio Overview</h1>
        <a href="/link" className="rounded-xl border border-slate-300 px-4 py-2 text-sm">
          Link Brokerage
        </a>
      </header>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}
      {portfolio ? (
        <>
          <PortfolioOverview portfolio={portfolio} />
          <div className="grid gap-6 lg:grid-cols-2">
            <PerformanceChart portfolio={portfolio} />
            <ChatAssistant />
          </div>
          <PaperTradingPanel onTradeCompleted={loadPortfolio} />
          <HoldingsTable holdings={portfolio.holdings} />
        </>
      ) : (
        <div className="rounded-xl bg-white p-6 shadow">Loading portfolio...</div>
      )}
    </main>
  );
}
