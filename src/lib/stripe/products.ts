/**
 * Stripe Products Utility
 * Functions for fetching products and inventory from Stripe
 */

import type Stripe from "stripe";
import { stripe } from "./client";

export interface StripeProductWithInventory {
  id: string;
  priceId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  images: string[];
  inventory: {
    quantity: number | null;
    available: boolean;
  };
  metadata: Record<string, string>;
}

/**
 * Fetch all active products from Stripe with their default prices
 */
export async function getStripeProducts(): Promise<
  StripeProductWithInventory[]
> {
  try {
    // Fetch all active products with prices expanded
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
      limit: 100, // Fetch up to 100 products
    });

    // Transform into our format
    const productsWithInventory = products.data.map((product) => {
      const defaultPrice = product.default_price as Stripe.Price | null;

      // Get inventory information directly from product metadata
      let inventory = {
        quantity: null as number | null,
        available: false,
      };

      // Automatically track inventory from metadata (all products are tracked)
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
        priceId: defaultPrice?.id || "",
        name: product.name,
        description: product.description,
        price: defaultPrice?.unit_amount ? defaultPrice.unit_amount / 100 : 0,
        currency: defaultPrice?.currency || "usd",
        images: product.images,
        inventory,
        metadata: product.metadata,
      };
    });

    return productsWithInventory.filter((p) => p.priceId); // Only return products with prices
  } catch (error) {
    console.error("Error fetching Stripe products:", error);
    throw error;
  }
}

/**
 * Get a single product by ID from Stripe
 */
export async function getStripeProduct(
  productId: string,
): Promise<StripeProductWithInventory | null> {
  try {
    const product = await stripe.products.retrieve(productId, {
      expand: ["default_price"],
    });

    if (!product.active) {
      return null;
    }

    const defaultPrice = product.default_price as Stripe.Price | null;

    // Get inventory information (all products are tracked automatically)
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
      priceId: defaultPrice?.id || "",
      name: product.name,
      description: product.description,
      price: defaultPrice?.unit_amount ? defaultPrice.unit_amount / 100 : 0,
      currency: defaultPrice?.currency || "usd",
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
 * Decrement inventory for a product
 * Returns the new quantity
 */
export async function decrementInventory(
  productId: string,
  decrementBy = 1,
): Promise<number> {
  try {
    const product = await stripe.products.retrieve(productId);

    const currentQuantity =
      product.metadata?.stock !== undefined
        ? Number.parseInt(product.metadata.stock, 10)
        : 0;

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
