"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface Provider {
  id: "webull" | "paper" | "manual";
  name: string;
  status: "supported" | "mock";
  description: string;
  sampleAccount: {
    accountType: string;
    accountLabel: string;
    buyingPower: number;
  };
}

export function LinkBrokerageCard() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [status, setStatus] = useState("Loading brokerages...");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Provider[]>("/brokerage/providers")
      .then((items) => {
        setProviders(items);
        setStatus("Pick a brokerage connection option below.");
      })
      .catch(() => setStatus("Could not load brokerage options. Please log in again."));
  }, []);

  async function onConnect(providerId: Provider["id"]) {
    setSelectedProvider(providerId);
    setLink(null);
    try {
      if (providerId === "webull") {
        setStatus("Requesting Webull OAuth authorization...");
        const data = await apiFetch<{ url: string }>("/brokerage/webull/connect");
        setLink(data.url);
        setStatus("Webull authorization URL is ready.");
        return;
      }

      if (providerId === "paper") {
        const result = await apiFetch<{ linked: boolean; provider: string; cashBalance: number }>("/paper/link", {
          method: "POST"
        });
        setStatus(
          `Paper account linked with starting cash of $${result.cashBalance.toLocaleString()}. Open dashboard to trade.`
        );
        return;
      }

      const result = await apiFetch<{ linked: boolean; provider: string; message: string }>(
        "/brokerage/mock-link",
        {
          method: "POST",
          body: JSON.stringify({ providerId })
        }
      );
      setStatus(`${result.message} (${result.provider})`);
    } catch {
      setStatus("Could not complete brokerage linking.");
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-xl font-semibold">Link your brokerage</h2>
      <p className="mt-1 text-sm text-slate-500">
        Choose a real or demo brokerage connection. You can start instantly with demo data and switch to
        real OAuth when ready.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{provider.name}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {provider.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{provider.description}</p>
            <p className="mt-2 text-xs text-slate-500">
              {provider.sampleAccount.accountLabel} {provider.sampleAccount.accountType} | Buying power: $
              {provider.sampleAccount.buyingPower.toLocaleString()}
            </p>
            <button
              onClick={() => onConnect(provider.id)}
              className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
            >
              {selectedProvider === provider.id ? "Processing..." : `Connect ${provider.name}`}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-700">{status}</p>
      {link ? <a href={link} className="mt-2 block text-sm text-blue-600 underline">Open OAuth page</a> : null}
    </div>
  );
}
