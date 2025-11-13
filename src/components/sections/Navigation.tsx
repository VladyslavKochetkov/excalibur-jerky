"use client";

import Link from "next/link";
import type { FC } from "react";
import { FaShoppingBag } from "react-icons/fa";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { useCart } from "../../contexts/CartContext";
import { Button } from "../ui/button";
import { NavigationItem } from "./NavigationItem";

export const Navigation: FC = () => {
  const { totalItems } = useCart();

  return (
    <>
      <section className="container flex justify-between mx-auto py-4 items-center gap-2 px-2 lg:px-0">
        <Button variant="light" size="icon">
          <FaMagnifyingGlass className="size-5" />
        </Button>
        <h1 className="text-xl font-medium">
          <Link href="https://www.excaliburjerky.com">Excalibur Jerky Co.</Link>
        </h1>
        <Button variant="light" size="icon" className="relative">
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
          <NavigationItem href="/contact-us">Contact Us</NavigationItem>
          <NavigationItem href="/about-us">About Us</NavigationItem>
        </ol>
      </nav>
      <div className="h-px w-full bg-muted" />
    </>
  );
};
