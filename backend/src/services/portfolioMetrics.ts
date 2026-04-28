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

  // Dollar change today: sum of (currentPrice - previousClose) * quantity for each holding.
  // previousClose is derived from the stock's daily changePct.
  const dayChangeDollar = Number(
    args.holdings
      .reduce((sum, h) => {
        // previousClose = currentPrice / (1 + changePct/100)
        const previousClose = h.changePct !== -100
          ? h.currentPrice / (1 + h.changePct / 100)
          : h.currentPrice;
        return sum + (h.currentPrice - previousClose) * h.quantity;
      }, 0)
      .toFixed(2)
  );

  const previousTotalValue = totalValue - dayChangeDollar;
  const dayChangePct =
    previousTotalValue > 0 ? Number(((dayChangeDollar / previousTotalValue) * 100).toFixed(2)) : 0;

  return { holdingsValue, totalValue, dayChangePct, dayChangeDollar };
}
