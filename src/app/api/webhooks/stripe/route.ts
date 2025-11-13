/**
 * Stripe Webhook Handler
 * Handles Stripe webhook events for payment processing
 */

import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { decrementInventory } from "@/lib/stripe/products";
import {
  removeStripeProductFromSanity,
  syncStripeProductToSanity,
} from "@/sanity/lib/products";

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
  console.log("Checkout session completed:", session.id);

  // Retrieve the session with line items
  const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
    session.id,
    {
      expand: ["line_items.data.price.product"],
    },
  );

  const lineItems = sessionWithLineItems.line_items?.data || [];

  // Decrement inventory for each item (all products are automatically tracked)
  for (const item of lineItems) {
    if (item.price?.product && typeof item.price.product === "object") {
      const product = item.price.product as Stripe.Product;
      const quantity = item.quantity || 1;

      try {
        await decrementInventory(product.id, quantity);
        console.log(
          `Decremented inventory for product ${product.id} by ${quantity}`,
        );
      } catch (error) {
        console.error(
          `Failed to decrement inventory for product ${product.id}:`,
          error,
        );
      }
    }
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

    // Only sync active products
    if (fullProduct.active) {
      await syncStripeProductToSanity(fullProduct);
      console.log(`Successfully synced new product ${product.id} to Sanity`);
    } else {
      console.log(`Product ${product.id} is not active, skipping sync`);
    }
  } catch (error) {
    console.error(`Failed to sync product ${product.id} to Sanity:`, error);
    // Don't throw - we don't want to fail the webhook
  }
}

async function handleProductUpdated(product: Stripe.Product) {
  console.log("Product updated in Stripe:", product.id);

  try {
    // Fetch the full product with default_price expanded
    let fullProduct = await stripe.products.retrieve(product.id, {
      expand: ["default_price"],
    });

    // Ensure stock metadata exists and is valid
    fullProduct = await ensureStockMetadata(fullProduct);

    // Sync active products, remove inactive ones
    if (fullProduct.active) {
      await syncStripeProductToSanity(fullProduct);
      console.log(
        `Successfully synced updated product ${product.id} to Sanity`,
      );
    } else {
      // Product was deactivated, remove from Sanity
      await removeStripeProductFromSanity(product.id);
      console.log(`Product ${product.id} deactivated, removed from Sanity`);
    }
  } catch (error) {
    console.error(
      `Failed to sync updated product ${product.id} to Sanity:`,
      error,
    );
    // Don't throw - we don't want to fail the webhook
  }
}

async function handleProductDeleted(product: Stripe.Product) {
  console.log("Product deleted in Stripe:", product.id);

  try {
    await removeStripeProductFromSanity(product.id);
    console.log(`Successfully removed product ${product.id} from Sanity`);
  } catch (error) {
    console.error(`Failed to remove product ${product.id} from Sanity:`, error);
    // Don't throw - we don't want to fail the webhook
  }
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
