"use client";

import Link from "next/link";
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
import { TutorialOverlay, type TutorialStep } from "../../components/TutorialOverlay";
import { dismissEducationTutorial, getMode, shouldShowEducationTutorial } from "../../lib/appMode";
import { LearnMore } from "../../components/LearnMore";

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
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTutorialTarget, setActiveTutorialTarget] = useState<string | null>(null);
  const [isEducational, setIsEducational] = useState(false);

  const initialBalance = 10000;
  const marketValue = portfolio ? portfolio.totalValue - portfolio.cashBalance : 0;
  const totalPerformanceDollar = portfolio ? portfolio.totalValue - initialBalance : 0;
  const totalPerformancePct = portfolio ? Number(((totalPerformanceDollar / initialBalance) * 100).toFixed(2)) : 0;
  const dayPerformanceDollar = portfolio?.dayChangeDollar ?? 0;

  function formatCurrency(value: number) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

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

  function highlightClass(targetId: string) {
    return activeTutorialTarget === targetId
      ? "ring-4 ring-blue-300 ring-offset-2 ring-offset-slate-50 transition"
      : "";
  }

  useEffect(() => {
    setShowTutorial(shouldShowEducationTutorial());
    setIsEducational(getMode() === "educational");
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
  }, []);

  const dashboardTutorialSteps: TutorialStep[] = [
    {
      title: "Welcome to your Financial Hub",
      description:
        "This is where you track your wealth. We've simplified the layout to help you focus on what matters: Growth and Cash Flow.",
      targetId: "summary-panel",
    },
    {
      title: "Net Worth vs Cash",
      description:
        "Your Net Worth is everything you own. Available Cash is what you can use to buy new stocks RIGHT NOW.",
      targetId: "summary-panel",
      helperText: "Tip: Look for the (?) icons to learn about any term!"
    },
    {
       title: "Analyze before you act",
       description: "Instead of guessing, use our AI Assistant to research stocks. Ask for risks and potential upside.",
       targetId: "dashboard-nav",
       helperText: "Click the Chat icon in the Navbar to open the advisor."
    },
    {
      title: "Your First Trade",
      description:
        "Ready to practice? Click 'Buy Stocks' to open the trading panel. You're using 'Paper Money' - so it's safe to experiment!",
      targetId: "holdings-panel",
      actionLabel: "Open Trading Panel"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-8">
        <div id="dashboard-nav" className={highlightClass("dashboard-nav")}>
          <Navbar onChatClick={() => setActiveTab("chat")} />
        </div>
        {error ? (
          <div className="rounded-3xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-100">
            {error}
          </div>
        ) : null}

        {portfolio ? (
          <>
            <div className={`flex flex-col gap-6 ${activeTab === "chat" ? "lg:flex-row lg:items-stretch" : "lg:flex-col"}`}>
              <div className={`space-y-6 transition-all duration-500 ease-out ${activeTab === "chat" ? "flex-1" : "w-full"}`}>
                <section id="summary-panel" className={`rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${highlightClass("summary-panel")}`}>
                <div className="mb-6">
                  <div className="mb-3 text-lg font-bold text-emerald-500 sm:text-xl">Financial Summary</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">
                      Net Worth
                      {isEducational && <LearnMore title="Net Worth" content="The total value of all your cash and stock investments combined. This is your total wealth in the simulator." />}
                    </p>
                    <div className="text-2xl font-black text-slate-900 sm:text-3xl">{formatCurrency(portfolio.totalValue)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Available Cash
                      {isEducational && <LearnMore title="Available Cash" content="The money you have 'on hand' to buy new stocks. It doesn't include the value of stocks you already own." />}
                    </p>
                    <p className="text-xl font-bold text-slate-900 sm:text-2xl">{formatCurrency(portfolio.cashBalance)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Market Value
                      {isEducational && <LearnMore title="Market Value" content="The current total worth of all the stocks you own if you were to sell them right now." />}
                    </p>
                    <p className="text-xl font-bold text-slate-900 sm:text-2xl">{formatCurrency(marketValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Total Performance
                      {isEducational && <LearnMore title="Total Performance" content="How much your account has grown (or shrunk) since you started with your initial $10,000 balance." />}
                    </p>
                    <p className={`text-xl font-bold sm:text-2xl ${totalPerformanceDollar >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {totalPerformanceDollar >= 0 ? "+" : ""}{formatCurrency(totalPerformanceDollar)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {totalPerformancePct >= 0 ? "+" : ""}{totalPerformancePct.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Day Performance
                      {isEducational && <LearnMore title="Day Performance" content="How much your portfolio value changed specifically since the market opened today." />}
                    </p>
                    <p className={`text-xl font-bold sm:text-2xl ${dayPerformanceDollar >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {dayPerformanceDollar >= 0 ? "+" : ""}{formatCurrency(dayPerformanceDollar)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {portfolio.dayChangePct >= 0 ? "+" : ""}{portfolio.dayChangePct.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <PerformanceChart portfolio={portfolio} />
              </section>

              <section id="holdings-panel" className={`rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${highlightClass("holdings-panel")}`}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-bold sm:text-2xl">Holdings Breakdown</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full ${marketOpen ? "bg-green-500" : "bg-red-500"}`}></span>
                      {marketOpen ? "Markets Open" : "Markets Closed"}
                    </div>
                    <button
                      onClick={() => setIsTradeModalOpen(true)}
                      className="w-full rounded-3xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200/60 transition hover:bg-blue-700 sm:w-auto"
                    >
                      + Buy Stocks
                    </button>
                  </div>
                </div>
                <HoldingsTable holdings={portfolio.holdings} />
              </section>
            </div>

            <div className={`overflow-hidden transition-all duration-500 ease-out ${activeTab === "chat" ? "w-full opacity-100 lg:w-1/3 xl:w-[420px]" : "w-0 opacity-0 lg:w-0"}`}>
              <div className={`flex h-full min-h-[60vh] flex-col rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-500 ease-out sm:min-h-[640px] sm:p-6 ${activeTab === "chat" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}>
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">AI Chat Assistant</p>
                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Ask your portfolio advisor</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("portfolio")}
                    className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:w-auto flex-shrink-0"
                  >
                    Close
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <ChatAssistant />
                </div>
              </div>
            </div>
          </div>
          </>
        ) : (
          <div className="flex min-h-[56vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-200"></div>
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
        {showTutorial ? (
          <TutorialOverlay
            title="Dashboard Tutorial"
            steps={dashboardTutorialSteps}
            targetId={activeTutorialTarget ?? undefined}
            onStepChange={(step) => setActiveTutorialTarget(step.targetId ?? null)}
            onStepAction={(step) => {
              if (step.targetId === "holdings-panel") {
                setIsTradeModalOpen(true);
              }
            }}
            onClose={() => {
              setShowTutorial(false);
              setActiveTutorialTarget(null);
            }}
            onDismissForever={() => {
              dismissEducationTutorial();
              setShowTutorial(false);
              setActiveTutorialTarget(null);
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
