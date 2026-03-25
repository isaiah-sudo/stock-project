import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../types.js";

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = authHeader.slice("Bearer ".length);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string; email: string };
    req.user = { userId: decoded.userId, email: decoded.email };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
