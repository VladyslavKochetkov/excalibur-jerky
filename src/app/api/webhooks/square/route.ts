/**
 * Square Webhook Handler
 * Handles Square webhook events for payment processing and catalog sync
 */

import { type NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import crypto from "crypto";
import { getSquareClient, getSquareLocationId } from "@/lib/square/client";
import { decrementInventory } from "@/lib/square/inventory";
import { getSquareVariation } from "@/lib/square/catalog";
import {
  removeSquareProductFromSanity,
  syncSquareProductToSanity,
} from "@/sanity/lib/products";
import {
  sendCustomerOrderConfirmation,
  sendAdminOrderNotification,
} from "@/lib/email/order-emails";

const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

/**
 * Verify Square webhook signature
 */
function verifySignature(
  body: string,
  signature: string,
  signatureKey: string,
  notificationUrl: string
): boolean {
  const payload = notificationUrl + body;
  const hash = crypto
    .createHmac("sha256", signatureKey)
    .update(payload)
    .digest("base64");
  return hash === signature;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature header" },
      { status: 400 }
    );
  }

  if (!webhookSignatureKey) {
    console.error("SQUARE_WEBHOOK_SIGNATURE_KEY is not configured");
    return NextResponse.json(
      { error: "Webhook signature key not configured" },
      { status: 500 }
    );
  }

  // Get the notification URL from environment or construct it
  const notificationUrl =
    process.env.SQUARE_WEBHOOK_URL ||
    `${request.headers.get("origin") || ""}/api/webhooks/square`;

  // Verify webhook signature
  if (!verifySignature(body, signature, webhookSignatureKey, notificationUrl)) {
    console.error("Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    type: string;
    data: {
      type: string;
      id: string;
      object: Record<string, unknown>;
    };
  };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment.completed": {
        await handlePaymentCompleted(event.data.object);
        break;
      }

      case "payment.updated": {
        await handlePaymentUpdated(event.data.object);
        break;
      }

      case "order.fulfillment.updated": {
        await handleOrderFulfillmentUpdated(event.data.object);
        break;
      }

      case "inventory.count.updated": {
        await handleInventoryCountUpdated(event.data.object);
        break;
      }

      case "catalog.version.updated": {
        await handleCatalogUpdated();
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
      { status: 500 }
    );
  }
}

interface PaymentObject {
  payment?: {
    id?: string;
    status?: string;
    order_id?: string;
    amount_money?: {
      amount?: number;
      currency?: string;
    };
    buyer_email_address?: string;
  };
}

async function handlePaymentCompleted(data: Record<string, unknown>) {
  const paymentData = data as PaymentObject;
  const payment = paymentData.payment;

  if (!payment) {
    console.error("No payment data in webhook");
    return;
  }

  console.log("Payment completed:", payment.id);

  const orderId = payment.order_id;
  if (!orderId) {
    console.error("No order ID in payment");
    return;
  }

  // Get the order details
  const client = getSquareClient();
  const { result } = await client.orders.retrieveOrder({ orderId });
  const order = result.order;

  if (!order) {
    console.error("Order not found:", orderId);
    return;
  }

  let inventoryUpdated = false;

  // Decrement inventory for each line item
  for (const lineItem of order.lineItems || []) {
    if (lineItem.catalogObjectId) {
      const quantity = Number.parseInt(lineItem.quantity || "1", 10);
      try {
        await decrementInventory(lineItem.catalogObjectId, quantity);
        console.log(
          `Decremented inventory for ${lineItem.catalogObjectId} by ${quantity}`
        );
        inventoryUpdated = true;
      } catch (error) {
        console.error(
          `Failed to decrement inventory for ${lineItem.catalogObjectId}:`,
          error
        );
      }
    }
  }

  // Invalidate cache if inventory was updated
  if (inventoryUpdated) {
    revalidateTag("catalog", {});
    revalidateTag("product", {});
    revalidateTag("products", {});
    console.log("Invalidated catalog caches after inventory update");
  }

  // Send order confirmation emails
  try {
    const customerEmail =
      payment.buyer_email_address ||
      order.fulfillments?.[0]?.shipmentDetails?.recipient?.emailAddress;

    if (customerEmail) {
      const orderData = {
        sessionId: orderId,
        customerEmail,
        customerName:
          order.fulfillments?.[0]?.shipmentDetails?.recipient?.displayName ||
          null,
        lineItems: (order.lineItems || []).map((item) => ({
          name: item.name || "Unknown Product",
          description: item.note || null,
          quantity: Number.parseInt(item.quantity || "1", 10),
          amount: Number(item.totalMoney?.amount || 0n),
          size: item.variationName || undefined,
        })),
        subtotal: Number(order.totalMoney?.amount || 0n),
        shipping: Number(order.totalServiceChargeMoney?.amount || 0n),
        total: Number(order.totalMoney?.amount || 0n),
        currency: order.totalMoney?.currency || "USD",
        shippingAddress:
          order.fulfillments?.[0]?.shipmentDetails?.recipient?.address || null,
      };

      // Send customer confirmation
      const customerEmailResult =
        await sendCustomerOrderConfirmation(orderData);
      if (!customerEmailResult.success) {
        console.error(
          "Failed to send customer confirmation:",
          customerEmailResult.error
        );
      }

      // Send admin notification
      const adminEmailResult = await sendAdminOrderNotification(orderData);
      if (!adminEmailResult.success) {
        console.error(
          "Failed to send admin notification:",
          adminEmailResult.error
        );
      }
    }
  } catch (error) {
    console.error("Error sending order emails:", error);
  }
}

async function handlePaymentUpdated(data: Record<string, unknown>) {
  const paymentData = data as PaymentObject;
  const payment = paymentData.payment;

  if (!payment) return;

  console.log(`Payment ${payment.id} updated, status: ${payment.status}`);

  // Handle different payment statuses
  if (payment.status === "COMPLETED") {
    await handlePaymentCompleted(data);
  } else if (payment.status === "FAILED") {
    console.error("Payment failed:", payment.id);
  }
}

async function handleOrderFulfillmentUpdated(data: Record<string, unknown>) {
  console.log("Order fulfillment updated:", data);
  // Handle fulfillment updates (e.g., shipped, delivered)
}

async function handleInventoryCountUpdated(data: Record<string, unknown>) {
  console.log("Inventory count updated:", data);

  // Invalidate caches when inventory changes
  revalidateTag("catalog", {});
  revalidateTag("product", {});
  revalidateTag("products", {});
}

async function handleCatalogUpdated() {
  console.log("Catalog updated");

  // Sync all products to Sanity
  try {
    const client = getSquareClient();

    // Fetch all items
    const { result } = await client.catalog.listCatalog({
      types: ["ITEM"],
    });

    for (const item of result.objects || []) {
      if (item.id && item.itemData) {
        try {
          await syncSquareProductToSanity(item);
          console.log(`Synced item ${item.id} to Sanity`);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
        }
      }
    }

    // Invalidate caches
    revalidateTag("catalog", {});
    revalidateTag("product", {});
    revalidateTag("products", {});
    console.log("Catalog sync complete, caches invalidated");
  } catch (error) {
    console.error("Failed to sync catalog:", error);
  }
}
