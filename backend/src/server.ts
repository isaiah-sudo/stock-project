import "dotenv/config";
import { onRequest } from "firebase-functions/v2/https";
import os from "os";
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

function getLanIp(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const addr of iface) {
      if (addr.family === "IPv4" && !addr.internal && (addr.address.startsWith("192.168.") || addr.address.startsWith("10.") || addr.address.startsWith("172."))) {
        return addr.address;
      }
    }
  }
  return null;
}

const app = express();
const port = Number(process.env.PORT ?? 4000);

// Required for express-rate-limit to work behind Cloudflare or Firebase
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow localhost and 127.0.0.1
      if (origin === "http://localhost:3000" || origin === "http://127.0.0.1:3000") {
        return callback(null, true);
      }

      // Allow Firebase Hosting domains
      if (origin.endsWith(".web.app") || origin.endsWith(".firebaseapp.com")) {
        return callback(null, true);
      }

      // Allow any IP on port 3000 (for LAN access)
      const url = new URL(origin);
      if (url.port === "3000" && /^https?:\/\/\d+\.\d+\.\d+\.\d+:3000$/.test(origin)) {
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

// Only start the server locally if not running as a Cloud Function
if (process.env.NODE_ENV !== "production" && !process.env.FUNCTIONS_EMULATOR) {
  app.listen(port, "0.0.0.0", () => {
    const lanIp = getLanIp();
    // eslint-disable-next-line no-console
    console.log(`\n🚀 Backend ready at:`);
    // eslint-disable-next-line no-console
    console.log(`   Local:   http://localhost:${port}`);
    if (lanIp) {
      // eslint-disable-next-line no-console
      console.log(`   Network: http://${lanIp}:${port}`);
    }
    // eslint-disable-next-line no-console
    console.log(`\n📡 API endpoints available at /api/*`);
  });
}

// Export the Firebase Function
export const api = onRequest({ cors: true, maxInstances: 10 }, app);
