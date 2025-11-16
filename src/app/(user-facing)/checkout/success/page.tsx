"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import {
  clearCheckoutSessionId,
  getCheckoutSessionId,
} from "@/lib/checkout-session";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<{
    total: number;
    customerEmail: string | null;
    itemCount: number;
  } | null>(null);

  useEffect(() => {
    // Clear cart only if this session matches the stored session
    const storedSessionId = getCheckoutSessionId();
    if (sessionId && storedSessionId === sessionId) {
      clearCart();
      clearCheckoutSessionId();
    }

    // Fetch order details from Stripe session
    if (sessionId) {
      fetch(`/api/stripe/session/${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.total !== undefined) {
            setOrderDetails({
              total: data.total / 100, // Convert from cents
              customerEmail: data.customerEmail,
              itemCount: data.itemCount,
            });
          }
        })
        .catch((error) => {
          console.error("Failed to fetch order details:", error);
        });
    }
  }, [sessionId, clearCart]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 mt-10">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your order has been successfully
            placed.
          </p>
        </div>

        {sessionId && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Order ID</p>
            <p className="font-mono text-sm break-all">{sessionId}</p>
          </div>
        )}

        {orderDetails && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span className="font-semibold">{orderDetails.itemCount}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${orderDetails.total.toFixed(2)}</span>
            </div>
            {orderDetails.customerEmail && (
              <p className="text-xs text-muted-foreground pt-2">
                Receipt sent to {orderDetails.customerEmail}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You will receive an email confirmation with your order details
            shortly.
          </p>

          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/catalog">Continue Shopping</Link>
            </Button>
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
