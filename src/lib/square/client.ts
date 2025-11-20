/**
 * Square API Client
 * Server-side Square instance for API requests
 */

import { SquareClient, Environment } from "square";

let squareInstance: SquareClient | null = null;

/**
 * Get or create the Square client instance
 * Lazily initializes the client to avoid build-time errors
 */
export function getSquareClient(): SquareClient {
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    throw new Error(
      "SQUARE_ACCESS_TOKEN is not defined. Please add it to your environment variables."
    );
  }

  if (!squareInstance) {
    squareInstance = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment:
        process.env.NODE_ENV === "production"
          ? Environment.Production
          : Environment.Sandbox,
    });
  }

  return squareInstance;
}

/**
 * Get the Square location ID
 * Required for inventory and order operations
 */
export function getSquareLocationId(): string {
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    throw new Error(
      "SQUARE_LOCATION_ID is not defined. Please add it to your environment variables."
    );
  }
  return locationId;
}

/**
 * Get the Square application ID
 * Required for Web Payments SDK
 */
export function getSquareApplicationId(): string {
  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  if (!appId) {
    throw new Error(
      "NEXT_PUBLIC_SQUARE_APPLICATION_ID is not defined. Please add it to your environment variables."
    );
  }
  return appId;
}

// Export a getter for convenience - will throw at runtime if not configured
export const square = new Proxy({} as SquareClient, {
  get(_target, prop) {
    return getSquareClient()[prop as keyof SquareClient];
  },
});
