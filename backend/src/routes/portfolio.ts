import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { BrokerageService } from "../services/brokerageService.js";
import type { AuthRequest } from "../types.js";

const router = Router();
const brokerageService = new BrokerageService();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const portfolio = await brokerageService.getPortfolio(req.user!.userId);
  return res.json(portfolio);
});

router.get("/transactions", requireAuth, async (req: AuthRequest, res) => {
  const transactions = await brokerageService.getTransactions(req.user!.userId);
  return res.json(transactions);
});

export default router;
