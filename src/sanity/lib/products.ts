import type { Products } from "../../../sanity.types";
import { client } from "./client";
import { urlFor } from "./image";
import { getSquareProduct, getSquareProducts } from "@/lib/square/catalog";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";
import type { CatalogObject } from "square";

/**
 * Generate a random key for Sanity array items
 */
function generateKey(): string {
  return Math.random().toString(36).substring(2, 15);
}

export interface SanityPriceVariant {
  priceId: string; // Square variation ID (kept as priceId for compatibility)
  nickname: string | null;
  amount: number; // in cents
  baseUnits: number;
}

export interface SanityProduct {
  _id: string;
  stripeProductId: string; // Square item ID (kept as stripeProductId for compatibility)
  prices: SanityPriceVariant[]; // Array of price variants (Square variations)
  name: string;
  price: number; // Base price for display (from first/default price)
  currentlyDiscounted?: number; // Discount percentage (0-100)
  subtitle?: string; // Short text from Stripe
  description?: unknown[]; // Portable Text blocks (Sanity only)
  primaryImage?: {
    asset: {
      _ref: string;
      _type: "reference";
    };
    alt?: string;
  };
  additionalImages?: Array<{
    asset: {
      _ref: string;
      _type: "reference";
    };
    alt?: string;
  }>;
  isFeatured: boolean;
}

export interface ProductWithInventory extends SanityProduct {
  inventory: {
    quantity: number | null;
    available: boolean;
  };
}

/**
 * Fetch all products from Sanity
 */
export async function getAllProducts(): Promise<SanityProduct[]> {
  const query = `*[_type == "products"] | order(isFeatured desc, name asc) {
    _id,
    stripeProductId,
    prices,
    name,
    price,
    currentlyDiscounted,
    subtitle,
    description,
    primaryImage,
    additionalImages,
    isFeatured
  }`;

  const products = await client.fetch<SanityProduct[]>(
    query,
    {},
    {
      next: {
        revalidate: 60, // Revalidate every 60 seconds
        tags: ["products"],
      },
    }
  );

  return products;
}

/**
 * Fetch featured products from Sanity
 */
export async function getFeaturedProducts(): Promise<SanityProduct[]> {
  const query = `*[_type == "products" && isFeatured == true] | order(name asc) {
    _id,
    stripeProductId,
    prices,
    name,
    price,
    currentlyDiscounted,
    subtitle,
    description,
    primaryImage,
    additionalImages,
    isFeatured
  }`;

  const products = await client.fetch<SanityProduct[]>(
    query,
    {},
    {
      next: {
        revalidate: 60,
        tags: ["products"],
      },
    }
  );

  return products;
}

/**
 * Fetch a single product by Stripe Product ID
 */
export async function getProductByStripeId(
  stripeProductId: string
): Promise<SanityProduct | null> {
  const query = `*[_type == "products" && stripeProductId == $stripeProductId][0] {
    _id,
    stripeProductId,
    prices,
    name,
    price,
    currentlyDiscounted,
    subtitle,
    description,
    primaryImage,
    additionalImages,
    isFeatured
  }`;

  const product = await client.fetch<SanityProduct | null>(
    query,
    { stripeProductId },
    {
      next: {
        revalidate: 60,
        tags: ["products"],
      },
    }
  );

  return product;
}

/**
 * Fetch a single product by Sanity ID
 */
export async function getProductById(id: string): Promise<SanityProduct | null> {
  const query = `*[_type == "products" && _id == $id][0] {
    _id,
    stripeProductId,
    prices,
    name,
    price,
    currentlyDiscounted,
    subtitle,
    description,
    primaryImage,
    additionalImages,
    isFeatured
  }`;

  const product = await client.fetch<SanityProduct | null>(
    query,
    { id },
    {
      next: {
        revalidate: 60,
        tags: ["products"],
      },
    }
  );

  return product;
}

/**
 * Fetch all products with inventory from Square
 */
export async function getProductsWithInventory(): Promise<
  ProductWithInventory[]
> {
  const products = await getAllProducts();

  // Fetch inventory from Square for each product
  const productsWithInventory = await Promise.all(
    products.map(async (product) => {
      const squareProduct = await getSquareProduct(product.stripeProductId);

      return {
        ...product,
        inventory: squareProduct?.inventory || {
          quantity: null,
          available: true,
        },
      };
    })
  );

  return productsWithInventory;
}

