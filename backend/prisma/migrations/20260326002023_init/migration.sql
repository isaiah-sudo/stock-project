-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_accounts" (
    "userId" TEXT NOT NULL,
    "cashBalance" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "linked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paper_accounts_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "paper_positions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "averageCost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "paper_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "paper_positions_userId_symbol_key" ON "paper_positions"("userId", "symbol");

-- AddForeignKey
ALTER TABLE "paper_positions" ADD CONSTRAINT "paper_positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "paper_accounts"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_transactions" ADD CONSTRAINT "paper_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "paper_accounts"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
