"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "../lib/firebase";

import { apiFetch } from "../lib/api";
import { getDefaultRouteForMode, getMode } from "../lib/appMode";
import { PORTFOLIO_PRESETS, type PortfolioPresetId } from "@stock/shared";

export function AuthForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preset, setPreset] = useState<PortfolioPresetId>("standard");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const endpoint = isLogin ? "/auth/login" : "/auth/signup";
    
    try {
      const data = await apiFetch<any>(endpoint, {
        method: "POST",
        body: JSON.stringify(isLogin ? { email, password } : { email, password, portfolioPreset: preset })
      });
      
      trackEvent("auth_success", { method: isLogin ? "login" : "signup" });
      localStorage.setItem("token", data.token);
      const mode = getMode() ?? "personal";
      if (!isLogin && data.onboarding?.verificationRequired) {
        setNotice("Account created. Check your inbox so we can keep the updates flowing.");
        window.setTimeout(() => router.push(getDefaultRouteForMode(mode)), 450);
        return;
      }
      router.push(getDefaultRouteForMode(mode));
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message);
      trackEvent("auth_error_catch", { error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-2xl border border-slate-100">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {isLogin ? "Welcome back" : "Pick your starter pack"}
        </h1>
        <p className="text-slate-500">
          {isLogin 
            ? "Log in to manage your starter portfolio."
            : "Choose a vibe and we’ll spin up your first portfolio automatically."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none transition-all"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 ml-1">Password</label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none transition-all"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
          />
        </div>

        {!isLogin ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 ml-1">Starter strategy</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {PORTFOLIO_PRESETS.map((item) => {
                const selected = preset === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreset(item.id)}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                      selected
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-slate-900">{item.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        {item.risk}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{item.tagline}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-100">
            {notice}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 px-4 py-4 font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-60 transition-all transform active:scale-[0.98]"
        >
          {loading ? "Processing..." : (isLogin ? "Sign in" : "Create my portfolio")}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-100"></div>
        <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Simulator Alpha</span>
        <div className="flex-grow border-t border-slate-100"></div>
      </div>
    </div>
  );
}
