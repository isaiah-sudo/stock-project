/**
 * Portfolio-level return based on cost basis vs current price.
 * Cash is treated as 0% return so the headline % reflects the full account gain/loss.
 */
export function computePortfolioDayMetrics(args: {
  cashBalance: number;
  holdings: Array<{ quantity: number; currentPrice: number; averageCost: number }>;
}) {
  const holdingsValue = args.holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
  const totalValue = Number((args.cashBalance + holdingsValue).toFixed(2));

  const holdingsReturnPct =
    holdingsValue > 0
      ? Number(
          (
            args.holdings.reduce(
              (sum, h) => {
                const pctGain = (h.currentPrice - h.averageCost) / h.averageCost;
                return sum + h.quantity * h.currentPrice * pctGain;
              },
              0
            ) / holdingsValue
          ).toFixed(2)
        )
      : 0;

  // Portfolio return based on cost basis, not daily quote change.
  const dayChangePct = holdingsReturnPct;

  // Dollar change based on cost basis return
  const dayChangeDollar = Number(
    args.holdings
      .reduce((sum, h) => {
        const mv = h.quantity * h.currentPrice;
        const costBasisValue = h.quantity * h.averageCost;
        return sum + (mv - costBasisValue);
      }, 0)
      .toFixed(2)
  );

  return { holdingsValue, totalValue, dayChangePct, dayChangeDollar };
}
