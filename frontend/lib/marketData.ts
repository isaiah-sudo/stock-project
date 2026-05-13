export type LiveQuote = {
  symbol: string;
  name: string;
  currentPrice: number;
  changePct: number;
  source?: string;
  asOf?: string;
};

const quoteCache = new Map<string, { quote: LiveQuote; cachedAt: number }>();
const QUOTE_TTL_MS = 15_000;

export async function fetchLiveQuote(symbol: string): Promise<LiveQuote | null> {
  const normalized = symbol.toUpperCase().trim();
  const cached = quoteCache.get(normalized);
  if (cached && Date.now() - cached.cachedAt < QUOTE_TTL_MS) {
    return cached.quote;
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(normalized)}&apikey=${apiKey}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    "Global Quote"?: {
      "05. price"?: string;
      "10. change percent"?: string;
    };
  };

  const quote = payload["Global Quote"];
  const price = Number(quote?.["05. price"]);
  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  const changePctRaw = quote?.["10. change percent"] ?? "0%";
  const changePct = Number(changePctRaw.replace("%", "").trim());
  const liveQuote: LiveQuote = {
    symbol: normalized,
    name: normalized,
    currentPrice: Number(price.toFixed(2)),
    changePct: Number((Number.isFinite(changePct) ? changePct : 0).toFixed(2)),
    source: "alpha_vantage",
    asOf: new Date().toISOString()
  };

  quoteCache.set(normalized, {
    quote: liveQuote,
    cachedAt: Date.now()
  });

  return liveQuote;
}
