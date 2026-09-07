import { loadEnvConfig } from "@next/env";
import { ensureIndexes, getDb } from "@ufo/database";
import { products, variants, inventoryItems } from "@ufo/domain";

// Explicit operator command: additive only. Never use the destructive seed for this migration.
loadEnvConfig(process.cwd());
async function main() {
  const db = await getDb();
  await ensureIndexes(db);
  for (const [name, documents] of [
    ["products", products],
    ["productVariants", variants],
    ["inventoryItems", inventoryItems],
  ] as const) {
    const result = await db.collection(name).bulkWrite(
      documents.map((document) => ({
        updateOne: {
          filter: { id: document.id },
          update: { $setOnInsert: document },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    console.log(`${name}: ${result.upsertedCount} missing records added`);
  }
  console.log("Catalog migration complete. Existing overrides and deleted records were preserved.");
}
main()
  .then(() => process.exit(0))
  .catch(() => {
    console.error(
      "Catalog migration failed. Check database access and index constraints; no credentials are logged.",
    );
    process.exit(1);
  });
