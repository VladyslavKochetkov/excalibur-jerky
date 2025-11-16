"use client";

import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

interface ProductAddToCartProps {
  product: {
    _id: string;
    stripeProductId: string;
    name: string;
    price: number;
    prices: Array<{
      priceId: string;
      nickname: string | null;
      amount: number; // in cents
      baseUnits: number;
    }>;
    inventory: {
      quantity: number | null;
      available: boolean;
    };
    primaryImageUrl?: string;
  };
}

export function ProductAddToCart({ product }: ProductAddToCartProps) {
  const { addItem, items, updateQuantity, openCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  // All products should now have prices array
  // Default to 4oz variant (baseUnits = 1) or fall back to first price
  const defaultPrice = product.prices?.find(p => p.baseUnits === 1) || product.prices?.[0];
  const [selectedPriceId, setSelectedPriceId] = useState(defaultPrice?.priceId || "");

  // Handle products without prices (shouldn't happen but safety check)
  if (!product.prices || product.prices.length === 0) {
    return null;
  }

  // Get selected price details
  const selectedPrice = product.prices.find(p => p.priceId === selectedPriceId) || product.prices[0];
  const selectedPriceAmount = selectedPrice.amount / 100;

  // Check if item is in cart (cart item ID is productId-priceId)
  const cartItemId = `${product.stripeProductId}-${selectedPriceId}`;
  const cartItem = items.find((item) => item.id === cartItemId);
  const quantityInCart = cartItem?.quantity || 0;

  const inStock = product.inventory?.available ?? false;
  const totalAvailableBaseUnits = product.inventory?.quantity;

  // Calculate base units used by OTHER variants of this product in cart (excluding current variant)
  const baseUnitsUsedByOthers = items
    .filter(item => item.productId === product.stripeProductId && item.id !== cartItemId)
    .reduce((sum, item) => sum + (item.baseUnits * item.quantity), 0);

  // Remaining base units = total - what's used by others (not including current variant)
  const remainingBaseUnits = totalAvailableBaseUnits !== null
    ? Math.max(0, totalAvailableBaseUnits - baseUnitsUsedByOthers)
    : null;

  // Max for THIS specific size variant (total you can have, including what's already in cart)
  const maxQuantity = remainingBaseUnits !== null && selectedPrice
    ? Math.floor(remainingBaseUnits / selectedPrice.baseUnits)
    : null;
  const canAddMore = maxQuantity === null || quantityInCart < maxQuantity;

  const handleAddToCart = () => {
    if (!selectedPrice) return;

    setIsAdding(true);

    addItem({
      id: cartItemId,
      productId: product.stripeProductId,
      priceId: selectedPriceId,
      name: product.name,
      sizeNickname: selectedPrice.nickname || "Default",
      price: selectedPriceAmount,
      quantity: 1,
      baseUnits: selectedPrice.baseUnits,
      maxQuantity: maxQuantity,
      totalInventory: totalAvailableBaseUnits,
      imageUrl: product.primaryImageUrl,
    });

    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };

  const handleIncrement = () => {
    if (!selectedPrice) return;

    // Check against the already-calculated maxQuantity
    if (maxQuantity !== null && quantityInCart >= maxQuantity) {
      return; // Don't allow adding more than available stock
    }

    updateQuantity(cartItemId, quantityInCart + 1);
  };

  const handleDecrement = () => {
    updateQuantity(cartItemId, quantityInCart - 1);
  };

  return (
    <div className="space-y-4">
      {/* Size Selector - Only show if there are multiple sizes */}
      {product.prices.length > 1 && (
        <div>
          <label htmlFor="size-select" className="block text-sm font-medium mb-2">
            Select Size
          </label>
          <select
            id="size-select"
            value={selectedPriceId}
            onChange={(e) => setSelectedPriceId(e.target.value)}
            className="w-full py-3 px-4 bg-background border border-input rounded-md text-base focus:border-ring focus:outline-none transition-colors"
          >
            {product.prices.map((price) => (
              <option key={price.priceId} value={price.priceId}>
                {price.nickname || "Default"} - ${(price.amount / 100).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Availability Info */}
      {inStock && maxQuantity !== null && (
        <div className="text-sm text-muted-foreground">
          {quantityInCart > 0 ? (
            <>
              <span className="font-medium">{Math.max(0, maxQuantity - quantityInCart)}</span> more available for this size
            </>
          ) : (
            <>
              <span className="font-medium">{maxQuantity}</span> available for this size
            </>
          )}
        </div>
      )}

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
            onClick={openCart}
            className="flex-[2] py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors cursor-pointer text-lg"
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
