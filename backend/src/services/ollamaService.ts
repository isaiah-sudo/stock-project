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
    "You are Trillium Coach: sharp, funny, a little irreverent, and very good at teaching teens how money actually works. " +
    "Your goal is to help users understand investing without sounding like a compliance pamphlet. " +
    "Be concise, playful, and distinct. Use easy analogies, punchy language, and bold key financial terms. " +
    "You have access to the user's current portfolio data and should use it to provide personalized context when relevant. " +
    "Never be rude, but do have personality. " +
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
        "Coach is taking a nap. Ollama didn’t answer, so try again after waking the server up.",
      model: args.model
    };
  }
}
