/**
 * Square Inventory Management
 * Functions for managing inventory with base units logic
 */

import { getSquareClient, getSquareLocationId } from "./client";
import { getSquareVariation } from "./catalog";

/**
 * Update inventory for a catalog item variation
 * @param variationId - Square catalog variation ID
 * @param quantity - New quantity in base units
 */
export async function updateSquareInventory(
  variationId: string,
  quantity: number
): Promise<void> {
  try {
    const client = getSquareClient();
    const locationId = getSquareLocationId();

    // Get current inventory count
    const { result: currentResult } =
      await client.inventory.batchRetrieveInventoryCounts({
        catalogObjectIds: [variationId],
        locationIds: [locationId],
      });

    const currentCount = currentResult.counts?.[0];
    const currentQuantity = currentCount?.quantity
      ? Number.parseInt(currentCount.quantity, 10)
      : 0;

    // Calculate the adjustment needed
    const adjustment = quantity - currentQuantity;

    if (adjustment === 0) return;

    // Create inventory adjustment
    await client.inventory.batchChangeInventory({
      idempotencyKey: `inv-${variationId}-${Date.now()}`,
      changes: [
        {
          type: "ADJUSTMENT",
          adjustment: {
            catalogObjectId: variationId,
            locationId,
            quantity: Math.abs(adjustment).toString(),
            fromState: adjustment > 0 ? "NONE" : "IN_STOCK",
            toState: adjustment > 0 ? "IN_STOCK" : "NONE",
            occurredAt: new Date().toISOString(),
          },
        },
      ],
    });
  } catch (error) {
    console.error(
      `Error updating inventory for variation ${variationId}:`,
      error
    );
    throw error;
  }
}

/**
 * Decrement inventory for a variation by base units
 * @param variationId - Square catalog variation ID
 * @param quantity - Number of items purchased (will be multiplied by base units)
 * Returns the new quantity
 */
export async function decrementInventory(
  variationId: string,
  quantity = 1
): Promise<number> {
  try {
    const client = getSquareClient();
    const locationId = getSquareLocationId();

    // Get variation details to determine base units
    const variationData = await getSquareVariation(variationId);
    if (!variationData) {
      throw new Error(`Variation ${variationId} not found`);
    }

    const { baseUnits } = variationData;

    // Get current inventory
    const { result: currentResult } =
      await client.inventory.batchRetrieveInventoryCounts({
        catalogObjectIds: [variationId],
        locationIds: [locationId],
      });

    const currentCount = currentResult.counts?.[0];
    const currentQuantity = currentCount?.quantity
      ? Number.parseInt(currentCount.quantity, 10)
      : 0;

    // Calculate decrement (quantity * base units)
    const decrementBy = quantity * baseUnits;
    const newQuantity = Math.max(0, currentQuantity - decrementBy);

    if (decrementBy <= 0) return currentQuantity;

    // Create inventory adjustment to decrement
    await client.inventory.batchChangeInventory({
      idempotencyKey: `dec-${variationId}-${Date.now()}`,
      changes: [
        {
          type: "ADJUSTMENT",
          adjustment: {
            catalogObjectId: variationId,
            locationId,
            quantity: decrementBy.toString(),
            fromState: "IN_STOCK",
            toState: "SOLD",
            occurredAt: new Date().toISOString(),
          },
        },
      ],
    });

    return newQuantity;
  } catch (error) {
    console.error(
      `Error decrementing inventory for variation ${variationId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get current inventory count for a variation
 */
export async function getInventoryCount(variationId: string): Promise<number> {
  try {
    const client = getSquareClient();
    const locationId = getSquareLocationId();

    const { result } = await client.inventory.batchRetrieveInventoryCounts({
      catalogObjectIds: [variationId],
      locationIds: [locationId],
    });

    const count = result.counts?.[0];
    return count?.quantity ? Number.parseInt(count.quantity, 10) : 0;
  } catch (error) {
    console.error(
      `Error getting inventory count for variation ${variationId}:`,
      error
    );
    return 0;
  }
}

/**
 * Batch get inventory counts for multiple variations
 */
export async function batchGetInventoryCounts(
  variationIds: string[]
): Promise<Map<string, number>> {
  try {
    const client = getSquareClient();
    const locationId = getSquareLocationId();

    if (variationIds.length === 0) {
      return new Map();
    }

    const { result } = await client.inventory.batchRetrieveInventoryCounts({
      catalogObjectIds: variationIds,
      locationIds: [locationId],
    });

    const inventoryMap = new Map<string, number>();
    for (const count of result.counts || []) {
      if (count.catalogObjectId && count.quantity) {
        inventoryMap.set(
          count.catalogObjectId,
          Number.parseInt(count.quantity, 10)
        );
      }
    }

    return inventoryMap;
  } catch (error) {
    console.error("Error batch getting inventory counts:", error);
    return new Map();
  }
}
