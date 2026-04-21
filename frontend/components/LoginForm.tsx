"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDefaultRouteForMode, getMode } from "../lib/appMode";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function performLogin(loginEmail: string, loginPassword: string, isDemoLogin: boolean = false) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      
      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData?.error || `Login failed with status ${response.status}`);
      
      const data = (await response.json()) as { token: string };
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      if (isDemoLogin) {
        setError(`Demo login failed: ${errorMessage}. Check that the backend server is running and accessible.`);
      } else {
        setError(errorMessage);
    } finally {
      setLoading(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await performLogin(email, password);

  async function useDemoLogin() {
    await performLogin("demo@example.com", "password123", true);

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
