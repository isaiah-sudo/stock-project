DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS timescaledb;
EXCEPTION
    WHEN insufficient_privilege OR undefined_file THEN NULL;
END $$;

-- CreateTable
CREATE TABLE "portfolio_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalMarketValue" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portfolio_snapshots_userId_timestamp_idx" ON "portfolio_snapshots"("userId", "timestamp" DESC);

-- AddForeignKey
ALTER TABLE "portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DO $$
BEGIN
    PERFORM create_hypertable('portfolio_snapshots', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE);
EXCEPTION
    WHEN undefined_function OR feature_not_supported THEN NULL;
END $$;
