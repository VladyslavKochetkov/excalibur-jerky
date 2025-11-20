"use client";

import { useCart } from "@/contexts/CartContext";
import { storeCheckoutSessionId } from "@/lib/checkout-session";
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";

interface SquareCheckoutButtonProps {
  onSuccess?: (orderId: string) => void;
  onError?: (error: Error) => void;
}

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<any>;
    };
  }
}

export function SquareCheckoutButton({
  onSuccess,
  onError,
}: SquareCheckoutButtonProps) {
  const { items } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [card, setCard] = useState<any>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Load Square Web Payments SDK
  useEffect(() => {
    const loadSquareSDK = async () => {
      if (window.Square) {
        setIsSDKLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src =
        process.env.NODE_ENV === "production"
          ? "https://web.squarecdn.com/v1/square.js"
          : "https://sandbox.web.squarecdn.com/v1/square.js";
      script.onload = () => setIsSDKLoaded(true);
      script.onerror = () => console.error("Failed to load Square SDK");
      document.body.appendChild(script);
    };

    loadSquareSDK();
  }, []);

  // Initialize card payment form
  useEffect(() => {
    const initializeCard = async () => {
      if (!isSDKLoaded || !window.Square || !cardContainerRef.current) return;

      try {
        const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

        if (!appId || !locationId) {
          console.error("Square application ID or location ID not configured");
          return;
        }

        const payments = await window.Square.payments(appId, locationId);
        const cardInstance = await payments.card();
        await cardInstance.attach(cardContainerRef.current);
        setCard(cardInstance);
      } catch (error) {
        console.error("Failed to initialize Square card:", error);
      }
    };

    initializeCard();

    return () => {
      if (card) {
        card.destroy();
      }
    };
  }, [isSDKLoaded]);

  const handleCheckout = async () => {
    if (items.length === 0 || !card) {
      return;
    }

    setIsLoading(true);

    try {
      // Tokenize the card
      const tokenResult = await card.tokenize();
      if (tokenResult.status !== "OK") {
        throw new Error(
          tokenResult.errors?.[0]?.message || "Card tokenization failed"
        );
      }

      // Create payment with the token
      const response = await fetch("/api/square/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            variationId: item.priceId, // priceId is actually Square variation ID
            quantity: item.quantity,
          })),
          sourceId: tokenResult.token,
          verificationToken: tokenResult.verificationToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process payment");
      }

      const { orderId, status } = await response.json();

      if (status !== "COMPLETED") {
        throw new Error(`Payment status: ${status}`);
      }

      // Store order ID for success page
      storeCheckoutSessionId(orderId);

      // Redirect to success page
      window.location.href = `/checkout/success?order_id=${orderId}`;

      onSuccess?.(orderId);
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
    <div className="space-y-4">
      {/* Square Card Input */}
      <div
        ref={cardContainerRef}
        className="min-h-[40px] border rounded-md p-3"
      />

      <Button
        onClick={handleCheckout}
        disabled={isLoading || !card}
        className="w-full"
        size="lg"
      >
        {isLoading
          ? "Processing payment..."
          : !card
            ? "Loading payment form..."
            : "Pay Now"}
      </Button>
    </div>
  );
}
