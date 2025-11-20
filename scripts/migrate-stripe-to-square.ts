/**
 * Migrate Products from Stripe to Square
 *
 * This script reads all products from Stripe and creates them in Square
 * with corresponding variations, prices, and inventory.
 *
 * Usage: npx tsx scripts/migrate-stripe-to-square.ts
 */

import { config } from "dotenv";
import { Currency, SquareClient, SquareEnvironment } from "square";
import Stripe from "stripe";

config({ path: ".env.local" });

// Initialize clients
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.NODE_ENV === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

const locationId = process.env.SQUARE_LOCATION_ID!;

interface MigrationResult {
  stripeProductId: string;
  stripeProductName: string;
  squareItemId?: string;
  success: boolean;
  error?: string;
}

async function migrateProduct(
  product: Stripe.Product,
): Promise<MigrationResult> {
  const result: MigrationResult = {
    stripeProductId: product.id,
    stripeProductName: product.name,
    success: false,
  };

  try {
    // Fetch all prices for this product
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100,
    });

    if (prices.data.length === 0) {
      result.error = "No active prices found";
      return result;
    }

    // Create variations from Stripe prices
    const variations = prices.data.map((price, index) => {
      const nickname = price.nickname || `Variation ${index + 1}`;
      return {
        type: "ITEM_VARIATION" as const,
        id: `#variation_${index}`,
        itemVariationData: {
          name: nickname,
          pricingType: "FIXED_PRICING" as const,
          priceMoney: {
            amount: BigInt(price.unit_amount || 0),
            currency: price.currency.toUpperCase() as Currency,
          },
          trackInventory: true,
          sellable: true,
          stockable: true,
        },
      };
    });

    // Create the item in Square
    const catalogResult = await square.catalog.object.upsert({
      idempotencyKey: `migrate-${product.id}-${Date.now()}`,
      object: {
        type: "ITEM",
        id: `#item_${product.id}`,
        itemData: {
          name: product.name,
          description: product.description || undefined,
          variations,
        },
      },
    });

    const squareItem = catalogResult.catalogObject;
    if (!squareItem?.id || squareItem.type !== "ITEM" || !squareItem.itemData) {
      result.error = "Failed to create Square item";
      return result;
    }

    const itemData = squareItem.itemData;
    result.squareItemId = squareItem.id;

    const inferContentType = (url: string, headerType?: string) => {
      if (headerType && headerType !== "application/octet-stream") return headerType;
      const lower = url.toLowerCase();
      if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".pjpeg")) {
        return "image/jpeg";
      }
      if (lower.endsWith(".png")) return "image/png";
      if (lower.endsWith(".gif")) return "image/gif";
      return "image/jpeg";
    };

    // Upload images if any
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        try {
          // Fetch the image
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) continue;

          const contentType = inferContentType(
            imageUrl,
            imageResponse.headers.get("content-type") || undefined,
          );
          const imageBuffer = await imageResponse.arrayBuffer();
          const imageBlob = new Blob([imageBuffer], { type: contentType });

          // Create image in Square
          const imageResult = await square.catalog.images.create({
            request: {
              idempotencyKey: `img-${product.id}-${Date.now()}-${Math.random()}`,
              image: {
                type: "IMAGE",
                id: "#image",
                imageData: {
                  name: product.name,
                  caption: product.name,
                },
              },
              objectId: squareItem.id,
            },
            imageFile: imageBlob as any,
          });

          if (imageResult.image?.id) {
            console.log(`  📷 Uploaded image for ${product.name}`);
          }
        } catch (imgError) {
          console.warn(`  ⚠️ Failed to upload image: ${imgError}`);
        }
      }
    }

    // Set inventory if available in Stripe metadata
    const stockQuantity = product.metadata?.stock
      ? parseInt(product.metadata.stock, 10)
      : 0;

    if (stockQuantity > 0 && itemData.variations) {
      // Set inventory for the first variation (base unit)
      const firstVariation = itemData.variations[0];
      if (firstVariation?.id) {
        await square.inventory.batchCreateChanges({
          idempotencyKey: `inv-${product.id}-${Date.now()}`,
          changes: [
            {
              type: "ADJUSTMENT",
              adjustment: {
                catalogObjectId: firstVariation.id,
                locationId,
                quantity: stockQuantity.toString(),
                fromState: "NONE",
                toState: "IN_STOCK",
                occurredAt: new Date().toISOString(),
              },
            },
          ],
        });
        console.log(`  📦 Set inventory: ${stockQuantity} units`);
      }
    }

    result.success = true;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    return result;
  }
}

async function main() {
  console.log("🚀 Starting Stripe to Square Migration\n");

  // Validate environment
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ STRIPE_SECRET_KEY is not set");
    process.exit(1);
  }
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    console.error("❌ SQUARE_ACCESS_TOKEN is not set");
    process.exit(1);
  }
  if (!process.env.SQUARE_LOCATION_ID) {
    console.error("❌ SQUARE_LOCATION_ID is not set");
    process.exit(1);
  }

  try {
    // Fetch all active products from Stripe
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    console.log(`📦 Found ${products.data.length} products in Stripe\n`);

    if (products.data.length === 0) {
      console.log("No products to migrate.");
      return;
    }

    // Display products
    console.log("Products to migrate:");
    products.data.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} (${product.id})`);
    });
    console.log("");

    // Migrate each product
    const results: MigrationResult[] = [];

    for (const product of products.data) {
      console.log(`\n🔄 Migrating: ${product.name}`);
      const result = await migrateProduct(product);
      results.push(result);

      if (result.success) {
        console.log(`  ✅ Success → Square ID: ${result.squareItemId}`);
      } else {
        console.log(`  ❌ Failed: ${result.error}`);
      }
    }

    // Summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`\n${"=".repeat(50)}`);
    console.log("Migration Complete!");
    console.log(`  ✅ Successful: ${successful}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`${"=".repeat(50)}\n`);

    if (failed > 0) {
      console.log("Failed products:");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  - ${r.stripeProductName}: ${r.error}`);
        });
    }

    console.log("\n📝 Next steps:");
    console.log("  1. Run: npm run sync-square-products");
    console.log("  2. Verify products in Square Dashboard");
    console.log("  3. Update inventory quantities as needed");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
