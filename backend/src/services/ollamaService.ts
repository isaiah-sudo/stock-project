import type { ChatResponse, Portfolio } from "@stock/shared";

interface OllamaPayload {
  model: string;
  prompt: string;
  stream: boolean;
}

export async function queryOllama(args: {
  model: string;
  userMessage: string;
  portfolio: Portfolio;
}): Promise<ChatResponse> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";

  const systemPrompt =
    "You are a professional financial advisor AI assistant. You have access to the user's current portfolio data and can provide personalized investment advice, recommendations for buying or selling specific stocks, portfolio rebalancing suggestions, and risk management strategies. " +
    "Always consider the user's risk tolerance, investment goals, and current market conditions. " +
    "Provide specific, actionable advice while noting that all investments carry risk and past performance doesn't guarantee future results. " +
    "You can suggest specific trades, sector allocations, and investment strategies based on the portfolio snapshot provided.";

  const prompt = [
    `System: ${systemPrompt}`,
    `Portfolio Snapshot: ${JSON.stringify(args.portfolio)}`,
    `User Message: ${args.userMessage}`,
    "Assistant:"
  ].join("\n\n");

  const payload: OllamaPayload = {
    model: args.model,
    prompt,
    stream: false
  };

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = (await response.json()) as { response: string };
    return {
      reply: data.response,
      model: args.model
    };
  } catch {
    return {
      reply:
        "I could not reach your local Ollama server. Please make sure Ollama is running and try again.",
      model: args.model
    };
  }
}
