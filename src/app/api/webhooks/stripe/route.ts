/**
 * Stripe Webhook Handler
 * Handles Stripe webhook events for payment processing
 */

import { type NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { decrementInventory } from "@/lib/stripe/products";
import {
  removeStripeProductFromSanity,
  syncStripeProductToSanity,
} from "@/sanity/lib/products";
import {
  sendCustomerOrderConfirmation,
  sendAdminOrderNotification,
} from "@/lib/email/order-emails";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error("Payment failed:", paymentIntent.id);
        break;
      }

      case "product.created": {
        const product = event.data.object as Stripe.Product;
        await handleProductCreated(product);
        break;
      }

      case "product.updated": {
        const product = event.data.object as Stripe.Product;
        await handleProductUpdated(product);
        break;
      }

      case "product.deleted": {
        const product = event.data.object as Stripe.Product;
        await handleProductDeleted(product);
        break;
      }

      case "price.created":
      case "price.updated": {
        const price = event.data.object as Stripe.Price;
        await handlePriceCreatedOrUpdated(price);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  console.log("🛒 [WEBHOOK] Checkout session completed:", session.id);

  // Retrieve the session with line items
  const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
    session.id,
    {
      expand: ["line_items.data.price.product"],
    },
  );

  const lineItems = sessionWithLineItems.line_items?.data || [];

  let inventoryUpdated = false;

  // Decrement inventory for each item using base units
  for (const item of lineItems) {
    if (item.price?.product && typeof item.price.product === "object") {
      const product = item.price.product as Stripe.Product;
      const priceId = item.price.id;
      const quantity = item.quantity || 1;

      try {
        // Ensure price has base_units metadata before decrementing
        await ensurePriceMetadata(priceId);

        // Decrement using the new signature that takes priceId for base units calculation
        await decrementInventory(product.id, priceId, quantity);
        console.log(
          `✅ [WEBHOOK] Decremented inventory for product ${product.id} (price ${priceId}) by ${quantity} items`,
        );
        inventoryUpdated = true;
      } catch (error) {
        console.error(
          `❌ [WEBHOOK] Failed to decrement inventory for product ${product.id}:`,
          error,
        );
      }
    }
  }

  // Invalidate cache if any inventory was updated
  if (inventoryUpdated) {
    revalidateTag("catalog", {});
    revalidateTag("product", {});
    revalidateTag("products", {});
    console.log(`🔄 [CACHE] Invalidated catalog and product caches after inventory update`);
  }

  // Send order confirmation emails
  try {
    const customerEmail = session.customer_details?.email;

    if (customerEmail) {
      // Prepare order data for emails
      const orderData = {
        sessionId: session.id,
        customerEmail,
        customerName: session.customer_details?.name || null,
        lineItems: lineItems.map((item) => {
          const product =
            item.price?.product && typeof item.price.product === "object"
              ? (item.price.product as Stripe.Product)
              : null;

          return {
            name: product?.name || item.description || "Unknown Product",
            description: product?.description || null,
            quantity: item.quantity || 1,
            amount: item.amount_total || 0,
            size: item.price?.nickname || undefined,
          };
        }),
        subtotal: session.amount_subtotal || 0,
        shipping: session.total_details?.amount_shipping || 0,
        total: session.amount_total || 0,
        currency: session.currency || "usd",
        shippingAddress: session.shipping_details?.address || null,
      };

      // Send customer confirmation email
      const customerEmailResult =
        await sendCustomerOrderConfirmation(orderData);
      if (!customerEmailResult.success) {
        console.error(
          "Failed to send customer confirmation email:",
          customerEmailResult.error,
        );
      }

      // Send admin notification email
      const adminEmailResult = await sendAdminOrderNotification(orderData);
      if (!adminEmailResult.success) {
        console.error(
          "Failed to send admin notification email:",
          adminEmailResult.error,
        );
      }
    } else {
      console.warn(
        "⚠️ [WEBHOOK] No customer email found in session, skipping order emails",
      );
    }
  } catch (error) {
    console.error("❌ [WEBHOOK] Error sending order emails:", error);
    // Don't throw - we don't want to fail the webhook due to email issues
  }

  // Optional: Save order to Sanity or your database here
  // const order = {
  //   sessionId: session.id,
  //   customerId: session.customer,
  //   amountTotal: session.amount_total,
  //   currency: session.currency,
  //   status: session.payment_status,
  //   createdAt: new Date(),
  // };
  // await saveOrderToSanity(order);
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log("Payment intent succeeded:", paymentIntent.id);

  // Additional payment processing logic here if needed
  // For example, sending confirmation emails, updating analytics, etc.
}

