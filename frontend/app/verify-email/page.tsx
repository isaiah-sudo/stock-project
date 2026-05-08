"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../lib/api";

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Checking your email link...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing token. That link is busted.");
      return;
    }

    apiFetch<{ ok: boolean; message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token })
    })
      .then((data) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error.message || "Verification failed.");
      });
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-emerald-50 px-4">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Email check</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Verifying your address</h1>
        <p className="mt-4 text-slate-600">{message}</p>
        <div
          className={`mt-6 rounded-2xl px-4 py-3 text-sm font-semibold ${
            status === "success"
              ? "bg-emerald-50 text-emerald-700"
              : status === "error"
                ? "bg-rose-50 text-rose-700"
                : "bg-slate-50 text-slate-700"
          }`}
        >
          {status === "success" ? "Nice. You're verified." : status === "error" ? "Rats. That link didn't work." : "Hold tight."}
        </div>
        <Link
          href="/sign-in"
          className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-emerald-50 px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Email check</p>
          <h1 className="mt-3 text-3xl font-black text-slate-900">Verifying your address</h1>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
