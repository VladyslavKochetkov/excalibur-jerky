"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";

export interface CartItem {
  id: string; // Unique cart item ID: `${productId}-${priceId}`
  productId: string; // Square item ID
  priceId: string; // Square variation ID
  name: string; // Product name
  sizeNickname: string; // Size variant (e.g., "4oz", "8oz")
  price: number; // Price for this variant (in dollars)
  quantity: number; // Number of items in cart
  baseUnits: number; // Base units per item (4oz = 1, 8oz = 2, etc.)
  maxQuantity?: number | null; // Max items available (accounting for base units)
  totalInventory?: number | null; // Total inventory in base units (from Square)
  imageUrl?: string; // Optional product image URL
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  validateCart: (products: Array<{
    _id: string;
    stripeProductId: string;
    prices?: Array<{ priceId: string; baseUnits: number }> | null;
    inventory: { quantity: number | null; available: boolean };
    primaryImageUrl?: string;
  }>) => void;
}

const CART_STORAGE_KEY = "excalibury-cart";
const INVENTORY_STORAGE_KEY = "excalibury-cart-inventory";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Track total available inventory per product (in base units)
  const [productInventory, setProductInventory] = useState<Map<string, number>>(new Map());

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart) as CartItem[];
        setItems(parsedCart);
      }

      const savedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (savedInventory) {
        const inventoryObj = JSON.parse(savedInventory);
        setProductInventory(new Map(Object.entries(inventoryObj).map(([k, v]) => [k, Number(v)])));
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

  // Save inventory to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized && productInventory.size > 0) {
      try {
        const inventoryObj = Object.fromEntries(productInventory);
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryObj));
      } catch (error) {
        console.error("Failed to save inventory to localStorage:", error);
      }
    }
  }, [productInventory, isInitialized]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      // Store inventory information when item is first added
      if (item.totalInventory !== null && item.totalInventory !== undefined && !productInventory.has(item.productId)) {
        setProductInventory(new Map(productInventory.set(item.productId, item.totalInventory)));
      }

      const existing = prev.find((i) => i.id === item.id);
      let updatedItems: CartItem[];

      if (existing) {
        // Calculate total base units currently used by this product (all variants)
        const totalUsedByProduct = prev
          .filter(i => i.productId === item.productId)
          .reduce((sum, i) => sum + (i.baseUnits * i.quantity), 0);

        const totalAvailable = productInventory.get(item.productId);
        const remainingBaseUnits = totalAvailable !== undefined ? totalAvailable - totalUsedByProduct : Infinity;

        // Calculate how many more we can add
        const canAddBaseUnits = Math.floor(remainingBaseUnits / item.baseUnits);
        const newQuantity = Math.min(existing.quantity + item.quantity, existing.quantity + canAddBaseUnits);

        updatedItems = prev.map((i) =>
          i.id === item.id ? { ...i, quantity: newQuantity } : i
        );
      } else {
        // New item - check if we have enough inventory
        const totalUsedByProduct = prev
          .filter(i => i.productId === item.productId)
          .reduce((sum, i) => sum + (i.baseUnits * i.quantity), 0);

        const totalAvailable = productInventory.get(item.productId);
        const remainingBaseUnits = totalAvailable !== undefined ? totalAvailable - totalUsedByProduct : Infinity;
        const maxCanAdd = Math.floor(remainingBaseUnits / item.baseUnits);

        const actualQuantity = Math.min(item.quantity, maxCanAdd);
        updatedItems = [...prev, { ...item, quantity: actualQuantity }];
      }

      // Recalculate max quantities for all variants of this product
      const totalAvailable = productInventory.get(item.productId);
      if (totalAvailable !== undefined) {
        const inventoryMap = new Map([[item.productId, totalAvailable]]);
        return recalculateMaxQuantities(updatedItems, inventoryMap);
      }

      return updatedItems;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const removedItem = prev.find(i => i.id === id);
      const updatedItems = prev.filter((i) => i.id !== id);

      // Recalculate max quantities for remaining items of the same product
      if (removedItem) {
        const totalAvailable = productInventory.get(removedItem.productId);
        if (totalAvailable !== undefined) {
          const inventoryMap = new Map([[removedItem.productId, totalAvailable]]);
          return recalculateMaxQuantities(updatedItems, inventoryMap);
        }
      }

      return updatedItems;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;

      // Calculate total base units used by this product (excluding current item)
      const usedByOthers = prev
        .filter(i => i.productId === item.productId && i.id !== id)
        .reduce((sum, i) => sum + (i.baseUnits * i.quantity), 0);

      const totalAvailable = productInventory.get(item.productId);
      const remainingBaseUnits = totalAvailable !== undefined ? totalAvailable - usedByOthers : Infinity;
      const maxForThisItem = Math.floor(remainingBaseUnits / item.baseUnits);

      // Cap quantity at max available
      const actualQuantity = Math.min(quantity, maxForThisItem);

      const updatedItems = prev.map((i) => {
        if (i.id === id) {
          return { ...i, quantity: actualQuantity };
        }
        return i;
      });

      // Recalculate max quantities for all variants
      if (totalAvailable !== undefined) {
        const inventoryMap = new Map([[item.productId, totalAvailable]]);
        return recalculateMaxQuantities(updatedItems, inventoryMap);
      }

      return updatedItems;
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => {
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  // Recalculate max quantities for all items based on shared inventory
  const recalculateMaxQuantities = (items: CartItem[], availableInventory: Map<string, number>): CartItem[] => {
    // Recalculate max quantity for each item
    return items.map(item => {
      const totalAvailable = availableInventory.get(item.productId);
      if (totalAvailable === null || totalAvailable === undefined) {
        return item; // No inventory info, keep as is
      }

      // Calculate how many base units are used by OTHER variants of this product (not including this item)
      const usedByOthers = items
        .filter(i => i.productId === item.productId && i.id !== item.id)
        .reduce((sum, i) => sum + (i.baseUnits * i.quantity), 0);

      // Remaining base units = total available - used by others (this item's usage is NOT subtracted)
      const remainingBaseUnits = totalAvailable - usedByOthers;

      // Max quantity for THIS item = remaining / this item's base units
      // This represents the TOTAL max you can have in cart (including what's already there)
      const maxForThisItem = Math.floor(remainingBaseUnits / item.baseUnits);

      return {
        ...item,
        maxQuantity: maxForThisItem > 0 ? maxForThisItem : 0
      };
    });
  };

  // Validate cart items against current product inventory (using base units)
  const validateCart = (products: Array<{
    _id: string;
    stripeProductId: string;
    prices?: Array<{ priceId: string; baseUnits: number }> | null;
    inventory: { quantity: number | null; available: boolean };
    primaryImageUrl?: string;
  }>) => {
    // Create maps for quick lookup
    const productMapBySanityId = new Map(products.map(p => [p._id, p]));
    const productMapByStripeId = new Map(products.map(p => [p.stripeProductId, p]));

    let removedItems: string[] = [];
    let adjustedItems: Array<{ name: string; from: number; to: number }> = [];

    setItems((prev) => {
      // First, validate and filter items
      const validatedItems = prev.filter((cartItem) => {
        // Try to find product by Sanity ID or Stripe product ID
        const product = productMapBySanityId.get(cartItem.productId) ||
                       productMapByStripeId.get(cartItem.productId);

        // Product no longer exists or is out of stock
        if (!product || !product.inventory.available) {
          removedItems.push(`${cartItem.name} (${cartItem.sizeNickname})`);
          return false;
        }

        // Check if the price variant still exists for this product
        const priceExists = product.prices?.some(p => p.priceId === cartItem.priceId) ?? false;
        if (!priceExists) {
          removedItems.push(`${cartItem.name} (${cartItem.sizeNickname})`);
          return false;
        }

        return true;
      });

      // Calculate total base units required per product and update max quantities
      const updatedItems = validatedItems.map((cartItem) => {
        const product = productMapBySanityId.get(cartItem.productId) ||
                       productMapByStripeId.get(cartItem.productId);

        if (!product) return cartItem;

        const availableBaseUnits = product.inventory.quantity;

        // Update imageUrl if missing
        const updatedImageUrl = cartItem.imageUrl || product.primaryImageUrl;

        // If inventory is null (unlimited), keep maxQuantity as null
        if (availableBaseUnits === null) {
          return { ...cartItem, maxQuantity: null, imageUrl: updatedImageUrl };
        }

        // Calculate total base units needed for all variants of this product in cart
        const totalBaseUnitsInCart = validatedItems
          .filter(item => item.productId === cartItem.productId)
          .reduce((sum, item) => sum + (item.quantity * item.baseUnits), 0);

        // Calculate max quantity for THIS specific cart item
        // Max = (available base units - base units used by other variants) / this item's base units
        const baseUnitsUsedByOthers = validatedItems
          .filter(item => item.productId === cartItem.productId && item.id !== cartItem.id)
          .reduce((sum, item) => sum + (item.quantity * item.baseUnits), 0);

        const remainingBaseUnits = Math.max(0, availableBaseUnits - baseUnitsUsedByOthers);
        const maxQty = Math.floor(remainingBaseUnits / cartItem.baseUnits);

        // Check if current quantity exceeds max
        if (cartItem.quantity > maxQty) {
          if (maxQty === 0) {
            // No stock left for this variant
            removedItems.push(`${cartItem.name} (${cartItem.sizeNickname})`);
            return null; // Will be filtered out
          } else {
            // Reduce quantity
            adjustedItems.push({
              name: `${cartItem.name} (${cartItem.sizeNickname})`,
              from: cartItem.quantity,
              to: maxQty,
            });
            return { ...cartItem, quantity: maxQty, maxQuantity: maxQty, imageUrl: updatedImageUrl };
          }
        }

        return { ...cartItem, maxQuantity: maxQty, imageUrl: updatedImageUrl };
      }).filter((item): item is CartItem => item !== null);

      return updatedItems;
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
        isCartOpen,
        openCart,
        closeCart,
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
