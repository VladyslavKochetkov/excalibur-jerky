/**
 * Script to delete all products from Stripe
 * Run with: npm run delete-stripe-products
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error("❌ STRIPE_SECRET_KEY is not defined in environment variables");
  process.exit(1);
}

// Import Stripe
import Stripe from "stripe";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia",
});

async function deleteAllStripeProducts() {
  console.log("🔍 Fetching all products from Stripe...");

  const products = await stripe.products.list({
    limit: 100,
    active: true,
  });

  if (products.data.length === 0) {
    console.log("✅ No active products found in Stripe. Nothing to delete.");
    return;
  }

  console.log(`\n📋 Found ${products.data.length} active product(s) to delete:\n`);
  products.data.forEach((product, index) => {
    console.log(`  ${index + 1}. ${product.name} (${product.id})`);
  });

  console.log("\n⚠️  WARNING: This will archive (deactivate) all products in Stripe!");
  console.log("⚠️  Archived products won't be visible but can be reactivated later.");
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");

  // Wait 5 seconds before proceeding
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("📦 Starting archival...\n");

  let archivedCount = 0;
  for (const product of products.data) {
    try {
      await stripe.products.update(product.id, {
        active: false,
      });
      console.log(`  ✅ Archived: ${product.name}`);
      archivedCount++;
    } catch (error) {
      console.error(`  ❌ Failed to archive ${product.name}:`, error);
    }
  }

  console.log(`\n✅ Successfully archived ${archivedCount} out of ${products.data.length} product(s)`);
}

deleteAllStripeProducts()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
