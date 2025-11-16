/**
 * Script to manually sync all Stripe products to Sanity
 * Run with: tsx scripts/sync-stripe-products.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local FIRST before any other imports
config({ path: resolve(process.cwd(), ".env.local") });

import Stripe from "stripe";
import { syncStripeProductToSanity } from "../src/sanity/lib/products";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error("❌ STRIPE_SECRET_KEY is not defined in environment variables");
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia",
});

async function syncAllProducts() {
  console.log("🔍 Fetching all active products from Stripe...\n");

  const products = await stripe.products.list({
    limit: 100,
    active: true,
  });

  if (products.data.length === 0) {
    console.log("✅ No active products found in Stripe.");
    return;
  }

  console.log(`📋 Found ${products.data.length} active product(s) to sync:\n`);
  products.data.forEach((product, index) => {
    console.log(`  ${index + 1}. ${product.name} (${product.id})`);
  });

  console.log("\n🔄 Starting sync to Sanity...\n");

  let syncedCount = 0;
  for (const product of products.data) {
    try {
      await syncStripeProductToSanity(product);
      console.log(`  ✅ Synced: ${product.name}\n`);
      syncedCount++;
    } catch (error) {
      console.error(`  ❌ Failed to sync ${product.name}:`, error);
    }
  }

  console.log(`\n✅ Successfully synced ${syncedCount} out of ${products.data.length} product(s)`);
}

syncAllProducts()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
