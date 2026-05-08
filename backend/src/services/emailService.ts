import crypto from "crypto";
import type { Portfolio } from "@stock/shared";
import type { PrismaClient } from "@prisma/client";

type EmailRecipient = {
  email: string;
  name?: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function createVerificationToken() {
  return crypto.randomBytes(24).toString("hex");
}

async function sendViaResend(args: {
  to: EmailRecipient;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    console.log("[email] Skipping provider send; RESEND_API_KEY or RESEND_FROM_EMAIL missing.");
    console.log(`[email] To=${args.to.email} Subject=${args.subject}`);
    return { skipped: true };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: args.to.email,
      subject: args.subject,
      html: args.html,
      text: args.text
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email provider error ${response.status}: ${body}`);
  }

  return response.json();
}

export async function sendVerificationEmail(args: {
  email: string;
  verificationToken: string;
  presetName: string;
}) {
  const baseUrl = process.env.APP_BASE_URL?.trim() || process.env.PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const verifyUrl = `${baseUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(args.verificationToken)}`;
  const subject = "Verify your Trillium Finance email";
  const text = [
    `Nice. Your Trillium Finance account is live on the ${args.presetName} starter portfolio.`,
    `Verify your email so we can send portfolio updates: ${verifyUrl}`,
    "",
    "If you did not create this account, ignore this message."
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px">Your Trillium account is ready</h2>
      <p style="margin:0 0 12px">We dropped you into the <strong>${args.presetName}</strong> starter portfolio so price movement starts immediately.</p>
      <p style="margin:0 0 20px">Verify your email so we can send useful updates and digests.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">Verify email</a></p>
      <p style="margin-top:20px;color:#64748b;font-size:12px">If you did not create this account, ignore this message.</p>
    </div>
  `;
  return sendViaResend({
    to: { email: args.email },
    subject,
    html,
    text
  });
}

export async function sendPortfolioDigestEmail(args: {
  email: string;
  name: string;
  portfolio: Portfolio;
  presetName: string;
}) {
  const subject = `Your ${args.presetName} portfolio check-in`;
  const holdingsCount = args.portfolio.holdings.length;
  const netChange = args.portfolio.totalValue - 10_000;
  const topHolding = [...args.portfolio.holdings].sort((a, b) => (b.quantity * b.currentPrice) - (a.quantity * a.currentPrice))[0];
  const text = [
    `Yo ${args.name}, here's your Trillium check-in.`,
    `Net worth: ${formatMoney(args.portfolio.totalValue)} (${netChange >= 0 ? "+" : ""}${formatMoney(netChange)})`,
    `Day move: ${args.portfolio.dayChangeDollar >= 0 ? "+" : ""}${formatMoney(args.portfolio.dayChangeDollar ?? 0)}`,
    `Holdings: ${holdingsCount}`,
    topHolding ? `Biggest line item: ${topHolding.symbol}` : "No holdings yet.",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px">Yo ${args.name}, your Trillium check-in</h2>
      <p style="margin:0 0 10px">Net worth: <strong>${formatMoney(args.portfolio.totalValue)}</strong></p>
      <p style="margin:0 0 10px">Day move: <strong>${args.portfolio.dayChangeDollar >= 0 ? "+" : ""}${formatMoney(args.portfolio.dayChangeDollar ?? 0)}</strong></p>
      <p style="margin:0 0 10px">Holdings: <strong>${holdingsCount}</strong></p>
      <p style="margin:0 0 10px">Cash: <strong>${formatMoney(args.portfolio.cashBalance)}</strong></p>
      <p style="margin:0 0 10px">Top holding: <strong>${topHolding?.symbol ?? "none yet"}</strong></p>
    </div>
  `;

  return sendViaResend({
    to: { email: args.email, name: args.name },
    subject,
    html,
    text
  });
}

export async function markDigestSent(prisma: PrismaClient, userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastPortfolioDigestSentAt: new Date() }
  });
}
