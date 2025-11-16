"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, Search, ShoppingBag } from "lucide-react";
import type { SanityProduct } from "@/sanity/lib/products";
import { urlFor } from "@/sanity/lib/image";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: SanityProduct[];
}

export function SearchModal({ isOpen, onClose, products }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<SanityProduct[]>([]);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.subtitle?.toLowerCase().includes(query)
    );

    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setFilteredProducts([]);
    }
  }, [isOpen]);

  const handleProductClick = () => {
    onClose();
  };

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
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-zinc-950 border border-zinc-800 z-50 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col mx-4"
          >
            {/* Header with Search Input */}
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <Search className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Search Products</h2>
                <button
                  onClick={onClose}
                  className="ml-auto p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for jerky products..."
                  className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-6">
              {searchQuery.trim() === "" ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Search className="w-12 h-12 text-zinc-700 mb-3" />
                  <p className="text-zinc-400 text-sm">
                    Start typing to search for products
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <ShoppingBag className="w-12 h-12 text-zinc-700 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No products found
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Try searching with different keywords
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((product) => {
                    const imageUrl = product.primaryImage
                      ? urlFor(product.primaryImage).width(120).height(120).url()
                      : null;

                    return (
                      <Link
                        key={product._id}
                        href={`/catalog/${product._id}`}
                        onClick={handleProductClick}
                        className="flex gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:bg-zinc-900 transition-all group"
                      >
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-zinc-600 transition-all">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={product.primaryImage?.alt || product.name}
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
                          <h3 className="font-semibold text-white text-base mb-1 group-hover:text-zinc-200 transition-colors">
                            {product.name}
                          </h3>
                          {product.subtitle && (
                            <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
                              {product.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-white">
                              ${product.price.toFixed(2)}
                            </p>
                            {product.currentlyDiscounted && product.currentlyDiscounted > 0 && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-md font-semibold">
                                {product.currentlyDiscounted}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredProducts.length > 0 && (
              <div className="border-t border-zinc-800 p-4 bg-zinc-950">
                <p className="text-xs text-zinc-500 text-center">
                  Found {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
