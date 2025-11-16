/**
 * Stripe Checkout Session API Route
 * Creates a Stripe checkout session for the cart items
 */

import { stripe } from "@/lib/stripe/client";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

export interface CheckoutItem {
  priceId: string;
  quantity: number;
}

export interface CheckoutSessionRequest {
  items: CheckoutItem[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutSessionRequest;

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    // Get the origin for success/cancel URLs
    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      body.items.map((item) => ({
        price: item.priceId,
        quantity: item.quantity,
      }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      automatic_tax: { enabled: false }, // Enable if you have tax configured in Stripe
      // Collect shipping address
      shipping_address_collection: {
        allowed_countries: ["US"], // Add more countries as needed: 'CA', 'MX', etc.
      },
      // Enable inventory management in Stripe
      payment_intent_data: {
        metadata: {
          source: "excalibury-jerky-website",
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
