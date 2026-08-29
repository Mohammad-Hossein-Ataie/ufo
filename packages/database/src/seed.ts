import { getDb, hasUsableMongoUri, seedDatabase } from "./index.js";
import { seedData } from "@ufo/domain";

async function main() {
  if (!hasUsableMongoUri()) {
    console.log("MONGODB_URI تنظیم نشده است؛ seed واقعی انجام نشد.");
    console.log(
      JSON.stringify(
        {
          products: seedData.products.length,
          variants: seedData.variants.length,
          inventoryItems: seedData.inventoryItems.length,
        },
        null,
        2,
      ),
    );
    return;
  }

  const db = await getDb();
  await seedDatabase(db);
  console.log("Seed با موفقیت انجام شد.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
