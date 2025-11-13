/**
 * API Route to remove duplicate products
 * Call this to clean up any duplicate products with the same stripeProductId
 *
 * Usage: POST to /api/cleanup-duplicates
 */

import { removeDuplicateProducts } from "@/sanity/lib/products";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await removeDuplicateProducts();

    return NextResponse.json({
      success: true,
      message: "Successfully cleaned up duplicate products",
    });
  } catch (error) {
    console.error("Error cleaning up duplicates:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clean up duplicates",
      },
      { status: 500 }
    );
  }
}
