import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  // Demo-only login shortcut with hashed placeholder.
  const email = parsed.data.email;
  const validHash = await bcrypt.hash("password123", 10);
  const passwordOk = await bcrypt.compare(parsed.data.password, validHash);
  if (!passwordOk) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server missing JWT_SECRET" });
  }

  const token = jwt.sign({ userId: "demo-user", email }, secret, { expiresIn: "1h" });
  return res.json({ token, user: { id: "demo-user", email } });
});

export default router;
