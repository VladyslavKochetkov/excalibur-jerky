"use client";

import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ProductCardProps {
  product: {
    _id: string;
    stripeProductId: string;
    stripePriceId: string;
    name: string;
    price: number;
    originalPrice?: number;
    subtitle?: string; // Short text subtitle from Stripe
    description?: unknown[]; // Rich text description from Sanity
    isFeatured: boolean;
    inventory: {
      quantity: number | null;
      available: boolean;
    };
    primaryImageUrl?: string;
    primaryImageAlt?: string;
    additionalImageUrls?: string[];
    source?: "sanity" | "stripe";
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items, updateQuantity } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  // Check if item is in cart
  const cartItem = items.find((item) => item.id === product._id);
  const quantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking add to cart
    e.stopPropagation();

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

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we can add more (if inventory quantity is set)
    const maxQuantity = product.inventory?.quantity;
    if (maxQuantity !== null && quantityInCart >= maxQuantity) {
      return; // Don't allow adding more than available stock
    }

    updateQuantity(product._id, quantityInCart + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product._id, quantityInCart - 1);
  };

  const inStock = product.inventory?.available ?? false;
  const maxQuantity = product.inventory?.quantity;
  const canAddMore = maxQuantity === null || quantityInCart < maxQuantity;

  return (
    <Link
      href={`/catalog/${product._id}`}
      className="group block relative"
    >
      {/* Modern Card Container with Glass Morphism */}
      <div className="relative bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden transition-all duration-500 hover:border-zinc-700 hover:shadow-2xl hover:shadow-zinc-900/50 hover:-translate-y-1">
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700/0 via-zinc-700/0 to-zinc-700/0 group-hover:from-zinc-600/10 group-hover:via-zinc-700/5 group-hover:to-zinc-800/10 transition-all duration-500 pointer-events-none" />

        {/* Product Image */}
        <div className="relative aspect-[4/3] bg-zinc-900/50 overflow-hidden cursor-pointer">
          {product.primaryImageUrl ? (
            <>
              <Image
                src={product.primaryImageUrl}
                alt={product.primaryImageAlt || product.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {/* Image overlay for better text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
              No Image
            </div>
          )}

          {/* Featured Badge - Modern Glass Style */}
          {product.isFeatured && (
            <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              Featured
            </div>
          )}

          {/* Sale Badge - Modern Style */}
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-red-500/30">
              SAVE ${(product.originalPrice - product.price).toFixed(2)}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="relative p-4 space-y-3">
          <h2 className="text-base font-bold mb-1 line-clamp-1 text-white">{product.name}</h2>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-zinc-500 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            {inStock ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {product.inventory?.quantity !== null
                  ? `${product.inventory.quantity} left`
                  : "In Stock"}
              </span>
            ) : (
              <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Out of Stock
              </span>
            )}
          </div>

          {/* Subtitle under price */}
          {product.subtitle && (
            <div className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
              <p>{product.subtitle}</p>
            </div>
          )}

          {/* Add to Cart Button or Quantity Controls */}
          {quantityInCart > 0 ? (
            // Show quantity controls when item is in cart - Modern Style
            <div className="w-full flex gap-2">
              <button
                type="button"
                onClick={handleDecrement}
                className="flex-1 py-2.5 px-3 bg-gradient-to-br from-white to-zinc-100 text-zinc-900 font-bold rounded-xl hover:from-zinc-100 hover:to-zinc-200 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm"
              >
                −
              </button>
              <button
                type="button"
                className="flex-[2] py-2.5 px-3 bg-gradient-to-br from-white to-zinc-100 text-zinc-900 font-bold rounded-xl cursor-default shadow-lg text-sm"
              >
                {quantityInCart} in cart
              </button>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={!inStock || !canAddMore}
                className="flex-1 py-2.5 px-3 bg-gradient-to-br from-white to-zinc-100 text-zinc-900 font-bold rounded-xl hover:from-zinc-100 hover:to-zinc-200 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none text-sm"
              >
                +
              </button>
            </div>
          ) : (
            // Show add to cart button when item is not in cart - Modern Style
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!inStock || isAdding}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-white to-zinc-100 text-zinc-900 font-bold rounded-xl hover:from-zinc-100 hover:to-zinc-200 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none text-sm"
            >
              {isAdding
                ? "Added!"
                : inStock
                  ? "Add to Cart"
                  : "Out of Stock"}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
