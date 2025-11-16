/**
 * Stripe Session Details API Route
 * Fetches checkout session details for the success page
 */

import { stripe } from "@/lib/stripe/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    // Calculate total items
    const itemCount =
      session.line_items?.data.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      ) || 0;

    return NextResponse.json({
      total: session.amount_total,
      customerEmail: session.customer_details?.email,
      itemCount,
    });
  } catch (error) {
    console.error("Error fetching session details:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