export interface MergedProduct {
  _id: string;
  stripeProductId: string;
  prices: SanityPriceVariant[]; // Array of price variants
  name: string;
  price: number; // Base price for display
  currentlyDiscounted?: number; // Discount percentage
  subtitle?: string; // Short text subtitle from Stripe
  description?: unknown[]; // Rich text description from Sanity only
  primaryImage?: {
    asset?: {
      _ref: string;
      _type: "reference";
    };
    alt?: string;
    url?: string; // URL from Stripe
  };
  additionalImages?: Array<{
    asset?: {
      _ref: string;
      _type: "reference";
    };
    alt?: string;
  }>;
  stripeImages?: string[]; // Additional Square image URLs (kept as stripeImages for compatibility)
  isFeatured: boolean;
  inventory: {
    quantity: number | null; // In base units (4oz packages)
    available: boolean;
  };
  source: "sanity" | "square"; // Track where the primary data came from
}

/**
 * Fetch all products from both Square and Sanity, merging them intelligently
 * - Products in both Square and Sanity: Use Sanity data with Square inventory
 * - Products only in Square: Use Square data
 */
export async function getMergedProducts(): Promise<MergedProduct[]> {
  console.log(`\n🔄 [MERGE] Starting product merge...`);

  // Fetch from both sources in parallel
  const [squareProducts, sanityProducts] = await Promise.all([
    getSquareProducts(),
    getAllProducts(),
  ]);

  console.log(`📦 [MERGE] Fetched ${squareProducts.length} products from Square`);
  console.log(`📦 [MERGE] Fetched ${sanityProducts.length} products from Sanity`);

  console.log(`🔍 [MERGE] Sanity products:`, sanityProducts.map(p => ({
    sanityId: p._id,
    squareItemId: p.stripeProductId,
    name: p.name,
  })));

  // Create a map of Sanity products by Square Item ID for quick lookup
  const sanityProductMap = new Map(
    sanityProducts.map((product) => [product.stripeProductId, product])
  );

  console.log(`🗺️ [MERGE] Created map with ${sanityProductMap.size} Sanity products`);

  // Merge the products
  const mergedProducts: MergedProduct[] = squareProducts.map((squareProduct) => {
    const sanityProduct = sanityProductMap.get(squareProduct.id);

    if (sanityProduct) {
      // Product exists in both: use Sanity data with Square inventory
      console.log(`✅ [MERGE] Merging product from Sanity: ${squareProduct.id} → Sanity ID: ${sanityProduct._id}`);
      return {
        _id: sanityProduct._id,
        stripeProductId: squareProduct.id,
        prices: sanityProduct.prices, // Use prices from Sanity (synced from Square)
        name: sanityProduct.name,
        price: sanityProduct.price,
        currentlyDiscounted: sanityProduct.currentlyDiscounted,
        subtitle: sanityProduct.subtitle,
        description: sanityProduct.description,
        primaryImage: sanityProduct.primaryImage,
        additionalImages: sanityProduct.additionalImages,
        stripeImages: squareProduct.images, // Keep Square images for fallback
        isFeatured: sanityProduct.isFeatured,
        inventory: squareProduct.inventory,
        source: "sanity",
      };
    } else {
      // Product only exists in Square: use Square data
      const tempId = `square-${squareProduct.id}`;
      console.log(`⚠️ [MERGE] Product only in Square (not synced to Sanity): ${squareProduct.id} → Temporary ID: ${tempId}`);
      const firstImage = squareProduct.images[0];
      return {
        _id: tempId, // Generate a temporary ID
        stripeProductId: squareProduct.id,
        prices: squareProduct.prices.map(p => ({
          priceId: p.variationId,
          nickname: p.nickname,
          amount: p.amount,
          baseUnits: p.baseUnits,
        })), // Use prices directly from Square
        name: squareProduct.name,
        price: squareProduct.prices[0]?.amount / 100 || 0, // Base price from first variant
        currentlyDiscounted: undefined,
        subtitle: squareProduct.description || undefined,
        description: undefined,
        primaryImage: firstImage
          ? { url: firstImage, alt: squareProduct.name }
          : undefined,
        additionalImages: undefined,
        stripeImages: squareProduct.images.slice(1), // Rest of images
        isFeatured: false,
        inventory: squareProduct.inventory,
        source: "square",
      };
    }
  });

  console.log(`✅ [MERGE] Merged ${mergedProducts.length} total products`);

  // Sort: featured first, then by name
  return mergedProducts.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Transform a merged product with resolved image URLs
 * Converts Sanity image references to URLs and handles Stripe image URLs
 */
export function transformProductWithImages(product: MergedProduct) {
  // Build primary image URL
  let primaryImageUrl = "";
  if (product.primaryImage) {
    if (product.primaryImage.url) {
      // Stripe image URL
      primaryImageUrl = product.primaryImage.url;
    } else if (product.primaryImage.asset) {
      // Sanity image
      primaryImageUrl = urlFor(product.primaryImage).width(800).height(800).url();
    }
  } else if (product.stripeImages && product.stripeImages.length > 0) {
    // Fallback to first Stripe image
    primaryImageUrl = product.stripeImages[0];
  }

  // Build additional images (from Sanity + remaining Stripe images)
  const additionalImageUrls = [
    ...(product.additionalImages?.map((img) =>
      urlFor(img).width(800).height(800).url()
    ) || []),
    ...(product.stripeImages?.slice(primaryImageUrl ? 0 : 1) || []),
  ];

  return {
    ...product,
    primaryImageUrl,
    primaryImageAlt: product.primaryImage?.alt || product.name,
    additionalImageUrls,
  };
}

/**
 * Fetch merged products and transform them with resolved image URLs
 */
export async function getMergedProductsWithImages() {
  const mergedProducts = await getMergedProducts();
  return mergedProducts.map(transformProductWithImages);
}

/**
 * Get a write client for Sanity mutations
 * This client has a token for write operations
 */
function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      "SANITY_API_WRITE_TOKEN is not defined. Please add it to your environment variables."
    );
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token,
  });
}

