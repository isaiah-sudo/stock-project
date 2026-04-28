"use client";

import { useEffect, useState } from "react";
import { getMode } from "../lib/appMode";

const CONCEPTS = [
  {
    title: "Position Sizing",
    text: "Never put more than 5% of your total capital into a single trade to manage risk.",
  },
  {
    title: "Market Value vs Cash",
    text: "Market Value is the current worth of your stocks. Cash is what you have available to buy more.",
  },
  {
    title: "Diversification",
    text: "Spread your investments across different sectors (Tech, Energy, Healthcare) to reduce impact from one industry's downturn.",
  },
  {
    title: "Stop Loss",
    text: "A stop-loss order is an order placed with a broker to sell a security when it reaches a certain price.",
  },
  {
    title: "P/E Ratio",
    text: "The Price-to-Earnings ratio measures a company's current share price relative to its earnings-per-share.",
  }
];

export function EducationSidebar() {
  const [mode, setMode] = useState<string | null>(null);
  const [conceptIndex, setConceptIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMode(getMode());
    setConceptIndex(Math.floor(Math.random() * CONCEPTS.length));
    
    // Smooth entrance
    setTimeout(() => setIsVisible(true), 1000);

    const handleModeChange = () => setMode(getMode());
    window.addEventListener("appModeChanged", handleModeChange);
    return () => window.removeEventListener("appModeChanged", handleModeChange);
  }, []);

  if (mode !== "educational") return null;

  const concept = CONCEPTS[conceptIndex];

  return (
    <aside className="fixed right-3 bottom-3 z-40 sm:right-6 sm:bottom-6">
      {/* Question Mark Launcher Button */}
      <button
        onClick={() => setIsVisible(true)}
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-500/40 transition-all duration-500 hover:scale-110 hover:bg-blue-700 active:scale-95 ${
          isVisible ? "pointer-events-none scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Open Learning Center"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Main Sidebar */}
      <div 
        className={`w-[calc(100vw-1.5rem)] max-w-80 transform transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-12 scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <div className="group relative rounded-[2.5rem] border border-blue-100 bg-white/80 p-7 shadow-2xl shadow-blue-200/20 backdrop-blur-xl transition-all hover:bg-white hover:shadow-blue-200/40">
          <div className="absolute -top-3 -left-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/40 rotate-[-10deg] transition-transform group-hover:rotate-0">
              <span className="text-xl">🎓</span>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between pl-10">
            <div>
              <h3 className="text-sm font-black tracking-tight text-slate-900">Learning Center</h3>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Guided Experience</p>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="rounded-full p-1 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-blue-50 to-indigo-50/30 p-5 border border-blue-100/50">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-400 mb-2">Concept of the Day</p>
                <h4 className="text-base font-black text-slate-900 mb-2">{concept.title}</h4>
                <p className="text-xs leading-relaxed text-slate-600 font-semibold opacity-80">
                  {concept.text}
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 text-blue-100/40 rotate-12">
                 <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L1 21h22L12 2zm0 3.45l8.27 14.3H3.73L12 5.45z"/>
                 </svg>
              </div>
            </div>
            
            <div className="px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">Trading Wisdom</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 group/tip">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 transition-transform group-hover/tip:scale-150" />
                  <p className="text-[11px] font-bold text-slate-600 leading-normal">
                    Always verify data with the <span className="text-blue-600">AI advisor</span> before executing.
                  </p>
                </div>
                <div className="flex items-start gap-3 group/tip">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 transition-transform group-hover/tip:scale-150" />
                  <p className="text-[11px] font-bold text-slate-600 leading-normal">
                    The <span className="text-emerald-600">Leaderboard</span> is a tool for learning, not just ego!
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-7">
            <button 
              onClick={() => {
                setConceptIndex((prev) => (prev + 1) % CONCEPTS.length);
              }}
              className="group/btn relative w-full overflow-hidden rounded-2xl bg-slate-900 py-3.5 text-[11px] font-black tracking-widest text-white transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200"
            >
              <span className="relative z-10 uppercase">Refresh Insights</span>
              <div className="absolute inset-0 translate-y-full bg-blue-600 transition-transform group-hover/btn:translate-y-0" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
