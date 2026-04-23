"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Portfolio } from "@stock/shared";
import { apiFetch } from "../../lib/api";
import { ChatAssistant } from "../../components/ChatAssistant";
import { HoldingsTable } from "../../components/HoldingsTable";
import { PaperTradingPanel } from "../../components/PaperTradingPanel";
import { Navbar } from "../../components/Navbar";
import { Leaderboard } from "../../components/Leaderboard";
import { TutorialOverlay, type TutorialStep } from "../../components/TutorialOverlay";
import { dismissEducationTutorial, getMode, shouldShowEducationTutorial } from "../../lib/appMode";
import { LearnMore } from "../../components/LearnMore";

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
    const interval = window.setInterval(() => {
      loadPortfolio();
      loadMarketStatus();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleModeChange() {
      const nextShow = shouldShowEducationTutorial();
      setShowTutorial(nextShow);
      setIsEducational(getMode() === "educational");
      if (!nextShow) {
        setActiveTutorialTarget(null);
      }
    }

    window.addEventListener("appModeChanged", handleModeChange);
    return () => window.removeEventListener("appModeChanged", handleModeChange);
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
          <Navbar onChatClick={() => setActiveTab(activeTab === "chat" ? "portfolio" : "chat")} />
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
                buyingPower={portfolio?.cashBalance}
              />
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
