/**
 * Square Catalog Utility
 * Functions for fetching products (items) and inventory from Square
 */

import type {
  CatalogObject,
  CatalogItemVariation,
  InventoryCount,
} from "square";
import { getSquareClient, getSquareLocationId } from "./client";

export interface SquarePriceVariant {
  variationId: string;
  nickname: string | null;
  amount: number; // in cents
  currency: string;
  baseUnits: number; // Number of base 4oz units this represents
}

export interface SquareProductWithInventory {
  id: string;
  name: string;
  description: string | null;
  prices: SquarePriceVariant[]; // Array of price variants
  currency: string;
  images: string[];
  inventory: {
    quantity: number | null; // Quantity in base units (4oz packages)
    available: boolean;
  };
  metadata: Record<string, string>;
}

/**
 * Extract base units from variation custom attributes or name
 * Returns the multiplier for base units (4oz = 1, 8oz = 2, 12oz = 3, 1lb = 4)
 */
function extractBaseUnits(
  variation: CatalogItemVariation,
  name: string | null
): number {
  // First, check if custom attributes have base_units
  const customAttributes = variation.itemOptionValues || [];
  // Square uses custom attributes differently, check item_variation_data
  const baseUnitsAttr = variation.customAttributeValues?.base_units;
  if (baseUnitsAttr?.stringValue) {
    const parsed = Number.parseInt(baseUnitsAttr.stringValue, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // Fallback: Try to extract from variation name
  if (name) {
    const lowerName = name.toLowerCase().trim();
    if (lowerName.includes("1 lb") || lowerName.includes("1lb")) {
      return 4; // 16oz = 4 x 4oz
    }
    if (lowerName.includes("12oz") || lowerName.includes("12 oz")) {
      return 3; // 12oz = 3 x 4oz
    }
    if (lowerName.includes("8oz") || lowerName.includes("8 oz")) {
      return 2; // 8oz = 2 x 4oz
    }
    if (lowerName.includes("4oz") || lowerName.includes("4 oz")) {
      return 1; // 4oz = 1 x 4oz (base unit)
    }
  }

  // Default to 1 if we can't determine
  return 1;
}

/**
 * Convert Square Money amount (bigint in cents) to number
 */
function moneyToNumber(amount: bigint | undefined): number {
  if (!amount) return 0;
  return Number(amount);
}

/**
 * Fetch all active items from Square with all their variations
 */
export async function getSquareProducts(): Promise<
  SquareProductWithInventory[]
> {
  try {
    const client = getSquareClient();
    const locationId = getSquareLocationId();

    // Fetch all items from catalog
    const { result } = await client.catalog.listCatalog({
      types: ["ITEM"],
    });

    const items = result.objects || [];

    // Get all variation IDs for inventory lookup
    const variationIds: string[] = [];
    for (const item of items) {
      const variations = item.itemData?.variations || [];
      for (const variation of variations) {
        if (variation.id) {
          variationIds.push(variation.id);
        }
      }
    }

    // Fetch inventory counts for all variations
    let inventoryCounts: InventoryCount[] = [];
    if (variationIds.length > 0) {
      const inventoryResult =
        await client.inventory.batchRetrieveInventoryCounts({
          catalogObjectIds: variationIds,
          locationIds: [locationId],
        });
      inventoryCounts = inventoryResult.result.counts || [];
    }

    // Create a map of variation ID to inventory count
    const inventoryMap = new Map<string, number>();
    for (const count of inventoryCounts) {
      if (count.catalogObjectId && count.quantity) {
        inventoryMap.set(
          count.catalogObjectId,
          Number.parseInt(count.quantity, 10)
        );
      }
    }

    // Fetch all images
    const imageIds: string[] = [];
    for (const item of items) {
      if (item.itemData?.imageIds) {
        imageIds.push(...item.itemData.imageIds);
      }
    }

    // Batch retrieve images
    let imageMap = new Map<string, string>();
    if (imageIds.length > 0) {
      const imageResult = await client.catalog.batchRetrieveCatalogObjects({
        objectIds: imageIds,
      });
      for (const obj of imageResult.result.objects || []) {
        if (obj.id && obj.imageData?.url) {
          imageMap.set(obj.id, obj.imageData.url);
        }
      }
    }

    // Transform items into our format
    const productsWithPrices: SquareProductWithInventory[] = [];

    for (const item of items) {
      if (!item.itemData || !item.id) continue;

      const variations = item.itemData.variations || [];

      // Transform variations into price variants
      const priceVariants: SquarePriceVariant[] = [];
      let totalInventory = 0;

      for (const variation of variations) {
        if (!variation.id || !variation.itemVariationData) continue;

        const varData = variation.itemVariationData;
        const name = varData.name || null;
        const baseUnits = extractBaseUnits(varData, name);

        // Get inventory for this variation (in base units)
        const variationInventory = inventoryMap.get(variation.id) || 0;
        // Convert variation inventory to base units contribution
        // The inventory stored IS in base units already
        totalInventory += variationInventory;

        priceVariants.push({
          variationId: variation.id,
          nickname: name,
          amount: moneyToNumber(varData.priceMoney?.amount),
          currency: varData.priceMoney?.currency || "USD",
          baseUnits,
        });
      }

      // Get images for this item
      const images: string[] = [];
      for (const imageId of item.itemData.imageIds || []) {
        const imageUrl = imageMap.get(imageId);
        if (imageUrl) {
          images.push(imageUrl);
        }
      }

      // Build metadata from custom attributes
      const metadata: Record<string, string> = {};
      if (item.customAttributeValues) {
        for (const [key, value] of Object.entries(item.customAttributeValues)) {
          if (value.stringValue) {
            metadata[key] = value.stringValue;
          }
        }
      }

      // Get stock from metadata if available (for backwards compatibility)
      let inventoryQuantity: number | null = totalInventory;
      if (metadata.stock) {
        inventoryQuantity = Number.parseInt(metadata.stock, 10);
        if (Number.isNaN(inventoryQuantity)) {
          inventoryQuantity = totalInventory;
        }
      }

      productsWithPrices.push({
        id: item.id,
        name: item.itemData.name || "Unnamed Product",
        description: item.itemData.description || null,
        prices: priceVariants,
        currency: priceVariants[0]?.currency || "USD",
        images,
        inventory: {
          quantity: inventoryQuantity,
          available: (inventoryQuantity ?? 0) > 0,
        },
        metadata,
      });
    }

    // Only return items that have at least one variation
    return productsWithPrices.filter((p) => p.prices.length > 0);
  } catch (error) {
    console.error("Error fetching Square products:", error);
    throw error;
  }
}

/**
 * Get a single item by ID from Square with all its variations
 */
export async function getSquareProduct(
  itemId: string
): Promise<SquareProductWithInventory | null> {
  try {
    const client = getSquareClient();
    const locationId = getSquareLocationId();

    // Fetch the item
    const { result } = await client.catalog.retrieveCatalogObject({
      objectId: itemId,
      includeRelatedObjects: true,
    });

    const item = result.object;
    if (!item || !item.itemData) {
      return null;
    }

    const variations = item.itemData.variations || [];

    // Get variation IDs for inventory lookup
    const variationIds = variations
      .map((v) => v.id)
      .filter((id): id is string => !!id);

    // Fetch inventory counts
    let inventoryCounts: InventoryCount[] = [];
    if (variationIds.length > 0) {
      const inventoryResult =
        await client.inventory.batchRetrieveInventoryCounts({
          catalogObjectIds: variationIds,
          locationIds: [locationId],
        });
      inventoryCounts = inventoryResult.result.counts || [];
    }

    // Create inventory map
    const inventoryMap = new Map<string, number>();
    for (const count of inventoryCounts) {
      if (count.catalogObjectId && count.quantity) {
        inventoryMap.set(
          count.catalogObjectId,
          Number.parseInt(count.quantity, 10)
        );
      }
    }

    // Transform variations
    const priceVariants: SquarePriceVariant[] = [];
    let totalInventory = 0;

    for (const variation of variations) {
      if (!variation.id || !variation.itemVariationData) continue;

      const varData = variation.itemVariationData;
      const name = varData.name || null;
      const baseUnits = extractBaseUnits(varData, name);

      const variationInventory = inventoryMap.get(variation.id) || 0;
      totalInventory += variationInventory;

      priceVariants.push({
        variationId: variation.id,
        nickname: name,
        amount: moneyToNumber(varData.priceMoney?.amount),
        currency: varData.priceMoney?.currency || "USD",
        baseUnits,
      });
    }

    // Get images from related objects
    const images: string[] = [];
    for (const related of result.relatedObjects || []) {
      if (related.type === "IMAGE" && related.imageData?.url) {
        images.push(related.imageData.url);
      }
    }

    // Build metadata
    const metadata: Record<string, string> = {};
    if (item.customAttributeValues) {
      for (const [key, value] of Object.entries(item.customAttributeValues)) {
        if (value.stringValue) {
          metadata[key] = value.stringValue;
        }
      }
    }

    let inventoryQuantity: number | null = totalInventory;
    if (metadata.stock) {
      inventoryQuantity = Number.parseInt(metadata.stock, 10);
      if (Number.isNaN(inventoryQuantity)) {
        inventoryQuantity = totalInventory;
      }
    }

    return {
      id: item.id!,
      name: item.itemData.name || "Unnamed Product",
      description: item.itemData.description || null,
      prices: priceVariants,
      currency: priceVariants[0]?.currency || "USD",
      images,
      inventory: {
        quantity: inventoryQuantity,
        available: (inventoryQuantity ?? 0) > 0,
      },
      metadata,
    };
  } catch (error) {
    console.error(`Error fetching Square product ${itemId}:`, error);
    return null;
  }
}

/**
 * Get variation details by ID
 */
export async function getSquareVariation(
  variationId: string
): Promise<{ itemId: string; variation: CatalogItemVariation; baseUnits: number } | null> {
  try {
    const client = getSquareClient();

    const { result } = await client.catalog.retrieveCatalogObject({
      objectId: variationId,
    });

    const variation = result.object;
    if (!variation || variation.type !== "ITEM_VARIATION" || !variation.itemVariationData) {
      return null;
    }

    const varData = variation.itemVariationData;
    const baseUnits = extractBaseUnits(varData, varData.name || null);

    return {
      itemId: varData.itemId || "",
      variation: varData,
      baseUnits,
    };
  } catch (error) {
    console.error(`Error fetching Square variation ${variationId}:`, error);
    return null;
  }
}
