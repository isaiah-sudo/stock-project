import type { Portfolio, Transaction } from "@stock/shared";

export const mockPortfolio: Portfolio = {
  accountId: "demo-account",
  cashBalance: 12500.42,
  totalValue: 85420.67,
  dayChangePct: 1.26,
  holdings: [
    { symbol: "AAPL", name: "Apple Inc.", quantity: 35, averageCost: 168.22, currentPrice: 191.43, changePct: 0.87 },
    { symbol: "MSFT", name: "Microsoft Corp.", quantity: 20, averageCost: 322.11, currentPrice: 414.67, changePct: 1.14 },
    { symbol: "NVDA", name: "NVIDIA Corp.", quantity: 14, averageCost: 662.54, currentPrice: 904.12, changePct: 2.31 }
  ]
};

export const mockTransactions: Transaction[] = [
  { id: "tx_1", symbol: "AAPL", side: "buy", quantity: 10, price: 179.03, occurredAt: "2026-03-12T14:09:00.000Z" },
  { id: "tx_2", symbol: "MSFT", side: "buy", quantity: 5, price: 402.71, occurredAt: "2026-03-11T17:20:00.000Z" },
  { id: "tx_3", symbol: "NVDA", side: "buy", quantity: 4, price: 872.11, occurredAt: "2026-03-08T16:02:00.000Z" }
];
