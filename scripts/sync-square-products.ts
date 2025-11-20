/**
 * Sync Square Products to Sanity
 * Manually sync all active items from Square to Sanity
 *
 * Usage: npm run sync-square-products
 */

import { SquareClient, Environment } from "square";
import { syncSquareProductToSanity } from "../src/sanity/lib/products";

async function main() {
  console.log("🔄 Starting Square to Sanity sync...\n");

  // Initialize Square client
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("❌ SQUARE_ACCESS_TOKEN is not set");
    process.exit(1);
  }

  const client = new SquareClient({
    token: accessToken,
    environment:
      process.env.NODE_ENV === "production"
        ? Environment.Production
        : Environment.Sandbox,
  });

  try {
    // Fetch all items from Square catalog
    const { result } = await client.catalog.listCatalog({
      types: ["ITEM"],
    });

    const items = result.objects || [];
    console.log(`📦 Found ${items.length} items in Square catalog\n`);

    if (items.length === 0) {
      console.log("No items to sync.");
      return;
    }

    // Display items
    console.log("Items to sync:");
    items.forEach((item, index) => {
      const variations = item.itemData?.variations || [];
      console.log(
        `  ${index + 1}. ${item.itemData?.name} (${variations.length} variations)`
      );
    });
    console.log("");

    // Sync each item to Sanity
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        await syncSquareProductToSanity(item);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to sync ${item.itemData?.name}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ Sync complete!`);
    console.log(`   - Successfully synced: ${successCount}`);
    console.log(`   - Failed: ${errorCount}`);
  } catch (error) {
    console.error("❌ Error during sync:", error);
    process.exit(1);
  }
}

main();
