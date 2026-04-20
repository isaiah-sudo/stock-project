"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { LearningChallenge, Portfolio, PortfolioCoaching } from "@stock/shared";
import { apiFetch } from "../../lib/api";
import { ChatAssistant } from "../../components/ChatAssistant";
import { HoldingsTable } from "../../components/HoldingsTable";
import { LearningChallenges } from "../../components/LearningChallenges";
import { PaperTradingPanel } from "../../components/PaperTradingPanel";
import { PortfolioCoachCard } from "../../components/PortfolioCoachCard";
import { PortfolioOverview } from "../../components/PortfolioOverview";
import { TrophyRoom } from "../../components/TrophyRoom";
import { Navbar } from "../../components/Navbar";
import { Leaderboard } from "../../components/Leaderboard";

const PerformanceChart = dynamic(
  () => import("../../components/PerformanceChart").then((mod) => mod.PerformanceChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 text-slate-400 animate-pulse">
        Loading chart...
      </div>
    ),
  },
);

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState("");
  const [marketOpen, setMarketOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "portfolio" | "chat" | "rankings" | "achievements" | "learn"
  >("portfolio");
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const [coaching, setCoaching] = useState<PortfolioCoaching | null>(null);
  const [coachError, setCoachError] = useState("");
  const [coachLoading, setCoachLoading] = useState(true);

  const [challenges, setChallenges] = useState<LearningChallenge[]>([]);
  const [challengesError, setChallengesError] = useState("");
  const [challengesLoading, setChallengesLoading] = useState(true);

  function loadPortfolio() {
    apiFetch<Portfolio>("/paper/portfolio")
      .then((data) => {
        setPortfolio(data);
        setError("");
      })
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

  function loadCoach() {
    setCoachLoading(true);
    apiFetch<PortfolioCoaching>("/paper/coach")
      .then((data) => {
        setCoaching(data);
        setCoachError("");
      })
      .catch((err) => {
        console.error(err);
        setCoaching(null);
        setCoachError(err.message);
      })
      .finally(() => setCoachLoading(false));
  }

  function loadChallenges() {
    setChallengesLoading(true);
    apiFetch<LearningChallenge[]>("/paper/challenges")
      .then((data) => {
        setChallenges(data);
        setChallengesError("");
      })
      .catch((err) => {
        console.error(err);
        setChallenges([]);
        setChallengesError(err.message);
      })
      .finally(() => setChallengesLoading(false));
  }

  useEffect(() => {
    loadPortfolio();
    loadMarketStatus();
    loadCoach();
    loadChallenges();

    const interval = window.setInterval(() => {
      loadPortfolio();
      loadMarketStatus();
      loadCoach();
    }, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
              Trillium <span className="text-blue-600">Finance</span>
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Welcome to Trillium Finance. Master the markets, risk-free.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTradeModalOpen(true)}
              className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
            >
              + Buy Stocks
            </button>
            <span className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-5 py-2.5 text-sm font-bold shadow-sm">
              <span
                className={`h-2 w-2 rounded-full ${marketOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
              />
              {marketOpen ? "Markets Open" : "Markets Closed"}
            </span>
          </div>
        </header>

        {error ? (
          <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
            {error}
          </p>
        ) : null}

        {portfolio ? (
          <div className="space-y-8">
            <PortfolioOverview portfolio={portfolio} />

            <div className="mx-auto flex max-w-fit flex-wrap gap-2 rounded-2xl border border-slate-200/60 bg-slate-100/50 p-1.5">
              {(["portfolio", "chat", "rankings", "achievements", "learn"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-6 py-2 text-sm font-bold capitalize transition-all ${
                    activeTab === tab
                      ? "border border-slate-100 bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="transition-all duration-300">
              {activeTab === "portfolio" && (
                <div className="mx-auto max-w-5xl space-y-8">
                  <PerformanceChart portfolio={portfolio} />

                  {coachLoading ? (
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-500 shadow-sm">
                      Loading portfolio coaching...
                    </div>
                  ) : coaching ? (
                    <PortfolioCoachCard coaching={coaching} />
                  ) : coachError ? (
                    <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-800">
                      <p className="font-bold">Portfolio coach unavailable</p>
                      <p className="mt-1">
                        {coachError === "Account not linked"
                          ? "Link a paper trading account to unlock portfolio coaching."
                          : coachError}
                      </p>
                    </div>
                  ) : null}

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

              {activeTab === "learn" && (
                <div className="mx-auto max-w-5xl space-y-6">
                  {challengesLoading ? (
                    <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500">
                      Loading learning challenges...
                    </div>
                  ) : challengesError ? (
                    <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-800">
                      <p className="font-bold">Challenges unavailable</p>
                      <p className="mt-1">{challengesError}</p>
                    </div>
                  ) : (
                    <LearningChallenges challenges={challenges} />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-200" />
          </div>
        )}

        {isTradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-100 bg-white shadow-2xl">
              <button
                onClick={() => setIsTradeModalOpen(false)}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100"
              >
                ✕
              </button>
              <div className="p-4 sm:p-6">
                <PaperTradingPanel
                  onTradeCompleted={() => {
                    loadPortfolio();
                    loadCoach();
                    setIsTradeModalOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}