import { sequelize } from "../../configs/database.js";
import { NODE_ENV } from "../../configs/serverConfig.js";
import seedTestData from "./testData.seed.js";

async function runSeed() {
  try {
    if (NODE_ENV === "production") {
      throw new Error("Cannot run test data seed in production environment");
    }

    console.log("🚀 Starting test data seed script...");
    console.log(`📝 Environment: ${NODE_ENV || "dev"}\n`);

    await seedTestData();

    console.log("\n✅ Test data seeding completed successfully!");
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error running test data seed:", error);
    await sequelize.close();
    process.exit(1);
  }
}

runSeed();

