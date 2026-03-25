import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { BrokerageService } from "../services/brokerageService.js";
import { queryOllama } from "../services/ollamaService.js";
import type { AuthRequest } from "../types.js";

const router = Router();
const brokerageService = new BrokerageService();

const chatSchema = z.object({
  message: z.string().min(1).max(3000),
  accountId: z.string().min(1),
  model: z.string().optional()
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const model = parsed.data.model ?? process.env.OLLAMA_DEFAULT_MODEL ?? "llama3";
  const portfolio = await brokerageService.getPortfolio(req.user!.userId);
  const aiResult = await queryOllama({
    model,
    userMessage: parsed.data.message,
    portfolio
  });

  return res.json(aiResult);
});

export default router;
