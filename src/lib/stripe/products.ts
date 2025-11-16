/**
 * Stripe Products Utility
 * Functions for fetching products and inventory from Stripe
 */

import type Stripe from "stripe";
import { stripe } from "./client";

export interface StripePriceVariant {
  priceId: string;
  nickname: string | null;
  amount: number; // in cents
  currency: string;
  baseUnits: number; // Number of base 4oz units this represents
}

export interface StripeProductWithInventory {
  id: string;
  name: string;
  description: string | null;
  prices: StripePriceVariant[]; // Array of price variants
  currency: string;
  images: string[];
  inventory: {
    quantity: number | null; // Quantity in base units (4oz packages)
    available: boolean;
  };
  metadata: Record<string, string>;
}

/**
 * Extract base units from price metadata or nickname
 * Returns the multiplier for base units (4oz = 1, 8oz = 2, 12oz = 3, 1lb = 4)
 */
function extractBaseUnits(
  price: Stripe.Price,
  nickname: string | null,
): number {
  // First, check if metadata has base_units
  if (price.metadata?.base_units) {
    const parsed = Number.parseInt(price.metadata.base_units, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // Fallback: Try to extract from nickname
  if (nickname) {
    const lowerNickname = nickname.toLowerCase().trim();
    if (lowerNickname.includes("1 lb") || lowerNickname.includes("1lb")) {
      return 4; // 16oz = 4 x 4oz
    }
    if (lowerNickname.includes("12oz") || lowerNickname.includes("12 oz")) {
      return 3; // 12oz = 3 x 4oz
    }
    if (lowerNickname.includes("8oz") || lowerNickname.includes("8 oz")) {
      return 2; // 8oz = 2 x 4oz
    }
    if (lowerNickname.includes("4oz") || lowerNickname.includes("4 oz")) {
      return 1; // 4oz = 1 x 4oz (base unit)
    }
  }

  // Default to 1 if we can't determine
  return 1;
}

/**
 * Fetch all active products from Stripe with all their prices
 */
export async function getStripeProducts(): Promise<
  StripeProductWithInventory[]
> {
  try {
    // Fetch all active products
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    // For each product, fetch all its prices
    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        // Fetch all active prices for this product
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
          limit: 100,
        });

        // Transform prices into our format
        const priceVariants: StripePriceVariant[] = prices.data.map(
          (price) => {
            const baseUnits = extractBaseUnits(price, price.nickname);
            return {
              priceId: price.id,
              nickname: price.nickname,
              amount: price.unit_amount || 0,
              currency: price.currency,
              baseUnits,
            };
          },
        );

        // Get inventory information directly from product metadata (in base units)
        let inventory = {
          quantity: null as number | null,
          available: false,
        };

        if (typeof product.metadata?.stock !== "undefined") {
          const qty = Number.parseInt(product.metadata.stock, 10);
          inventory = {
            quantity: qty,
            available: qty > 0,
          };
        } else {
          // Default to out of stock if stock not set
          inventory = {
            quantity: null,
            available: false,
          };
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          prices: priceVariants,
          currency: priceVariants[0]?.currency || "usd",
          images: product.images,
          inventory,
          metadata: product.metadata,
        };
      }),
    );

    // Only return products that have at least one price
    return productsWithPrices.filter((p) => p.prices.length > 0);
  } catch (error) {
    console.error("Error fetching Stripe products:", error);
    throw error;
  }
}

/**
 * Get a single product by ID from Stripe with all its prices
 */
export async function getStripeProduct(
  productId: string,
): Promise<StripeProductWithInventory | null> {
  try {
    const product = await stripe.products.retrieve(productId);

    if (!product.active) {
      return null;
    }

    // Fetch all active prices for this product
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100,
    });

    // Transform prices into our format
    const priceVariants: StripePriceVariant[] = prices.data.map((price) => {
      const baseUnits = extractBaseUnits(price, price.nickname);
      return {
        priceId: price.id,
        nickname: price.nickname,
        amount: price.unit_amount || 0,
        currency: price.currency,
        baseUnits,
      };
    });

    // Get inventory information (all products are tracked automatically, in base units)
    let inventory = {
      quantity: null as number | null,
      available: false,
    };

    if (typeof product.metadata?.stock !== "undefined") {
      const qty = Number.parseInt(product.metadata.stock, 10);
      inventory = {
        quantity: qty,
        available: qty > 0,
      };
    } else {
      // Default to out of stock if stock not set
      inventory = {
        quantity: null,
        available: false,
      };
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      prices: priceVariants,
      currency: priceVariants[0]?.currency || "usd",
      images: product.images,
      inventory,
      metadata: product.metadata,
    };
  } catch (error) {
    console.error(`Error fetching Stripe product ${productId}:`, error);
    return null;
  }
}

/**
 * Update product inventory quantity in Stripe
 * This updates the product metadata which is used for tracking
 * All products are automatically tracked
 */
export async function updateStripeInventory(
  productId: string,
  quantity: number,
): Promise<void> {
  try {
    await stripe.products.update(productId, {
      metadata: {
        stock: quantity.toString(),
      },
    });
  } catch (error) {
    console.error(`Error updating inventory for product ${productId}:`, error);
    throw error;
  }
}

/**
 * Decrement inventory for a product by base units
 * @param productId - Stripe product ID
 * @param priceId - Stripe price ID to determine base units multiplier
 * @param quantity - Number of items purchased (will be multiplied by base units)
 * Returns the new quantity in base units
 */
export async function decrementInventory(
  productId: string,
  priceId: string,
  quantity = 1,
): Promise<number> {
  try {
    const product = await stripe.products.retrieve(productId);

    // Fetch the price to get base units
    const price = await stripe.prices.retrieve(priceId);
    const baseUnits = extractBaseUnits(price, price.nickname);

    const currentQuantity =
      product.metadata?.stock !== undefined
        ? Number.parseInt(product.metadata.stock, 10)
        : 0;

    // Decrement by quantity * base units
    const decrementBy = quantity * baseUnits;
    const newQuantity = Math.max(0, currentQuantity - decrementBy);

    await updateStripeInventory(productId, newQuantity);

    return newQuantity;
  } catch (error) {
    console.error(
      `Error decrementing inventory for product ${productId}:`,
      error,
    );
    throw error;
  }
}
