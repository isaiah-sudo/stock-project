import { PrismaClient } from "@prisma/client";
import { getPortfolioPreset } from "@stock/shared";

type CliOptions = {
  userId?: string;
  email?: string;
  apply: boolean;
  restoreFromModern: boolean;
  sourcePreset: string;
};

const prisma = new PrismaClient({
  log: ["error", "warn"]
});

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    apply: false,
    restoreFromModern: true,
    sourcePreset: "standard"
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.apply = false;
      continue;
    }

    if (arg === "--no-restore-from-modern") {
      options.restoreFromModern = false;
      continue;
    }

    if (arg === "--userId" || arg === "--user-id") {
      options.userId = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === "--email") {
      options.email = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === "--source-preset") {
      options.sourcePreset = argv[i + 1] ?? options.sourcePreset;
      i += 1;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const preset = getPortfolioPreset(options.sourcePreset);

  if (!options.userId && !options.email) {
    console.error("Usage: npm run restore:legacy -- --email user@example.com [--apply]");
    console.error("   or: npm run restore:legacy -- --userId <id> [--apply]");
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findFirst({
    where: options.userId ? { id: options.userId } : { email: options.email },
    include: {
      paperAccount: {
        include: {
          positions: true,
          transactions: true
        }
      },
      paperPortfolios: {
        include: {
          positions: true,
          transactions: true,
          snapshots: true
        }
      },
      portfolioSnapshots: true
    }
  });

  if (!user) {
    console.error("No user found for that identifier.");
    process.exitCode = 1;
    return;
  }

  const hasLegacyData = Boolean(user.paperAccount);
  const hasModernData = user.paperPortfolios.length > 0;

  const modernPortfolioSummary = user.paperPortfolios.map((portfolio) => ({
    preset: portfolio.preset,
    positions: portfolio.positions.length,
    transactions: portfolio.transactions.length,
    snapshots: portfolio.snapshots.length
  }));

  console.log("Target user:", {
    id: user.id,
    email: user.email,
    hasLegacyData,
    hasModernData,
    modernPortfolioSummary
  });

  if (!hasLegacyData && !hasModernData) {
    console.log("Nothing to restore. This account has no legacy or modern portfolio data.");
    return;
  }

  const sourceModernPortfolio = user.paperPortfolios.find((portfolio) => portfolio.preset === preset.id)
    ?? user.paperPortfolios.find((portfolio) => portfolio.preset === "standard")
    ?? user.paperPortfolios[0];

  const actions: string[] = [];
  if (!hasLegacyData && options.restoreFromModern && sourceModernPortfolio) {
    actions.push(`create legacy paperAccount from ${sourceModernPortfolio.preset}`);
    actions.push("copy positions/transactions/snapshots into legacy tables");
  }

  if (hasModernData) {
    actions.push("remove modern paperPortfolios so the account falls back to legacy mode");
  }

  if (!hasLegacyData && !options.restoreFromModern) {
    console.error("Refusing to remove the modern portfolios because there is no legacy account to fall back to.");
    console.error("Re-run with --apply only after allowing restore-from-modern, or point this at a user who still has legacy data.");
    process.exitCode = 1;
    return;
  }

  if (!options.apply) {
    console.log("Dry run only. Planned actions:");
    for (const action of actions) {
      console.log(`- ${action}`);
    }
    console.log("Re-run with --apply to make the changes.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (!hasLegacyData && options.restoreFromModern && sourceModernPortfolio) {
      const createdAccount = await tx.paperAccount.create({
        data: {
          userId: user.id,
          cashBalance: sourceModernPortfolio.cashBalance,
          linked: sourceModernPortfolio.linked
        }
      });

      for (const position of sourceModernPortfolio.positions) {
        await tx.paperPosition.create({
          data: {
            userId: createdAccount.userId,
            symbol: position.symbol,
            name: position.name,
            quantity: position.quantity,
            averageCost: position.averageCost
          }
        });
      }

      for (const transaction of sourceModernPortfolio.transactions) {
        await tx.paperTransaction.create({
          data: {
            userId: createdAccount.userId,
            symbol: transaction.symbol,
            side: transaction.side,
            quantity: transaction.quantity,
            price: transaction.price,
            occurredAt: transaction.occurredAt
          }
        });
      }

      for (const snapshot of sourceModernPortfolio.snapshots) {
        await tx.portfolioSnapshot.create({
          data: {
            userId: createdAccount.userId,
            totalMarketValue: snapshot.totalMarketValue,
            timestamp: snapshot.timestamp
          }
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          portfolioPreset: sourceModernPortfolio.preset
        }
      });
    }

    if (hasModernData) {
      await tx.paperPortfolio.deleteMany({
        where: { userId: user.id }
      });
    }
  });

  console.log("Restore complete.");
  console.log("The account now uses the legacy single-portfolio path again.");
}

main()
  .catch((error) => {
    console.error("Restore failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
