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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.$transaction(async (tx: any) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          experiencePoints: 0
        }
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

    return NextResponse.json(
      {
        token: signAuthToken({ userId: user.id, email: user.email }),
        user: { id: user.id, email: user.email, exp: user.experiencePoints }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Error creating account" }, { status: 500 });
  }
}
