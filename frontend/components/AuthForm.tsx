"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "../lib/firebase";

import { apiFetch } from "../lib/api";
import { getDefaultRouteForMode, getMode } from "../lib/appMode";

export function AuthForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const endpoint = isLogin ? "/auth/login" : "/auth/signup";
    
    try {
      const data = await apiFetch<any>(endpoint, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      
      trackEvent("auth_success", { method: isLogin ? "login" : "signup" });
      localStorage.setItem("token", data.token);
      const mode = getMode() ?? "personal";
      router.push(getDefaultRouteForMode(mode));
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      console.error("Auth error:", err);
      setError(errorMessage);
      trackEvent("auth_error_catch", { error: errorMessage });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-2xl border border-slate-100">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {isLogin ? "Welcome Back" : "Start Trading"}
        </h1>
        <p className="text-slate-500">
          {isLogin 
            ? "Log in to manage your $10k virtual portfolio." 
            : "Join the simulator and get your $10,000 starting balance!"}
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

        {error ? (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100 animate-shake">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 px-4 py-4 font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-60 transition-all transform active:scale-[0.98]"
        >
          {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
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