async function handleProductCreated(product: Stripe.Product) {
  console.log("Product created in Stripe:", product.id);

  try {
    // Fetch the full product with default_price expanded
    let fullProduct = await stripe.products.retrieve(product.id, {
      expand: ["default_price"],
    });

    // Ensure stock metadata exists and is valid
    fullProduct = await ensureStockMetadata(fullProduct);

    // Ensure all prices for this product have base_units metadata
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100,
    });

    for (const price of prices.data) {
      await ensurePriceMetadata(price.id);
    }

    // Only sync active products
    if (fullProduct.active) {
      await syncStripeProductToSanity(fullProduct);
      console.log(`Successfully synced new product ${product.id} to Sanity`);

      // Invalidate Next.js cache for catalog and product pages
      revalidateTag("catalog", {});
      revalidateTag("product", {});
      revalidateTag("products", {});
      console.log(`🔄 [CACHE] Invalidated catalog and product caches`);
    } else {
      console.log(`Product ${product.id} is not active, skipping sync`);
    }
  } catch (error) {
    console.error(`Failed to sync product ${product.id} to Sanity:`, error);
    // Don't throw - we don't want to fail the webhook
  }
}

async function handleProductUpdated(product: Stripe.Product) {
  console.log("🔔 [WEBHOOK] Product updated in Stripe:", product.id, product.name);

  try {
    // Fetch the full product with default_price expanded
    let fullProduct = await stripe.products.retrieve(product.id, {
      expand: ["default_price"],
    });

    console.log(`🔍 [WEBHOOK] Retrieved full product ${product.id}:`, {
      name: fullProduct.name,
      active: fullProduct.active,
      metadata: fullProduct.metadata,
    });

    // Ensure stock metadata exists and is valid
    fullProduct = await ensureStockMetadata(fullProduct);

    // Ensure all prices for this product have base_units metadata
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100,
    });

    console.log(`💰 [WEBHOOK] Found ${prices.data.length} active prices for product ${product.id}`);

    for (const price of prices.data) {
      await ensurePriceMetadata(price.id);
    }

    // Sync active products, remove inactive ones
    if (fullProduct.active) {
      console.log(`🔄 [WEBHOOK] Syncing product ${product.id} to Sanity...`);
      await syncStripeProductToSanity(fullProduct);
      console.log(
        `✅ [WEBHOOK] Successfully synced updated product ${product.id} to Sanity`,
      );
    } else {
      // Product was deactivated, remove from Sanity
      console.log(`🗑️ [WEBHOOK] Product ${product.id} is inactive, removing from Sanity`);
      await removeStripeProductFromSanity(product.id);
      console.log(`✅ [WEBHOOK] Product ${product.id} deactivated, removed from Sanity`);
    }

    // Invalidate Next.js cache for catalog and product pages
    revalidateTag("catalog", {});
    revalidateTag("product", {});
    revalidateTag("products", {});
    console.log(`🔄 [CACHE] Invalidated catalog and product caches`);
  } catch (error) {
    console.error(
      `❌ [WEBHOOK] Failed to sync updated product ${product.id} to Sanity:`,
      error,
    );
    // Don't throw - we don't want to fail the webhook
  }
}

async function handleProductDeleted(product: Stripe.Product) {
  console.log("🗑️ [WEBHOOK] Product deleted in Stripe:", product.id);

  try {
    await removeStripeProductFromSanity(product.id);
    console.log(`✅ [WEBHOOK] Successfully removed product ${product.id} from Sanity`);

    // Invalidate Next.js cache for catalog and product pages
    revalidateTag("catalog", {});
    revalidateTag("product", {});
    revalidateTag("products", {});
    console.log(`🔄 [CACHE] Invalidated catalog and product caches`);
  } catch (error) {
    console.error(`❌ [WEBHOOK] Failed to remove product ${product.id} from Sanity:`, error);
    // Don't throw - we don't want to fail the webhook
  }
}

