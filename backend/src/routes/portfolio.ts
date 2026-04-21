import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { BrokerageService } from "../services/brokerageService.js";
import type { AuthRequest } from "../types.js";

const router = Router();
const brokerageService = new BrokerageService();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const portfolio = await brokerageService.getPortfolio(req.user!.userId);
    return res.json(portfolio);
  } catch (err) {
    console.error("Portfolio fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

router.get("/transactions", requireAuth, async (req: AuthRequest, res) => {
  try {
    const transactions = await brokerageService.getTransactions(req.user!.userId);
    return res.json(transactions);
  } catch (err) {
    console.error("Transactions fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;
