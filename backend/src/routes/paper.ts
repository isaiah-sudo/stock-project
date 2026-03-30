import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { paperTradingService } from "../services/paperTradingService.js";
import type { AuthRequest } from "../types.js";

const router = Router();

router.post("/link", requireAuth, async (req: AuthRequest, res) => {
  const result = await paperTradingService.linkPaperAccount(req.user!.userId);
  return res.json({
    linked: true,
    provider: "paper",
    alreadyLinked: result.alreadyLinked,
    cashBalance: result.cashBalance
  });
});

router.get("/portfolio", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const portfolio = await paperTradingService.getPortfolio(userId);
  if (!portfolio) {
    return res.status(404).json({ error: "Paper account not linked." });
  }
  return res.json(portfolio);
});

router.get("/achievements", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const achievements = await paperTradingService.getAchievements(userId);
  return res.json(achievements);
});

router.get("/transactions", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const transactions = await paperTradingService.getTransactions(userId);
  return res.json(transactions || []);
});

router.get("/symbols", requireAuth, (_req, res) => {
  return res.json({ 
    symbols: paperTradingService.getSupportedSymbols(),
    metadata: paperTradingService.getSupportedMetadata()
  });
});

router.get("/market-status", (_req, res) => {
  return res.json({ open: paperTradingService.isMarketOpen() });
});

const quoteSchema = z.object({
  symbol: z.string().min(1)
});

router.get("/quote", requireAuth, async (req, res) => {
  const parsed = quoteSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const quote = await paperTradingService.getQuote(parsed.data.symbol);
  if (!quote) {
    return res.status(400).json({ error: "Unsupported symbol for paper trading." });
  }
  return res.json(quote);
});

const orderSchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(["buy", "sell"]),
  quantity: z.number().int().positive()
});

router.post("/order", requireAuth, async (req: AuthRequest, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const result = await paperTradingService.placeOrder({
    userId: req.user!.userId,
    symbol: parsed.data.symbol,
    side: parsed.data.side,
    quantity: parsed.data.quantity
  });
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  return res.json(result);
});

export default router;