async function handlePriceCreatedOrUpdated(price: Stripe.Price) {
  console.log(`💰 [WEBHOOK] Price ${price.id} created/updated in Stripe`);

  try {
    // Ensure the price has base_units metadata
    await ensurePriceMetadata(price.id);

    // If this price belongs to a product, re-sync the product to update Sanity
    if (typeof price.product === "string") {
      const product = await stripe.products.retrieve(price.product);
      if (product.active) {
        await syncStripeProductToSanity(product);
        console.log(
          `✅ [WEBHOOK] Re-synced product ${product.id} to Sanity after price ${price.id} update`,
        );

        // Invalidate Next.js cache for catalog and product pages
        revalidateTag("catalog", {});
        revalidateTag("product", {});
        revalidateTag("products", {});
        console.log(`🔄 [CACHE] Invalidated catalog and product caches`);
      }
    }
  } catch (error) {
    console.error(`❌ [WEBHOOK] Failed to handle price ${price.id} update:`, error);
    // Don't throw - we don't want to fail the webhook
  }
}

/**
 * Ensures that a price has valid base_units metadata.
 * If base_units is missing or invalid, calculates it from the nickname.
 * Returns the updated price.
 */
async function ensurePriceMetadata(
  priceId: string,
): Promise<Stripe.Response<Stripe.Price>> {
  const price = await stripe.prices.retrieve(priceId);
  const currentBaseUnits = price.metadata?.base_units;

  // Check if base_units exists and is a valid number >= 1
  const baseUnitsNumber = currentBaseUnits
    ? Number.parseInt(currentBaseUnits, 10)
    : NaN;
  const isValidBaseUnits = !Number.isNaN(baseUnitsNumber) && baseUnitsNumber >= 1;

  if (!isValidBaseUnits) {
    // Base units is missing or invalid, calculate from nickname
    const nickname = price.nickname?.toLowerCase().trim() || "";
    let calculatedBaseUnits = 1; // default

    if (nickname.includes("1 lb") || nickname.includes("1lb")) {
      calculatedBaseUnits = 4; // 16oz = 4 x 4oz
    } else if (nickname.includes("12oz") || nickname.includes("12 oz")) {
      calculatedBaseUnits = 3; // 12oz = 3 x 4oz
    } else if (nickname.includes("8oz") || nickname.includes("8 oz")) {
      calculatedBaseUnits = 2; // 8oz = 2 x 4oz
    } else if (nickname.includes("4oz") || nickname.includes("4 oz")) {
      calculatedBaseUnits = 1; // 4oz = 1 x 4oz (base unit)
    }

    console.log(
      `Price ${priceId} has invalid or missing base_units metadata. Setting to ${calculatedBaseUnits} (from nickname: "${price.nickname || "none"}").`,
    );

    const updatedPrice = await stripe.prices.update(priceId, {
      metadata: {
        ...price.metadata,
        base_units: calculatedBaseUnits.toString(),
      },
    });

    return updatedPrice;
  }

  // Base units is valid, return the price as-is
  return price;
}

/**
 * Ensures that a product has valid stock metadata.
 * If stock is missing or invalid, sets it to 0.
 * Returns the updated product.
 */
async function ensureStockMetadata(
  product: Stripe.Product,
): Promise<Stripe.Response<Stripe.Product>> {
  const currentStock = product.metadata?.stock;

  // Check if stock exists and is a valid number >= 0
  const stockNumber = currentStock ? Number.parseInt(currentStock, 10) : NaN;
  const isValidStock = !Number.isNaN(stockNumber) && stockNumber >= 0;

  if (!isValidStock) {
    // Stock is missing or invalid, update it to 0
    console.log(
      `Product ${product.id} has invalid or missing stock metadata. Setting to 0.`,
    );

    const updatedProduct = await stripe.products.update(product.id, {
      metadata: {
        ...product.metadata,
        stock: "0",
      },
    });

    return updatedProduct;
  }

  // Stock is valid, return the product as-is (retrieve it to get the Response wrapper)
  return await stripe.products.retrieve(product.id, {
    expand: ["default_price"],
  });
}
