/**
 * Square Order Details API Route
 * Retrieves order details for success page
 */

import { NextRequest, NextResponse } from "next/server";
import { getSquareOrder } from "@/lib/square/payments";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await getSquareOrder(orderId);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Get customer email from fulfillment
    let customerEmail: string | undefined;
    const fulfillment = order.fulfillments?.[0];
    if (fulfillment?.shipmentDetails?.recipient?.emailAddress) {
      customerEmail = fulfillment.shipmentDetails.recipient.emailAddress;
    }

    // Calculate item count
    const itemCount = order.lineItems?.reduce((sum, item) => {
      return sum + Number.parseInt(item.quantity || "0", 10);
    }, 0) || 0;

    return NextResponse.json({
      total: order.totalMoney ? Number(order.totalMoney.amount) : 0,
      customerEmail,
      itemCount,
      state: order.state,
    });
  } catch (error) {
    console.error("Error fetching order:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
