"use client";

import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { StripeCheckoutButton } from "./StripeCheckoutButton";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const { items, updateQuantity, removeItem, totalItems } = useCart();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">
                  Your Cart ({totalItems})
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-16 h-16 text-zinc-700 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-zinc-400 text-sm mb-6">
                    Add some delicious jerky to get started!
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gradient-to-r from-white to-zinc-100 text-zinc-900 font-bold rounded-xl hover:from-zinc-100 hover:to-zinc-200 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex gap-4">
                        {/* Product Image & Info - Clickable */}
                        <Link
                          href={`/catalog/${item.productId}`}
                          onClick={onClose}
                          className="flex gap-4 flex-1 min-w-0 group"
                        >
                          {/* Product Image */}
                          <div className="w-20 h-20 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-zinc-600 transition-all">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-zinc-600" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm mb-1 truncate group-hover:text-zinc-200 transition-colors">
                              {item.name}
                            </h3>
                            <p className="text-xs text-zinc-400 mb-2">
                              {item.sizeNickname}
                            </p>
                            <p className="text-sm font-bold text-white">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                        </Link>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 h-fit hover:bg-zinc-800 rounded-lg transition-colors group"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex-1 text-center">
                          <span className="text-sm font-semibold text-white">
                            Quantity: {item.quantity}
                          </span>
                          {item.maxQuantity !== null && (
                            <span className="text-xs text-zinc-500 block">
                              (max: {item.maxQuantity})
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.maxQuantity != null && item.quantity >= item.maxQuantity}
                          className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Item Subtotal */}
                      <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-xs text-zinc-400">Item Total</span>
                        <span className="text-sm font-bold text-white">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Subtotal and Checkout */}
            {items.length > 0 && (
              <div className="border-t border-zinc-800 p-6 space-y-4 bg-zinc-950">
                {/* Subtotal */}
                <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                  <span className="text-lg font-semibold text-white">Subtotal</span>
                  <span className="text-2xl font-bold text-white">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Checkout Button */}
                <StripeCheckoutButton />

                {/* Continue Shopping */}
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-700 transition-all duration-300"
                >
                  Continue Shopping
                </button>

                {/* Shipping Note */}
                <p className="text-xs text-zinc-500 text-center">
                  Shipping and taxes calculated at checkout
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
