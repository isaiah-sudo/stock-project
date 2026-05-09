CREATE TABLE IF NOT EXISTS "paper_portfolios" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "preset" TEXT NOT NULL,
  "cashBalance" DOUBLE PRECISION NOT NULL DEFAULT 10000,
  "linked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "paper_portfolios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "paper_portfolios_userId_preset_key" ON "paper_portfolios"("userId", "preset");

ALTER TABLE "paper_portfolios"
  ADD CONSTRAINT "paper_portfolios_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "paper_positions_v2" (
  "id" TEXT NOT NULL,
  "portfolioId" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "averageCost" DOUBLE PRECISION NOT NULL,

  CONSTRAINT "paper_positions_v2_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "paper_positions_v2_portfolioId_symbol_key" ON "paper_positions_v2"("portfolioId", "symbol");

ALTER TABLE "paper_positions_v2"
  ADD CONSTRAINT "paper_positions_v2_portfolioId_fkey"
  FOREIGN KEY ("portfolioId") REFERENCES "paper_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "paper_transactions_v2" (
  "id" TEXT NOT NULL,
  "portfolioId" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "side" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "paper_transactions_v2_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "paper_transactions_v2_portfolioId_occurredAt_idx" ON "paper_transactions_v2"("portfolioId", "occurredAt" DESC);

ALTER TABLE "paper_transactions_v2"
  ADD CONSTRAINT "paper_transactions_v2_portfolioId_fkey"
  FOREIGN KEY ("portfolioId") REFERENCES "paper_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "portfolio_snapshots_v2" (
  "id" TEXT NOT NULL,
  "portfolioId" TEXT NOT NULL,
  "totalMarketValue" DOUBLE PRECISION NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "portfolio_snapshots_v2_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "portfolio_snapshots_v2_portfolioId_timestamp_idx" ON "portfolio_snapshots_v2"("portfolioId", "timestamp" DESC);

ALTER TABLE "portfolio_snapshots_v2"
  ADD CONSTRAINT "portfolio_snapshots_v2_portfolioId_fkey"
  FOREIGN KEY ("portfolioId") REFERENCES "paper_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
