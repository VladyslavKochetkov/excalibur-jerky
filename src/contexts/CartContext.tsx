"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stripePriceId: string; // Stripe price ID for checkout
  maxQuantity?: number | null; // Max available quantity (null = unlimited)
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  validateCart: (products: Array<{ _id: string; inventory: { quantity: number | null; available: boolean } }>) => void;
}

const CART_STORAGE_KEY = "excalibury-cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart) as CartItem[];
        setItems(parsedCart);
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes (but skip initial render)
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save cart to localStorage:", error);
      }
    }
  }, [items, isInitialized]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        // Calculate new quantity
        const newQuantity = existing.quantity + item.quantity;

        // Check against max quantity (use the most restrictive one)
        const maxQty = item.maxQuantity !== undefined ? item.maxQuantity : existing.maxQuantity;
        if (maxQty !== null && maxQty !== undefined && newQuantity > maxQty) {
          // Don't exceed max quantity - just set to max
          return prev.map((i) =>
            i.id === item.id ? { ...i, quantity: maxQty, maxQuantity: maxQty } : i
          );
        }

        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: newQuantity, maxQuantity: maxQty } : i
        );
      }

      // New item - check if quantity exceeds max
      if (item.maxQuantity !== null && item.maxQuantity !== undefined && item.quantity > item.maxQuantity) {
        return [...prev, { ...item, quantity: item.maxQuantity }];
      }

      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          // Check against max quantity
          if (i.maxQuantity !== null && i.maxQuantity !== undefined && quantity > i.maxQuantity) {
            // Don't exceed max quantity
            return { ...i, quantity: i.maxQuantity };
          }
          return { ...i, quantity };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // Validate cart items against current product inventory
  const validateCart = (products: Array<{ _id: string; inventory: { quantity: number | null; available: boolean } }>) => {
    const productMap = new Map(products.map(p => [p._id, p]));
    let removedItems: string[] = [];
    let adjustedItems: Array<{ name: string; from: number; to: number }> = [];

    setItems((prev) => {
      const validatedItems = prev.filter((cartItem) => {
        const product = productMap.get(cartItem.id);

        // Product no longer exists or is out of stock
        if (!product || !product.inventory.available) {
          removedItems.push(cartItem.name);
          return false;
        }

        // Check if quantity in cart exceeds available stock
        const maxQty = product.inventory.quantity;
        if (maxQty !== null && cartItem.quantity > maxQty) {
          if (maxQty === 0) {
            // No stock left, remove item
            removedItems.push(cartItem.name);
            return false;
          } else {
            // Reduce quantity to available stock
            adjustedItems.push({
              name: cartItem.name,
              from: cartItem.quantity,
              to: maxQty,
            });
          }
        }

        return true;
      }).map((cartItem) => {
        const product = productMap.get(cartItem.id);
        const maxQty = product?.inventory.quantity;

        // Update quantity and maxQuantity if needed
        if (maxQty !== null && maxQty !== undefined && cartItem.quantity > maxQty) {
          return { ...cartItem, quantity: maxQty, maxQuantity: maxQty };
        }

        // Update maxQuantity to current inventory
        return { ...cartItem, maxQuantity: maxQty };
      });

      return validatedItems;
    });

    // Show toast notifications for removed items
    if (removedItems.length > 0) {
      toast.error(`Removed from cart: ${removedItems.join(", ")}`, {
        description: "These items are no longer available.",
      });
    }

    // Show toast notifications for adjusted quantities
    if (adjustedItems.length > 0) {
      adjustedItems.forEach((item) => {
        toast.warning(`${item.name} quantity updated`, {
          description: `Reduced from ${item.from} to ${item.to} due to limited stock.`,
        });
      });
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        validateCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
