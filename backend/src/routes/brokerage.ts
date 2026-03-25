import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { BrokerageService } from "../services/brokerageService.js";
import { paperTradingService } from "../services/paperTradingService.js";
import type { AuthRequest } from "../types.js";

const router = Router();
const brokerageService = new BrokerageService();

const mockProviders = [
  {
    id: "webull",
    name: "Webull",
    status: "supported",
    description: "OAuth-ready integration scaffolded in this starter.",
    sampleAccount: { accountType: "Margin", accountLabel: "Primary", buyingPower: 23000.55 }
  },
  {
    id: "paper",
    name: "Demo Paper Account",
    status: "mock",
    description: "Instant sandbox with sample holdings so you can explore the dashboard now.",
    sampleAccount: { accountType: "Paper", accountLabel: "Demo", buyingPower: 100000 }
  },
  {
    id: "manual",
    name: "Manual Import",
    status: "mock",
    description: "Upload CSV or type positions manually (placeholder flow).",
    sampleAccount: { accountType: "Manual", accountLabel: "Imported", buyingPower: 0 }
  }
];

router.get("/providers", requireAuth, (_req, res) => {
  return res.json(mockProviders);
});

router.get("/webull/connect", requireAuth, async (req: AuthRequest, res) => {
  const url = await brokerageService.getWebullOAuthUrl(req.user!.userId);
  return res.json({ provider: "webull", url });
});

const callbackSchema = z.object({
  code: z.string().min(1)
});

router.post("/webull/callback", requireAuth, async (req: AuthRequest, res) => {
  const parsed = callbackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const tokens = await brokerageService.exchangeWebullCodeForTokens(parsed.data.code);
  // TODO: Encrypt and persist tokens with user linkage.
  return res.json({ linked: true, provider: "webull", tokenExpiry: tokens.expiresAt });
});

const mockLinkSchema = z.object({
  providerId: z.enum(["paper", "manual"])
});

router.post("/mock-link", requireAuth, (req, res) => {
  const parsed = mockLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  if (parsed.data.providerId === "paper") {
    const linked = paperTradingService.linkPaperAccount((req as AuthRequest).user!.userId);
    return res.json({
      linked: true,
      provider: "paper",
      message: linked.alreadyLinked
        ? "Paper brokerage already linked."
        : "Paper brokerage linked for development.",
      cashBalance: linked.cashBalance
    });
  }
  return res.json({
    linked: true,
    provider: parsed.data.providerId,
    message: "Mock brokerage linked for development."
  });
});

export default router;
