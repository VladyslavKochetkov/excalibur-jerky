/**
 * Helper functions for managing Stripe checkout sessions in localStorage
 */

const CHECKOUT_SESSION_KEY = 'stripe_checkout_session_id';

/**
 * Store the Stripe checkout session ID in localStorage
 * This allows us to match the session on the success page and clear the cart
 */
export function storeCheckoutSessionId(sessionId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHECKOUT_SESSION_KEY, sessionId);
  }
}

/**
 * Retrieve the stored Stripe checkout session ID
 */
export function getCheckoutSessionId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(CHECKOUT_SESSION_KEY);
  }
  return null;
}

/**
 * Clear the stored checkout session ID
 */
export function clearCheckoutSessionId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CHECKOUT_SESSION_KEY);
  }
}

/**
 * Check if a session ID matches the stored session
 */
export function isCurrentCheckoutSession(sessionId: string): boolean {
  const storedSessionId = getCheckoutSessionId();
  return storedSessionId === sessionId;
}
