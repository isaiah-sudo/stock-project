"use client";

import { useMemo, useState } from "react";
import type { Portfolio } from "@stock/shared";

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function topHoldings(portfolio: Portfolio) {
  return [...portfolio.holdings]
    .map((holding) => ({
      ...holding,
      value: holding.quantity * holding.currentPrice
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

async function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function PortfolioShareCard({ portfolio }: { portfolio: Portfolio }) {
  const [loading, setLoading] = useState(false);
  const shareLabel = useMemo(() => {
    const delta = portfolio.totalValue - 10_000;
    return `${delta >= 0 ? "+" : ""}${formatMoney(delta)} since launch`;
  }, [portfolio.totalValue]);

  async function buildShareImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(0.5, "#0f766e");
    gradient.addColorStop(1, "#1d4ed8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(1060, 220, 240, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(180, 1320, 260, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 44px Arial";
    ctx.fillText("Trillium Finance", 80, 120);

    ctx.font = "900 92px Arial";
    ctx.fillText(formatMoney(portfolio.totalValue), 80, 260);

    ctx.font = "700 34px Arial";
    ctx.fillText(shareLabel, 80, 320);

    ctx.fillStyle = "rgba(15,23,42,0.55)";
    ctx.fillRect(80, 400, 1040, 300);
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 400, 1040, 300);

    const stats = [
      ["Day move", `${(portfolio.dayChangeDollar ?? 0) >= 0 ? "+" : ""}${formatMoney(portfolio.dayChangeDollar ?? 0)}`],
      ["Cash", formatMoney(portfolio.cashBalance)],
      ["Holdings", String(portfolio.holdings.length)]
    ];

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "700 26px Arial";
    stats.forEach(([label, value], index) => {
      const y = 470 + index * 80;
      ctx.fillText(label, 120, y);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 46px Arial";
      ctx.fillText(value, 120, y + 44);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "700 26px Arial";
    });

    ctx.fillStyle = "#f8fafc";
    ctx.font = "800 40px Arial";
    ctx.fillText("Top positions", 80, 780);

    const top = topHoldings(portfolio);
    top.forEach((holding, index) => {
      const y = 860 + index * 170;
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(80, y - 52, 1040, 132);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 52px Arial";
      ctx.fillText(holding.symbol, 120, y);
      ctx.font = "700 28px Arial";
      ctx.fillText(holding.name, 120, y + 40);
      ctx.textAlign = "right";
      ctx.font = "900 44px Arial";
      ctx.fillText(formatMoney(holding.value), 1080, y + 8);
      ctx.font = "700 28px Arial";
      ctx.fillText(`${holding.quantity} shares`, 1080, y + 44);
      ctx.textAlign = "left";
    });

    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.font = "700 26px Arial";
    ctx.fillText("Made for flexing on the group chat, not a trading floor.", 80, 1520);

    return canvas;
  }

  async function handleShare() {
    try {
      setLoading(true);
      const canvas = await buildShareImage();
      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error("Could not generate image");
      const file = new File([blob], "trillium-portfolio.png", { type: "image/png" });

      const canShareFiles =
        "canShare" in navigator
          ? (navigator as Navigator & { canShare: (data: ShareData) => boolean }).canShare({ files: [file] })
          : false;

      if (navigator.share && canShareFiles) {
        await navigator.share({
          title: "My Trillium portfolio",
          text: `Trillium snapshot: ${formatMoney(portfolio.totalValue)}.`,
          files: [file]
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "trillium-portfolio.png";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Social</p>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Make a clean flex card</h3>
        </div>
        <button
          type="button"
          onClick={handleShare}
          disabled={loading}
          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? "Cooking..." : "Share to Social"}
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Generates a shareable image for Instagram, TikTok, or the group chat.
      </p>
    </div>
  );
}
