import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthRequest } from "../types.js";
import * as shared from "@stock/shared";
import { buildStarterPortfolio } from "../services/portfolioSeed.js";
import { createVerificationToken, sendVerificationEmail } from "../services/emailService.js";
import { paperTradingService } from "../services/paperTradingService.js";

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  portfolioPreset: z.string().optional()
});

const JWT_SECRET = process.env.JWT_SECRET || "gamified-simulator-secret-key-123";

router.post("/signup", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password, portfolioPreset } = parsed.data;
  const preset = shared.getPortfolioPreset(portfolioPreset);

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "That email is already in the clubhouse." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const verificationToken = createVerificationToken();
    const verificationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const starter = await buildStarterPortfolio(preset.id, (symbol) => paperTradingService.getQuote(symbol));

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          experiencePoints: 0,
          portfolioPreset: preset.id,
          emailVerificationToken: verificationToken,
          emailVerificationExpiresAt: verificationExpiresAt,
          emailVerifiedAt: null
        }
      });

      await tx.paperAccount.create({
        data: {
          userId: newUser.id,
          cashBalance: starter.cashBalance,
          linked: true
        }
      });

      for (const position of starter.positions) {
        await tx.paperPosition.create({
          data: {
            userId: newUser.id,
            symbol: position.symbol,
            name: position.name,
            quantity: position.quantity,
            averageCost: position.averageCost
          }
        });
      }

      return newUser;
    });

    sendVerificationEmail({
      email,
      verificationToken,
      presetName: preset.name
    }).catch((error) => {
      console.error("Verification email failed:", error);
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        exp: user.experiencePoints,
        portfolioPreset: preset.id,
        emailVerified: false
      },
      onboarding: {
        preset: preset.id,
        verificationRequired: true
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Signup hit a snag. Try again in a sec." });
  }
});

router.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Nope. That login doesn't exist." });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ error: "Nope. Password goblin says try again." });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        exp: user.experiencePoints,
        portfolioPreset: user.portfolioPreset,
        emailVerified: Boolean(user.emailVerifiedAt)
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login went sideways. Try again." });
  }
});

router.post("/verify-email", async (req, res) => {
  const schema = z.object({ token: z.string().min(10) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: parsed.data.token,
      emailVerificationExpiresAt: { gt: new Date() }
    }
  });

  if (!user) {
    return res.status(400).json({ error: "That link is stale. Please ask for a fresh one." });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null
    }
  });

  return res.json({ ok: true, message: "Email verified. Your account is officially less sketchy." });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        experiencePoints: true,
        createdAt: true,
        portfolioPreset: true,
        emailVerifiedAt: true,
        lastPortfolioDigestSentAt: true
      }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: "Couldn't fetch user info." });
  }
});

export default router;