/**
 * Download an image from a URL and upload it to Sanity
 * Returns the asset reference object
 */
async function uploadImageToSanity(
  imageUrl: string,
  altText: string
): Promise<{ asset: { _ref: string; _type: "reference" }; alt: string } | null> {
  try {
    console.log(`[Image Upload] Fetching image from: ${imageUrl}`);

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`[Image Upload] Failed to fetch image: ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      console.error(`[Image Upload] Invalid content type: ${contentType}`);
      return null;
    }

    // Get the image as a buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Image Upload] Uploading image to Sanity (${buffer.length} bytes)`);

    const writeClient = getWriteClient();

    // Upload the image to Sanity
    const asset = await writeClient.assets.upload("image", buffer, {
      contentType,
      filename: imageUrl.split("/").pop() || "stripe-product-image.jpg",
    });

    console.log(`[Image Upload] ✅ Successfully uploaded image: ${asset._id}`);

    return {
      asset: {
        _ref: asset._id,
        _type: "reference",
      },
      alt: altText,
    };
  } catch (error) {
    console.error("[Image Upload] ❌ Failed to upload image:", error);
    return null;
  }
}

/**
 * Sync a Square catalog item to Sanity
 * Creates or updates the product in Sanity based on Square data
 */
export async function syncSquareProductToSanity(
  squareItem: CatalogObject
): Promise<void> {
  if (!squareItem.itemData || !squareItem.id) {
    console.warn(`Invalid Square item, skipping sync`);
    return;
  }

  const itemData = squareItem.itemData;
  console.log(`\n🔄 [SYNC START] Syncing product ${squareItem.id} (${itemData.name}) to Sanity`);
  const writeClient = getWriteClient();

  const variations = itemData.variations || [];
  if (variations.length === 0) {
    console.warn(`Product ${squareItem.id} has no variations, skipping sync`);
    return;
  }

  // Extract base units from variation name
  const extractBaseUnits = (name: string | null): number => {
    if (name) {
      const lowerName = name.toLowerCase().trim();
      if (lowerName.includes("1 lb") || lowerName.includes("1lb")) return 4;
      if (lowerName.includes("12oz") || lowerName.includes("12 oz")) return 3;
      if (lowerName.includes("8oz") || lowerName.includes("8 oz")) return 2;
      if (lowerName.includes("4oz") || lowerName.includes("4 oz")) return 1;
    }
    return 1;
  };

  // Transform variations to our price format
  const prices = variations
    .filter(v => v.id && v.itemVariationData)
    .map((variation) => {
      const varData = variation.itemVariationData!;
      return {
        priceId: variation.id!,
        nickname: varData.name || null,
        amount: Number(varData.priceMoney?.amount || 0n),
        baseUnits: extractBaseUnits(varData.name || null),
      };
    });

  console.log(`[Sync] Found ${prices.length} variation(s) for product ${squareItem.id}`);

  // Get base price from first price variant
  const basePrice = prices[0]?.amount / 100 || 0;

  console.log(`[Sync] Checking for existing product with Square ID: ${squareItem.id}`);

  // Check if product already exists in Sanity
  const existingProductQuery = `*[_type == "products" && stripeProductId == $stripeProductId][0] {
    _id,
    stripeProductId,
    prices,
    name,
    price,
    currentlyDiscounted,
    subtitle,
    description,
    primaryImage,
    additionalImages,
    isFeatured
  }`;

  const existingProduct = await writeClient.fetch<SanityProduct | null>(
    existingProductQuery,
    { stripeProductId: squareItem.id }
  );

  if (existingProduct) {
    console.log(`✅ [SYNC] Found existing product in Sanity:`, {
      sanityId: existingProduct._id,
      squareItemId: existingProduct.stripeProductId,
      name: existingProduct.name,
    });
  } else {
    console.log(`🆕 [SYNC] No existing product found, will create new one`);
  }

  const productData = {
    _type: "products",
    stripeProductId: squareItem.id,
    prices: prices,
    name: itemData.name || "Unnamed Product",
    price: basePrice,
    isFeatured: false, // Default to not featured, can be updated manually in Sanity
  };

  // Get image URLs from Square (need to fetch them separately)
  let imageUrls: string[] = [];
  if (itemData.imageIds && itemData.imageIds.length > 0) {
    try {
      const { getSquareClient } = await import("@/lib/square/client");
      const client = getSquareClient();
      const imageResult = await client.catalog.batchRetrieveCatalogObjects({
        objectIds: itemData.imageIds,
      });
      imageUrls = (imageResult.result.objects || [])
        .filter(obj => obj.imageData?.url)
        .map(obj => obj.imageData!.url!);
    } catch (error) {
      console.error(`[Sync] Failed to fetch images for ${squareItem.id}:`, error);
    }
  }

  if (existingProduct) {
    // Update existing product
    const updateData: Record<string, any> = {
      prices: productData.prices,
      name: productData.name,
      price: productData.price,
    };

    // Always sync subtitle from Square description
    if (itemData.description) {
      updateData.subtitle = itemData.description;
      console.log(`Syncing subtitle from Square for product ${squareItem.id}`);
    }

    // Handle primary image sync from Square
    if (imageUrls.length > 0) {
      const firstImageUrl = imageUrls[0];
      console.log(`[Sync] Syncing primary image from Square for product ${squareItem.id}`);

      const uploadedImage = await uploadImageToSanity(
        firstImageUrl,
        itemData.name || "Product"
      );

      if (uploadedImage) {
        updateData.primaryImage = uploadedImage;
        console.log(`[Sync] ✅ Successfully synced primary image for product ${squareItem.id}`);
      } else {
        console.warn(`[Sync] ⚠️ Failed to sync primary image for product ${squareItem.id}`);
      }
    }

    await writeClient
      .patch(existingProduct._id)
      .set(updateData)
      .commit();

    console.log(`[Sync] ✅ Successfully updated product ${squareItem.id} (${existingProduct._id})`);
  } else {
    // Create new product
    const documentId = `square-${squareItem.id}`;

    console.log(`🆕 [SYNC] Creating new product with deterministic ID:`, {
      documentId,
      squareItemId: squareItem.id,
      name: itemData.name,
    });

    const newProduct: any = {
      _id: documentId,
      ...productData,
    };

    // Add subtitle from Square description
    if (itemData.description) {
      newProduct.subtitle = itemData.description;
    }

    // Sync primary image from Square
    if (imageUrls.length > 0) {
      const firstImageUrl = imageUrls[0];
      console.log(`[Sync] Syncing primary image from Square for new product ${squareItem.id}`);

      const uploadedImage = await uploadImageToSanity(
        firstImageUrl,
        itemData.name || "Product"
      );

      if (uploadedImage) {
        newProduct.primaryImage = uploadedImage;
        console.log(`[Sync] ✅ Successfully synced primary image for new product ${squareItem.id}`);
      } else {
        console.warn(`[Sync] ⚠️ Failed to sync primary image for new product ${squareItem.id}`);
      }
    } else {
      console.warn(`[Sync] ⚠️ No images found in Square for product ${squareItem.id}`);
    }

    // Use createIfNotExists to prevent race conditions
    try {
      await writeClient.createIfNotExists(newProduct);
      console.log(`✅ [SYNC] Successfully created new product in Sanity:`, {
        squareItemId: squareItem.id,
        sanityDocumentId: documentId,
        name: itemData.name,
      });
    } catch (error) {
      console.error(`❌ [SYNC] Failed to create product ${squareItem.id}:`, error);
      throw error;
    }
  }

  console.log(`✅ [SYNC END] Completed sync for product ${squareItem.id}\n`);
}

