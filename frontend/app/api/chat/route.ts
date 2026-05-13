import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { brokerageService } from "@/lib/brokerageService";
import { queryOllama } from "@/lib/ollamaService";

export const runtime = "nodejs";

const chatSchema = z.object({
  message: z.string().min(1).max(3000),
  accountId: z.string().min(1),
  model: z.string().optional()
});

export async function POST(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const model = parsed.data.model ?? process.env.OLLAMA_DEFAULT_MODEL ?? "llama3";
  const portfolio = await brokerageService.getPortfolio(auth.userId);
  if (!portfolio) {
    return NextResponse.json({ error: "Paper account is not linked." }, { status: 404 });
  }

  const aiResult = await queryOllama({
    model,
    userMessage: parsed.data.message,
    portfolio
  });

  return NextResponse.json(aiResult);
}
