import { Router } from "express";
import { paperTradingService } from "../services/paperTradingService.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rankings = await paperTradingService.getLeaderboard();
    return res.json(rankings);
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
