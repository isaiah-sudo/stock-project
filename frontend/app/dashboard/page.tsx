"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
import { TrophyCard } from "../../components/TrophyCard";
import { getCurrentLevel, getNextLevel, getLevelProgress } from "@stock/shared";
import { type BackgroundEffect, getBackgroundEffect } from "../../lib/backgroundTheme";

interface Achievement {
  id: string;
  type: string;
  unlockedAt: string;
}

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
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [bgEffect, setBgEffect] = useState<BackgroundEffect>("solid");
  const hasCountedUp = useRef(false);
  const [displayNetWorth, setDisplayNetWorth] = useState(0);
  const [displayDayPerf, setDisplayDayPerf] = useState(0);

  const initialBalance = 10000;
  const marketValue = portfolio ? portfolio.totalValue - portfolio.cashBalance : 0;
  const totalPerformanceDollar = portfolio ? portfolio.totalValue - initialBalance : 0;
  const totalPerformancePct = portfolio ? Number(((totalPerformanceDollar / initialBalance) * 100).toFixed(2)) : 0;
  const dayPerformanceDollar = portfolio?.dayChangeDollar ?? 0;

  // Count-up animation on first portfolio load
  useEffect(() => {
    if (!portfolio || hasCountedUp.current) return;
    hasCountedUp.current = true;
    const targetNetWorth = portfolio.totalValue;
    const targetDayPerf = portfolio.dayChangeDollar ?? 0;
    const duration = 1200; // ms
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayNetWorth(eased * targetNetWorth);
      setDisplayDayPerf(eased * targetDayPerf);
      if (step >= steps) {
        clearInterval(timer);
        setDisplayNetWorth(targetNetWorth);
        setDisplayDayPerf(targetDayPerf);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [portfolio]);

  // Memoize bubble data so positions are stable across re-renders (prevents disappear/reappear)
  const bubbleData = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      size: Math.round(20 + (((i * 7 + 13) % 17) / 17) * 35),  // 20-55px
      left: 3 + (((i * 31 + 5) % 23) / 23) * 94,               // 3-97%
      delay: i * 1.3 + (((i * 11 + 3) % 7) / 7) * 2,           // staggered
      duration: 14 + (((i * 13 + 7) % 11) / 11) * 10,           // 14-24s
      sway: 15 + (((i * 17 + 2) % 13) / 13) * 40,              // 15-55px
      opacity: 0.18 + (((i * 19 + 1) % 9) / 9) * 0.12,         // 0.18-0.30
    })),
  []);

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
      
    apiFetch<Achievement[]>("/paper/achievements")
      .then(setAchievements)
      .catch(() => {});
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
    setBgEffect(getBackgroundEffect());
    loadPortfolio();
    loadMarketStatus();
    const interval = window.setInterval(() => {
      loadPortfolio();
      loadMarketStatus();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleBgChange() {
      setBgEffect(getBackgroundEffect());
    }
    window.addEventListener("bgEffectChanged", handleBgChange);
    return () => window.removeEventListener("bgEffectChanged", handleBgChange);
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

  const isUp = dayPerformanceDollar >= 0;
  const backgroundClass = portfolio 
    ? (isUp 
        ? "bg-gradient-to-br from-amber-100 via-emerald-100/60 to-teal-100 dark:from-slate-900 dark:via-emerald-950/40 dark:to-slate-900" 
        : "bg-gradient-to-br from-slate-300 via-rose-200/60 to-slate-200 dark:from-slate-900 dark:via-rose-950/40 dark:to-slate-900")
    : "bg-slate-50/50 dark:bg-slate-900";

  const effectColorClass = isUp ? "bg-emerald-400/60 dark:bg-emerald-500/40" : "bg-rose-400/60 dark:bg-rose-500/40";
  const lightColorClass = isUp ? "bg-emerald-300" : "bg-rose-300";

  return (
    <div className={`relative transition-colors duration-1000 ${backgroundClass} overflow-hidden`}>
      {bgEffect === "bubbles" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          {bubbleData.map((b, i) => (
            <div
              key={`bubble-${i}`}
              className={`absolute top-0 rounded-full ${effectColorClass} opacity-0 animate-bubble-down`}
              style={{
                left: `${b.left}%`,
                width: `${b.size}px`,
                height: `${b.size}px`,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                "--delay": `${b.delay}s`,
                "--duration": `${b.duration}s`,
                "--sway": `${b.sway}px`,
                "--bubble-opacity": `${b.opacity}`,
              }}
            />
          ))}
        </div>
      )}

      {bgEffect === "lights" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`light-${i}`}
              className={`absolute rounded-full ${lightColorClass} blur-3xl opacity-0 animate-light-pulse`}
              style={{
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 80}%`,
                width: `${Math.random() * 300 + 200}px`,
                height: `${Math.random() * 300 + 200}px`,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                "--delay": `${Math.random() * 5}s`,
                "--duration": `${Math.random() * 4 + 4}s`,
              }}
            />
          ))}
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-7xl space-y-6 p-4 pb-6 sm:space-y-8 sm:p-8 sm:pb-8">
        <div id="dashboard-nav" className={highlightClass("dashboard-nav")}>
          <Navbar 
            onChatClick={() => setActiveTab(activeTab === "chat" ? "portfolio" : "chat")} 
            experiencePoints={portfolio?.experiencePoints} 
          />
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
                <section id="summary-panel" className={`rounded-[2rem] border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-4 shadow-sm sm:p-6 ${highlightClass("summary-panel")}`}>
                <div className="mb-6">
                  <div className="mb-3 text-lg font-bold text-emerald-500 dark:text-emerald-400 sm:text-xl">Financial Summary</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Net Worth
                      {isEducational && <LearnMore title="Net Worth" content="The total value of all your cash and stock investments combined. This is your total wealth in the simulator." />}
                    </p>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100 sm:text-3xl font-num">{formatCurrency(displayNetWorth)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Market Value
                      {isEducational && <LearnMore title="Market Value" content="The current total worth of all the stocks you own if you were to sell them right now." />}
                    </p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl font-num">{formatCurrency(marketValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Total Performance
                      {isEducational && <LearnMore title="Total Performance" content="How much your account has grown (or shrunk) since you started with your initial $10,000 balance." />}
                    </p>
                    <p className={`text-xl font-bold sm:text-2xl font-num ${totalPerformanceDollar >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {totalPerformanceDollar >= 0 ? "+" : ""}{formatCurrency(totalPerformanceDollar)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-num">
                      {totalPerformancePct >= 0 ? "+" : ""}{totalPerformancePct.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Day Performance
                      {isEducational && <LearnMore title="Day Performance" content="How much your portfolio value changed specifically since the market opened today." />}
                    </p>
                    <p className={`text-xl font-bold sm:text-2xl font-num ${dayPerformanceDollar >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {dayPerformanceDollar >= 0 ? "+" : ""}{formatCurrency(displayDayPerf)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-num">
                      {portfolio.dayChangePct >= 0 ? "+" : ""}{portfolio.dayChangePct.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Available Cash
                      {isEducational && <LearnMore title="Available Cash" content="The money you have 'on hand' to buy new stocks. It doesn't include the value of stocks you already own." />}
                    </p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl font-num">{formatCurrency(portfolio.cashBalance)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-center border-t border-slate-100 dark:border-slate-700 pt-2">
                  <button 
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                  >
                    {isSummaryExpanded ? "Hide Details ᐱ" : "Show XP & Trophies ᐯ"}
                  </button>
                  
                  <div className={`w-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isSummaryExpanded ? "max-h-64 opacity-100 mt-6" : "max-h-0 opacity-0 mt-0"}`}>
                    <div className="flex w-full flex-col sm:flex-row items-stretch gap-6 rounded-3xl bg-white/60 dark:bg-slate-700/60 p-6 border border-slate-100 dark:border-slate-600 shadow-sm backdrop-blur-sm">
                      {/* Left: XP & Progress */}
                      <div className="flex flex-col justify-center sm:w-1/3 sm:border-r sm:border-slate-200/60 dark:sm:border-slate-600/60 sm:pr-6">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Your Experience</div>
                        <div className="flex items-baseline gap-2 text-4xl font-black text-blue-600 dark:text-blue-400 drop-shadow-sm font-num">
                          {portfolio.experiencePoints || 0} <span className="text-xl font-bold text-slate-500 dark:text-slate-400">XP</span>
                        </div>
                        {/* Progress Bar */}
                        {(() => {
                           const xp = portfolio.experiencePoints || 0;
                           const currentLevel = getCurrentLevel(xp);
                           const nextLevel = getNextLevel(xp);
                           const progress = getLevelProgress(xp);
                           return (
                             <div className="mt-4 w-full">
                               <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                                 <span className="flex items-center gap-1"><span className="text-sm">{currentLevel.icon}</span> {currentLevel.label}</span>
                                 {nextLevel && <span>Next: {nextLevel.label}</span>}
                               </div>
                               <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
                                 <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                               </div>
                             </div>
                           );
                        })()}
                      </div>

                      {/* Right: Trophies */}
                      <div className="flex flex-1 flex-col">
                        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Top Trophies</div>
                        <div className="flex flex-1 items-center justify-around gap-2">
                          {(() => {
                            const ACHIEVEMENT_META: Record<string, { label: string; icon: string; desc: string }> = {
                              WHALE: { label: "Whale", icon: "🐋", desc: "Executed a $10k+ trade" },
                              ALL_STAR: { label: "All Star", icon: "🌟", desc: "Doubled your initial capital" },
                              BULL_RUN: { label: "Bull Run", icon: "🐂", desc: "Reach $50k market value" },
                              PROFIT_TAKER: { label: "Profit Taker", icon: "💰", desc: "Sold a stock for a gain" },
                              DIVERSIFIED: { label: "Diversified", icon: "🌍", desc: "Hold 5+ different assets" },
                              TEN_PCT_GAIN: { label: "Investor", icon: "📈", desc: "Reached 10% portfolio growth" },
                              FIRST_TRADE: { label: "First Trade", icon: "🤝", desc: "Executed your first order" },
                            };
                            
                            const unlockedMeta = achievements
                              .map(a => ACHIEVEMENT_META[a.type])
                              .filter(Boolean);
                              
                            const topThree = unlockedMeta.slice(0, 3);
                            
                            if (topThree.length === 0) {
                              return <div className="text-sm font-semibold text-slate-400 italic py-6 w-full text-center">No trophies unlocked yet.</div>;
                            }
                            
                            return topThree.map((meta, i) => (
                              <TrophyCard key={meta.label} rank={(i + 1) as 1|2|3} icon={meta.icon} label={meta.label} desc={meta.desc} />
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-4 shadow-sm sm:p-6">
                <PerformanceChart portfolio={portfolio} marketOpen={marketOpen} />
              </section>

              <section id="holdings-panel" className={`rounded-[2rem] border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-4 shadow-sm sm:p-6 ${highlightClass("holdings-panel")}`}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-bold sm:text-2xl dark:text-slate-100">Holdings Breakdown</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm dark:text-slate-300">
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
              <div className={`relative flex h-full min-h-[60vh] flex-col rounded-[2rem] border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-4 shadow-sm transition-all duration-500 ease-out sm:min-h-[640px] sm:p-6 ${activeTab === "chat" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}>
                <button
                  type="button"
                  onClick={() => setActiveTab("portfolio")}
                  className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition z-10 text-sm font-bold"
                  title="Close chat"
                >
                  ✕
                </button>
                <div className="flex-1 min-h-0 mt-4">
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
            <div className="w-full max-w-xl relative rounded-[2rem] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setIsTradeModalOpen(false)}
                className="absolute right-4 top-4 h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-600"
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