/**
 * Delete (or archive) a product from Sanity when deleted in Square
 */
export async function removeSquareProductFromSanity(
  squareItemId: string
): Promise<void> {
  const writeClient = getWriteClient();
  const existingProduct = await getProductByStripeId(squareItemId);

  if (existingProduct) {
    // Option 1: Delete the product
    await writeClient.delete(existingProduct._id);
    console.log(`Deleted product ${squareItemId} from Sanity`);

    // Option 2: Archive instead of delete (uncomment if preferred)
    // await writeClient
    //   .patch(existingProduct._id)
    //   .set({ archived: true })
    //   .commit();
    // console.log(`Archived product ${squareItemId} in Sanity`);
  }
}

/**
 * Fix all products with missing _key properties in descriptions
 * Call this function once to repair existing products
 */
export async function fixAllProductDescriptionKeys(): Promise<void> {
  const writeClient = getWriteClient();
  const products = await getAllProducts();

  let fixedCount = 0;

  for (const product of products) {
    if (product.description && Array.isArray(product.description)) {
      const hasInvalidKeys = product.description.some(
        (block: any) =>
          !block._key ||
          (block.children &&
            block.children.some((child: any) => !child._key))
      );

      if (hasInvalidKeys) {
        console.log(`Fixing description keys for product ${product._id}`);

        const fixedDescription = product.description.map((block: any) => ({
          ...block,
          _key: block._key || generateKey(),
          children: block.children?.map((child: any) => ({
            ...child,
            _key: child._key || generateKey(),
            marks: child.marks || [],
          })),
          markDefs: block.markDefs || [],
          style: block.style || "normal",
        }));

        await writeClient
          .patch(product._id)
          .set({ description: fixedDescription })
          .commit();

        fixedCount++;
      }
    }
  }

  console.log(`Fixed ${fixedCount} product(s) with invalid description keys`);
}

