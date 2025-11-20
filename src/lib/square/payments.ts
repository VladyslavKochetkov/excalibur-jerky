/**
 * Square Payments Utility
 * Functions for creating orders and processing payments
 */

import type { CreateOrderRequest, CreatePaymentRequest, Order } from "square";
import { getSquareClient, getSquareLocationId } from "./client";

export interface PaymentLineItem {
  variationId: string;
  quantity: number;
  name?: string;
}

export interface CreateOrderOptions {
  lineItems: PaymentLineItem[];
  customerEmail?: string;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    addressLine2?: string;
    locality?: string; // city
    administrativeDistrictLevel1?: string; // state
    postalCode?: string;
    country?: string;
  };
}

/**
 * Create a Square order from line items
 */
export async function createSquareOrder(
  options: CreateOrderOptions
): Promise<Order> {
  const client = getSquareClient();
  const locationId = getSquareLocationId();

  const orderRequest: CreateOrderRequest = {
    order: {
      locationId,
      lineItems: options.lineItems.map((item) => ({
        catalogObjectId: item.variationId,
        quantity: item.quantity.toString(),
      })),
      metadata: {
        source: "excalibury-jerky-website",
      },
    },
    idempotencyKey: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  // Add fulfillment if shipping address provided
  if (options.shippingAddress) {
    orderRequest.order!.fulfillments = [
      {
        type: "SHIPMENT",
        shipmentDetails: {
          recipient: {
            displayName: [
              options.shippingAddress.firstName,
              options.shippingAddress.lastName,
            ]
              .filter(Boolean)
              .join(" "),
            emailAddress: options.customerEmail,
            address: {
              addressLine1: options.shippingAddress.addressLine1,
              addressLine2: options.shippingAddress.addressLine2,
              locality: options.shippingAddress.locality,
              administrativeDistrictLevel1:
                options.shippingAddress.administrativeDistrictLevel1,
              postalCode: options.shippingAddress.postalCode,
              country: options.shippingAddress.country || "US",
            },
          },
        },
      },
    ];
  }

  const { result } = await client.orders.createOrder(orderRequest);

  if (!result.order) {
    throw new Error("Failed to create order");
  }

  return result.order;
}

/**
 * Process a payment for an order using a payment token
 */
export async function processPayment(
  orderId: string,
  sourceId: string, // Payment token from Web Payments SDK
  customerEmail?: string,
  verificationToken?: string
): Promise<{ paymentId: string; status: string }> {
  const client = getSquareClient();
  const locationId = getSquareLocationId();

  // Get the order to get the total amount
  const { result: orderResult } = await client.orders.retrieveOrder({ orderId });
  const order = orderResult.order;

  if (!order || !order.totalMoney) {
    throw new Error("Order not found or has no total");
  }

  const paymentRequest: CreatePaymentRequest = {
    sourceId,
    idempotencyKey: `payment-${orderId}-${Date.now()}`,
    amountMoney: order.totalMoney,
    orderId,
    locationId,
    autocomplete: true,
    buyerEmailAddress: customerEmail,
  };

  // Add verification token if provided (for SCA)
  if (verificationToken) {
    paymentRequest.verificationToken = verificationToken;
  }

  const { result } = await client.payments.createPayment(paymentRequest);

  if (!result.payment) {
    throw new Error("Failed to process payment");
  }

  return {
    paymentId: result.payment.id!,
    status: result.payment.status || "UNKNOWN",
  };
}

/**
 * Get order details by ID
 */
export async function getSquareOrder(orderId: string): Promise<Order | null> {
  try {
    const client = getSquareClient();

    const { result } = await client.orders.retrieveOrder({ orderId });

    return result.order || null;
  } catch (error) {
    console.error(`Error fetching Square order ${orderId}:`, error);
    return null;
  }
}

/**
 * Calculate order totals from line items
 */
export async function calculateOrderTotals(
  lineItems: PaymentLineItem[]
): Promise<{
  subtotal: number;
  tax: number;
  total: number;
}> {
  const client = getSquareClient();
  const locationId = getSquareLocationId();

  // Create a temporary order to calculate totals
  const { result } = await client.orders.calculateOrder({
    order: {
      locationId,
      lineItems: lineItems.map((item) => ({
        catalogObjectId: item.variationId,
        quantity: item.quantity.toString(),
      })),
    },
  });

  const order = result.order;
  if (!order) {
    return { subtotal: 0, tax: 0, total: 0 };
  }

  return {
    subtotal: Number(order.totalMoney?.amount || 0n),
    tax: Number(order.totalTaxMoney?.amount || 0n),
    total: Number(order.totalMoney?.amount || 0n),
  };
}
