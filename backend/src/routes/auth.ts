import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import type { AuthRequest } from "../types.js";

const router = Router();
const prisma = new PrismaClient();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const JWT_SECRET = process.env.JWT_SECRET || "gamified-simulator-secret-key-123";

router.post("/signup", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user and paper account in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          experiencePoints: 0
        }
      });

      await tx.paperAccount.create({
        data: {
          userId: newUser.id,
          cashBalance: 10000,
          linked: true
        }
      });

      return newUser;
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
    return res.status(201).json({ token, user: { id: user.id, email: user.email, exp: user.experiencePoints } });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Error creating account" });
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
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
    return res.json({ token, user: { id: user.id, email: user.email, exp: user.experiencePoints } });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Error during login" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, experiencePoints: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: "Error fetching user info" });
  }
});

export default router;
