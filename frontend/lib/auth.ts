import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

export type AuthUser = {
  userId: string;
  email: string;
};

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signAuthToken(user: AuthUser) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "24h" });
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = header.slice("Bearer ".length);
    return jwt.verify(token, getJwtSecret()) as AuthUser;
  } catch {
    return null;
  }
}
