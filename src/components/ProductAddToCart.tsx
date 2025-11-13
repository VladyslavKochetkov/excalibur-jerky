"use client";

import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

interface ProductAddToCartProps {
  product: {
    _id: string;
    name: string;
    price: number;
    stripePriceId: string;
    inventory: {
      quantity: number | null;
      available: boolean;
    };
  };
}

export function ProductAddToCart({ product }: ProductAddToCartProps) {
  const { addItem, items, updateQuantity } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  // Check if item is in cart
  const cartItem = items.find((item) => item.id === product._id);
  const quantityInCart = cartItem?.quantity || 0;

  const inStock = product.inventory?.available ?? false;
  const maxQuantity = product.inventory?.quantity;
  const canAddMore = maxQuantity === null || quantityInCart < maxQuantity;

  const handleAddToCart = () => {
    setIsAdding(true);

    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      stripePriceId: product.stripePriceId,
      maxQuantity: product.inventory?.quantity,
    });

    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };

  const handleIncrement = () => {
    updateQuantity(product._id, quantityInCart + 1);
  };

  const handleDecrement = () => {
    updateQuantity(product._id, quantityInCart - 1);
  };

  return (
    <div className="space-y-4">
      {quantityInCart > 0 ? (
        // Show quantity controls when item is in cart
        <div className="w-full flex gap-2">
          <button
            type="button"
            onClick={handleDecrement}
            className="flex-1 py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors text-lg"
          >
            −
          </button>
          <button
            type="button"
            className="flex-[2] py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-md cursor-default text-lg"
          >
            {quantityInCart} in cart
          </button>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={!inStock || !canAddMore}
            className="flex-1 py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-lg"
          >
            +
          </button>
        </div>
      ) : (
        // Show add to cart button when item is not in cart
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock || isAdding}
          className="w-full py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-lg"
        >
          {isAdding ? "Added to Cart!" : inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      )}
    </div>
  );
}
