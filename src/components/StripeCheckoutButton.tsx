"use client";

import { useCart } from "@/contexts/CartContext";
import { storeCheckoutSessionId } from "@/lib/checkout-session";
import { useState } from "react";
import { Button } from "./ui/button";

interface StripeCheckoutButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function StripeCheckoutButton({
  onSuccess,
  onError,
}: StripeCheckoutButtonProps) {
  const { items } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      return;
    }

    setIsLoading(true);

    try {
      // Create checkout session
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            priceId: item.priceId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { url, sessionId } = await response.json();

      if (!url || !sessionId) {
        throw new Error("No checkout URL or session ID returned");
      }

      // Store session ID for later cart clearing
      storeCheckoutSessionId(sessionId);

      // Redirect to Stripe Checkout
      window.location.href = url;

      onSuccess?.();
    } catch (error) {
      console.error("Checkout error:", error);
      setIsLoading(false);
      onError?.(error as Error);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        Your cart is empty
      </div>
    );
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full"
      size="lg"
    >
      {isLoading ? "Redirecting to checkout..." : "Proceed to Checkout"}
    </Button>
  );
}
