/**
 * Script to delete all products from Sanity
 * Run with: npm run delete-products
 */

import { createClient } from "next-sanity";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!token) {
  console.error("❌ SANITY_API_WRITE_TOKEN is not defined in environment variables");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
});

async function deleteAllProducts() {
  console.log("🔍 Fetching all products...");

  const products = await client.fetch<Array<{ _id: string; name: string }>>(
    `*[_type == "products"] { _id, name }`
  );

  if (products.length === 0) {
    console.log("✅ No products found. Nothing to delete.");
    return;
  }

  console.log(`\n📋 Found ${products.length} product(s) to delete:\n`);
  products.forEach((product, index) => {
    console.log(`  ${index + 1}. ${product.name} (${product._id})`);
  });

  console.log("\n⚠️  WARNING: This will permanently delete all products from Sanity!");
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");

  // Wait 5 seconds before proceeding
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("🗑️  Starting deletion...\n");

  let deletedCount = 0;
  for (const product of products) {
    try {
      await client.delete(product._id);
      console.log(`  ✅ Deleted: ${product.name}`);
      deletedCount++;
    } catch (error) {
      console.error(`  ❌ Failed to delete ${product.name}:`, error);
    }
  }

  console.log(`\n✅ Successfully deleted ${deletedCount} out of ${products.length} product(s)`);
}

deleteAllProducts()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
