"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) throw new Error("Invalid credentials");
      const data = (await response.json()) as { token: string };
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch {
      setError("Login failed. Use demo@example.com / password123.");
    } finally {
      setLoading(false);
    }
  }

  async function useDemoLogin() {
    setEmail("demo@example.com");
    setPassword("password123");
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@example.com", password: "password123" })
      });
      if (!response.ok) throw new Error("Invalid credentials");
      const data = (await response.json()) as { token: string };
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch {
      setError("Demo login failed. Check that backend is running on localhost:4000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="text-sm text-slate-500">Sign in to view your portfolio and AI insights.</p>
      <input
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
      <button
        type="button"
        onClick={useDemoLogin}
        disabled={loading}
        className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-700 disabled:opacity-60"
      >
        Quick demo login
      </button>
    </form>
  );
}
