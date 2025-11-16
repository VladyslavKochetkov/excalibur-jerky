"use client";

import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

interface CartValidatorProps {
  products: Array<{
    _id: string;
    stripeProductId: string;
    prices?: Array<{ priceId: string; baseUnits: number }> | null;
    inventory: {
      quantity: number | null;
      available: boolean;
    };
    primaryImageUrl?: string;
  }>;
}

/**
 * CartValidator component validates the cart against current product inventory
 * Run this on pages where you want to check cart validity on load
 */
export function CartValidator({ products }: CartValidatorProps) {
  const { validateCart, items } = useCart();

  useEffect(() => {
    // Only validate if there are items in the cart
    if (items.length > 0) {
      validateCart(products);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // This component doesn't render anything
  return null;
}
