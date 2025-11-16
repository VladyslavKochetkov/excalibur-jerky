"use client";

import Link from "next/link";
import { type FC, useEffect, useState } from "react";
import { FaShoppingBag } from "react-icons/fa";
import { FaMagnifyingGlass } from "react-icons/fa6";
import type { SanityProduct } from "@/sanity/lib/products";
import { getAllProducts } from "@/sanity/lib/products";
import { useCart } from "../../contexts/CartContext";
import { CartModal } from "../CartModal";
import { SearchModal } from "../SearchModal";
import { Button } from "../ui/button";
import { NavigationItem } from "./NavigationItem";

export const Navigation: FC = () => {
  const { totalItems, isCartOpen, openCart, closeCart } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [products, setProducts] = useState<SanityProduct[]>([]);

  // Fetch products for search
  useEffect(() => {
    async function fetchProducts() {
      try {
        const allProducts = await getAllProducts();
        setProducts(allProducts);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    }
    fetchProducts();
  }, []);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  return (
    <>
      <section className="container flex justify-between mx-auto py-4 items-center gap-2 px-2 lg:px-0">
        <Button variant="light" size="icon" onClick={openSearch}>
          <FaMagnifyingGlass className="size-5" />
        </Button>
        <h1 className="text-xl font-medium">
          <Link href="/">Excalibur Jerky Co.</Link>
        </h1>
        <Button
          variant="light"
          size="icon"
          className="relative"
          onClick={openCart}
        >
          <FaShoppingBag className="size-5" />
          {totalItems > 0 && (
            <span className="border border-background absolute bottom-0.5 right-0.5 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {totalItems > 9 ? "+" : totalItems}
            </span>
          )}
        </Button>
      </section>
      <nav className="flex items-center justify-center pt-2 pb-4">
        <ol className="flex gap-4 text-sm">
          <NavigationItem href="/">Home</NavigationItem>
          <NavigationItem href="/catalog">Catalog</NavigationItem>
          <NavigationItem href="/contact">Contact Us</NavigationItem>
          <NavigationItem href="/about-us">About Us</NavigationItem>
        </ol>
      </nav>
      <div className="h-px w-full bg-muted" />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        products={products}
      />

      {/* Cart Modal */}
      <CartModal isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
};
