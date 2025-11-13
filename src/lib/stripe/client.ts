/**
 * Stripe API Client
 * Server-side Stripe instance for API requests
 */

import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Get or create the Stripe client instance
 * Lazily initializes the client to avoid build-time errors
 */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is not defined. Please add it to your environment variables."
    );
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
      appInfo: {
        name: "Excalibury Jerky",
        version: "1.0.0",
      },
    });
  }

  return stripeInstance;
}

// Export a getter for convenience - will throw at runtime if not configured
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});
