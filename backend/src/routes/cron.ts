import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { BrokerageService } from "../services/brokerageService.js";
import { sendPortfolioDigestEmail, markDigestSent } from "../services/emailService.js";

const router = Router();
const brokerageService = new BrokerageService();

function assertCronSecret(req: any, res: any) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    res.status(500).json({ error: "CRON_SECRET is not configured." });
    return false;
  }
  const provided = (req.header("x-cron-secret") ?? req.header("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (provided !== expected) {
    res.status(401).json({ error: "Nope. Wrong secret." });
    return false;
  }
  return true;
}

router.post("/portfolio-updates", async (req, res) => {
  if (!assertCronSecret(req, res)) {
    return;
  }

  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const users = await prisma.user.findMany({
    where: {
      emailVerifiedAt: { not: null },
      OR: [
        { lastPortfolioDigestSentAt: null },
        { lastPortfolioDigestSentAt: { lt: cutoff } }
      ]
    },
    select: {
      id: true,
      email: true,
      portfolioPreset: true,
      lastPortfolioDigestSentAt: true,
      paperAccount: { select: { linked: true } }
    }
  });

  const results = [];
  for (const user of users) {
    if (!user.paperAccount?.linked) {
      results.push({ userId: user.id, skipped: true, reason: "paper account not linked" });
      continue;
    }

    const portfolio = await brokerageService.getPortfolio(user.id);
    if (!portfolio) {
      results.push({ userId: user.id, skipped: true, reason: "portfolio unavailable" });
      continue;
    }

    const presetName = user.portfolioPreset.charAt(0).toUpperCase() + user.portfolioPreset.slice(1);
    try {
      const sendResult = await sendPortfolioDigestEmail({
        email: user.email,
        name: user.email.split("@")[0],
        portfolio,
        presetName
      });
      if ((sendResult as { skipped?: boolean } | undefined)?.skipped) {
        results.push({ userId: user.id, skipped: true, reason: "email provider not configured" });
        continue;
      }
      await markDigestSent(prisma, user.id);
      results.push({ userId: user.id, sent: true });
    } catch (error) {
      console.error("Digest send failed:", error);
      results.push({ userId: user.id, sent: false });
    }
  }

  return res.json({ ok: true, count: results.length, results });
});

export default router;
