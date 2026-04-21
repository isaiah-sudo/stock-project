import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { paperTradingService } from "../services/paperTradingService.js";
import type { AuthRequest } from "../types.js";
import type { TradePreviewRequest } from "@stock/shared";

const router = Router();

router.post("/link", requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await paperTradingService.linkPaperAccount(req.user!.userId);
    return res.json({
      linked: true,
      provider: "paper",
      alreadyLinked: result.alreadyLinked,
      cashBalance: result.cashBalance
    });
  } catch (err) {
    console.error("Paper account link error:", err);
    return res.status(500).json({ error: "Failed to link paper account" });
  }
});

router.get("/portfolio", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const portfolio = await paperTradingService.getPortfolio(userId);
    if (!portfolio) {
      return res.status(404).json({ error: "Paper account not linked." });
    }
    return res.json(portfolio);
  } catch (err) {
    console.error("Paper portfolio fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch paper portfolio" });
  }
});

router.get("/achievements", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const achievements = await paperTradingService.getAchievements(userId);
    return res.json(achievements);
  } catch (err) {
    console.error("Achievements fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

router.get("/transactions", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const transactions = await paperTradingService.getTransactions(userId);
    return res.json(transactions || []);
  } catch (err) {
    console.error("Transactions fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
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

const previewSchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(["buy", "sell"]),
  quantity: z.number().int().positive(),
  orderType: z.enum(["market", "limit", "stop"]).optional(),
  limitPrice: z.number().optional(),
  stopPrice: z.number().optional()
});

router.post("/preview", requireAuth, async (req: AuthRequest, res) => {
  try {
    const parsed = previewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const preview = await paperTradingService.getTradePreview(req.user!.userId, parsed.data as TradePreviewRequest);
    return res.json(preview);
  } catch (err) {
    console.error("Trade preview error:", err);
    return res.status(500).json({ error: "Failed to generate trade preview" });
  }
});

router.get("/coach", requireAuth, async (req: AuthRequest, res) => {
  try {
    const coaching = await paperTradingService.getPortfolioCoaching(req.user!.userId);
    if (!coaching) {
      return res.status(404).json({ error: "Portfolio coaching not available" });
    }
    return res.json(coaching);
  } catch (err) {
    console.error("Portfolio coaching error:", err);
    return res.status(500).json({ error: "Failed to fetch portfolio coaching" });
  }
});

router.get("/challenges", requireAuth, async (_req: AuthRequest, res) => {
  try {
    const challenges = paperTradingService.getLearningChallenges();
    return res.json(challenges);
  } catch (err) {
    console.error("Learning challenges error:", err);
    return res.status(500).json({ error: "Failed to fetch learning challenges" });
  }
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
