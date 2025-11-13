/**
 * API Route to fix missing _key properties in product descriptions
 * Call this once to repair existing products with invalid descriptions
 *
 * Usage: POST to /api/fix-descriptions
 */

import { fixAllProductDescriptionKeys } from "@/sanity/lib/products";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await fixAllProductDescriptionKeys();

    return NextResponse.json({
      success: true,
      message: "Successfully fixed all product descriptions",
    });
  } catch (error) {
    console.error("Error fixing product descriptions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fix product descriptions",
      },
      { status: 500 }
    );
  }
}
