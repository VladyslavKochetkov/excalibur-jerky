"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

export default function CheckoutCancelPage() {
  const { totalItems } = useCart();
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 mt-10">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Checkout Cancelled</h1>
          <p className="text-muted-foreground">
            Your checkout was cancelled. No charges were made to your account.
          </p>
        </div>

        <div className="space-y-3">
          {totalItems > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Your cart items are still saved ({totalItems}{" "}
                {totalItems === 1 ? "item" : "items"}). You can return to
                complete your purchase at any time.
              </p>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-semibold mb-2">
                  Ready to complete your order?
                </p>
                <p className="text-xs text-muted-foreground">
                  Click the cart icon in the navigation to review your items and
                  checkout.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your cart is currently empty. Browse our catalog to find delicious
              jerky!
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
            <Button asChild>
              <Link href="/catalog">Return to Catalog</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
