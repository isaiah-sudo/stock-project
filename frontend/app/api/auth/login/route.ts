import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signAuthToken } from "@/lib/auth";

export const runtime = "nodejs";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

async function ensureDemoAccount(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.$transaction(async (tx: any) => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      return existing;
    }

    const created = await tx.user.create({
      data: { email, passwordHash, experiencePoints: 0 }
    });

    await tx.paperAccount.create({
      data: {
        userId: created.id,
        cashBalance: 10000,
        linked: true
      }
    });

    return created;
  });

  return user;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password } = parsed.data;

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user && email === "demo@example.com" && password === "password123") {
      user = await ensureDemoAccount(email, password);
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({
      token: signAuthToken({ userId: user.id, email: user.email }),
      user: { id: user.id, email: user.email, exp: user.experiencePoints }
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error during login" }, { status: 500 });
  }
}
