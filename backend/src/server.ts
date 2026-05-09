import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import brokerageRoutes from "./routes/brokerage.js";
import portfolioRoutes from "./routes/portfolio.js";
import chatRoutes from "./routes/chat.js";
import paperRoutes from "./routes/paper.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import cronRoutes from "./routes/cron.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const host = process.env.BACKEND_HOST?.trim() || "0.0.0.0";

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    process.env.PUBLIC_APP_URL,
    ...(process.env.CORS_ORIGINS?.split(",") ?? []),
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim())
    .filter(Boolean)
);

// Required for express-rate-limit to work behind Fly and other proxies.
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      try {
        const parsed = new URL(origin);
        if (allowedOrigins.has(`${parsed.protocol}//${parsed.host}`)) {
          return callback(null, true);
        }
      } catch {
        // ignore malformed origins
      }

      if (/^https?:\/\/\d+\.\d+\.\d+\.\d+:3000$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/brokerage", brokerageRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/paper", paperRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/cron", cronRoutes);

app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend ready at http://${host}:${port}`);
  // eslint-disable-next-line no-console
  console.log("API endpoints available at /api/*");
});

export { app };
