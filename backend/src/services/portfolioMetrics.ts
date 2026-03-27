/**
 * Portfolio-level return based on cost basis vs current price.
 * Cash is treated as 0% return so the headline % reflects the full account gain/loss.
 */
export function computePortfolioDayMetrics(args: {
  cashBalance: number;
  holdings: Array<{ quantity: number; currentPrice: number; averageCost: number; changePct: number }>;
}) {
  const holdingsValue = args.holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
  const totalValue = Number((args.cashBalance + holdingsValue).toFixed(2));

  // Dollar change based on daily changePct, but adjusted for the user's actual holding period today.
  const dayChangeDollar = Number(
    args.holdings
      .reduce((sum, h) => {
        const currentMv = h.quantity * h.currentPrice;
        // previousQuotePrice = currentPrice / (1 + changePct/100)
        const previousQuotePrice = h.currentPrice / (1 + h.changePct / 100);
        
        // If the stock is up today, we only count gains above our average cost.
        // If the stock is down today, we only count losses below our average cost.
        // This makes "Day Change" consistent with "Total Value" for new positions.
        const dayStartPrice = h.changePct >= 0 
          ? Math.max(previousQuotePrice, h.averageCost)
          : Math.min(previousQuotePrice, h.averageCost);
          
        const previousMv = h.quantity * dayStartPrice;
        return sum + (currentMv - previousMv);
      }, 0)
      .toFixed(2)
  );

  const previousTotalValue = totalValue - dayChangeDollar;
  const dayChangePct =
    previousTotalValue > 0 ? Number(((dayChangeDollar / previousTotalValue) * 100).toFixed(2)) : 0;

  return { holdingsValue, totalValue, dayChangePct, dayChangeDollar };
}
