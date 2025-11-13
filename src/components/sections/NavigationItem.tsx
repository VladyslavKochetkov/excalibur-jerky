"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC, PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

export const NavigationItem: FC<
  PropsWithChildren<{
    href: string;
  }>
> = ({ href, children }) => {
  const pathname = usePathname();

  return (
    <li
      className={twMerge(
        "text-gray-300 hover:text-gray-100",
        pathname === href && "border-b border-white text-white",
      )}
    >
      <Link href={href}>{children}</Link>
    </li>
  );
};
