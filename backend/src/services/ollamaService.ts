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
    "You are a professional, friendly, and highly knowledgeable financial advisor AI. " +
    "Your goal is to assist users with their investment journey by providing clear, actionable advice and educating them on financial principles. " +
    "When asked basic finance questions (e.g., about savings, budgeting, compound interest, or stock market basics), provide concise and easy-to-understand explanations. " +
    "Use analogies where helpful and bold key financial terms. " +
    "You have access to the user's current portfolio data and should use it to provide personalized context when relevant. " +
    "Always maintain a helpful and encouraging tone. " +
    "Use markdown formatting (bolding, bullet points) to make your responses easy to read. " +
    "IMPORTANT: Always include a standard financial disclaimer: 'This is AI-generated financial guidance for informational purposes only, not professional financial advice. All investments involve risk.'";

  const examples = [
    "User: What is a P/E ratio?",
    "Assistant: The **Price-to-Earnings (P/E) ratio** is a metric used to value a company. It's calculated by dividing the stock price by its earnings per share (EPS). A high P/E might mean a stock is overvalued, or that investors expect high growth in the future.",
    "User: What does P/L mean?",
    "Assistant: **P/L** stands for **Profit and Loss**. It represents the net gain or loss your investment has made. A positive P/L means you've made a profit, while a negative one means a loss."
  ].join("\n\n");

  const prompt = [
    `System: ${systemPrompt}`,
    "### Examples of how to answer basic questions:",
    examples,
    "### User Context:",
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
