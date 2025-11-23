/**
 * Square Payment API Route
 * Creates a Square order and processes payment
 */

import { NextRequest, NextResponse } from "next/server";
import { createSquareOrder, processPayment } from "@/lib/square/payments";

export interface PaymentItem {
  variationId: string;
  quantity: number;
}

export interface PaymentRequest {
  items: PaymentItem[];
  sourceId: string; // Payment token from Web Payments SDK
  verificationToken?: string;
  customerEmail?: string;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;
    administrativeDistrictLevel1?: string;
    postalCode?: string;
    country?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PaymentRequest;

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    if (!body.sourceId) {
      return NextResponse.json(
        { error: "Payment source ID is required" },
        { status: 400 }
      );
    }

    // Create the order
    const order = await createSquareOrder({
      lineItems: body.items,
      customerEmail: body.customerEmail,
      shippingAddress: body.shippingAddress,
    });

    if (!order.id) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Process the payment
    const paymentResult = await processPayment(
      order.id,
      body.sourceId,
      body.customerEmail,
      body.verificationToken
    );

    return NextResponse.json({
      orderId: order.id,
      paymentId: paymentResult.paymentId,
      status: paymentResult.status,
      total: order.totalMoney ? Number(order.totalMoney.amount) : 0,
    });
  } catch (error) {
    console.error("Error processing payment:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