/**
 * Remove duplicate products with the same stripeProductId
 * Keeps the most recently updated product, deletes the rest
 */
export async function removeDuplicateProducts(): Promise<void> {
  const writeClient = getWriteClient();

  // Find all products grouped by stripeProductId
  const query = `*[_type == "products"] {
    _id,
    _updatedAt,
    stripeProductId,
    name
  }`;

  const allProducts = await writeClient.fetch<
    Array<{
      _id: string;
      _updatedAt: string;
      stripeProductId: string;
      name: string;
    }>
  >(query);

  // Group by stripeProductId
  const groupedByStripeId = new Map<
    string,
    Array<{ _id: string; _updatedAt: string; name: string }>
  >();

  for (const product of allProducts) {
    if (!groupedByStripeId.has(product.stripeProductId)) {
      groupedByStripeId.set(product.stripeProductId, []);
    }
    groupedByStripeId
      .get(product.stripeProductId)!
      .push({
        _id: product._id,
        _updatedAt: product._updatedAt,
        name: product.name,
      });
  }

  let duplicatesRemoved = 0;

  // For each group, keep the most recent, delete the rest
  for (const [stripeProductId, products] of groupedByStripeId.entries()) {
    if (products.length > 1) {
      // Sort by _updatedAt descending (most recent first)
      products.sort(
        (a, b) =>
          new Date(b._updatedAt).getTime() - new Date(a._updatedAt).getTime()
      );

      const [keepProduct, ...duplicates] = products;

      console.log(
        `[Cleanup] Found ${duplicates.length} duplicate(s) for ${stripeProductId}`
      );
      console.log(`[Cleanup] Keeping: ${keepProduct._id} (${keepProduct.name})`);

      for (const duplicate of duplicates) {
        console.log(
          `[Cleanup] Deleting duplicate: ${duplicate._id} (${duplicate.name})`
        );
        await writeClient.delete(duplicate._id);
        duplicatesRemoved++;
      }
    }
  }

  console.log(`[Cleanup] ✅ Removed ${duplicatesRemoved} duplicate product(s)`);
}
