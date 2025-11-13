import type { Products } from "../../../sanity.types";
import { client } from "./client";
import { urlFor } from "./image";
import { getStripeProduct, getStripeProducts } from "@/lib/stripe/products";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";
import type Stripe from "stripe";

/**
 * Generate a random key for Sanity array items
 */
function generateKey(): string {
  return Math.random().toString(36).substring(2, 15);
}

export interface SanityProduct {
  _id: string;
  stripeProductId: string;
  stripePriceId: string;
  name: string;
  price: number;
  originalPrice?: number;
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
    stripePriceId,
    name,
    price,
    originalPrice,
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
    stripePriceId,
    name,
    price,
    originalPrice,
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
    stripePriceId,
    name,
    price,
    originalPrice,
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
    stripePriceId,
    name,
    price,
    originalPrice,
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
 * Fetch all products with inventory from Stripe
 */
export async function getProductsWithInventory(): Promise<
  ProductWithInventory[]
> {
  const products = await getAllProducts();

  // Fetch inventory from Stripe for each product
  const productsWithInventory = await Promise.all(
    products.map(async (product) => {
      const stripeProduct = await getStripeProduct(product.stripeProductId);

      return {
        ...product,
        inventory: stripeProduct?.inventory || {
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
  stripePriceId: string;
  name: string;
  price: number;
  originalPrice?: number;
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
  stripeImages?: string[]; // Additional Stripe image URLs
  isFeatured: boolean;
  inventory: {
    quantity: number | null;
    available: boolean;
  };
  source: "sanity" | "stripe"; // Track where the primary data came from
}

/**
 * Fetch all products from both Stripe and Sanity, merging them intelligently
 * - Products in both Stripe and Sanity: Use Sanity data with Stripe inventory
 * - Products only in Stripe: Use Stripe data
 */
export async function getMergedProducts(): Promise<MergedProduct[]> {
  // Fetch from both sources in parallel
  const [stripeProducts, sanityProducts] = await Promise.all([
    getStripeProducts(),
    getAllProducts(),
  ]);

  // Create a map of Sanity products by Stripe Product ID for quick lookup
  const sanityProductMap = new Map(
    sanityProducts.map((product) => [product.stripeProductId, product])
  );

  // Merge the products
  const mergedProducts: MergedProduct[] = stripeProducts.map((stripeProduct) => {
    const sanityProduct = sanityProductMap.get(stripeProduct.id);

    if (sanityProduct) {
      // Product exists in both: use Sanity data with Stripe inventory
      return {
        _id: sanityProduct._id,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripeProduct.priceId,
        name: sanityProduct.name,
        price: sanityProduct.price,
        originalPrice: sanityProduct.originalPrice,
        subtitle: sanityProduct.subtitle,
        description: sanityProduct.description,
        primaryImage: sanityProduct.primaryImage,
        additionalImages: sanityProduct.additionalImages,
        stripeImages: stripeProduct.images, // Keep Stripe images for fallback
        isFeatured: sanityProduct.isFeatured,
        inventory: stripeProduct.inventory,
        source: "sanity",
      };
    } else {
      // Product only exists in Stripe: use Stripe data
      const firstImage = stripeProduct.images[0];
      return {
        _id: `stripe-${stripeProduct.id}`, // Generate a temporary ID
        stripeProductId: stripeProduct.id,
        stripePriceId: stripeProduct.priceId,
        name: stripeProduct.name,
        price: stripeProduct.price,
        originalPrice: undefined,
        subtitle: stripeProduct.description || undefined,
        description: undefined,
        primaryImage: firstImage
          ? { url: firstImage, alt: stripeProduct.name }
          : undefined,
        additionalImages: undefined,
        stripeImages: stripeProduct.images.slice(1), // Rest of images
        isFeatured: false,
        inventory: stripeProduct.inventory,
        source: "stripe",
      };
    }
  });

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
 * Sync a Stripe product to Sanity
 * Creates or updates the product in Sanity based on Stripe data
 */
export async function syncStripeProductToSanity(
  stripeProduct: Stripe.Product
): Promise<void> {
  const writeClient = getWriteClient();

  // Get the default price
  const defaultPrice = stripeProduct.default_price as Stripe.Price | null;

  if (!defaultPrice) {
    console.warn(`Product ${stripeProduct.id} has no default price, skipping sync`);
    return;
  }

  const priceId = typeof defaultPrice === "string" ? defaultPrice : defaultPrice.id;
  const unitAmount = typeof defaultPrice === "string"
    ? 0
    : (defaultPrice.unit_amount || 0) / 100;

  console.log(`[Sync] Checking for existing product with Stripe ID: ${stripeProduct.id}`);

  // Check if product already exists in Sanity
  // Use a fresh query without CDN caching to ensure we get the latest data
  const existingProductQuery = `*[_type == "products" && stripeProductId == $stripeProductId][0] {
    _id,
    stripeProductId,
    stripePriceId,
    name,
    price,
    originalPrice,
    subtitle,
    description,
    primaryImage,
    additionalImages,
    isFeatured
  }`;

  const existingProduct = await writeClient.fetch<SanityProduct | null>(
    existingProductQuery,
    { stripeProductId: stripeProduct.id }
  );

  if (existingProduct) {
    console.log(`[Sync] Found existing product: ${existingProduct._id} (${existingProduct.name})`);
  } else {
    console.log(`[Sync] No existing product found, will create new one`);
  }

  const productData = {
    _type: "products",
    stripeProductId: stripeProduct.id,
    stripePriceId: priceId,
    name: stripeProduct.name,
    price: unitAmount,
    isFeatured: false, // Default to not featured, can be updated manually in Sanity
  };

  if (existingProduct) {
    // Update existing product
    const updateData: Record<string, any> = {
      stripePriceId: productData.stripePriceId,
      name: productData.name,
      price: productData.price,
    };

    // Always sync subtitle from Stripe description
    if (stripeProduct.description) {
      updateData.subtitle = stripeProduct.description;
      console.log(`Syncing subtitle from Stripe for product ${stripeProduct.id}`);
    }

    // Note: The rich text 'description' field is managed in Sanity only and is never synced from Stripe

    // Handle primary image sync from Stripe
    // Always sync the image from Stripe to keep it up to date
    if (stripeProduct.images && stripeProduct.images.length > 0) {
      const firstImageUrl = stripeProduct.images[0];
      console.log(`[Sync] Syncing primary image from Stripe for product ${stripeProduct.id}`);

      const uploadedImage = await uploadImageToSanity(
        firstImageUrl,
        stripeProduct.name
      );

      if (uploadedImage) {
        updateData.primaryImage = uploadedImage;
        console.log(`[Sync] ✅ Successfully synced primary image for product ${stripeProduct.id}`);
      } else {
        console.warn(`[Sync] ⚠️ Failed to sync primary image for product ${stripeProduct.id}`);
      }
    }

    await writeClient
      .patch(existingProduct._id)
      .set(updateData)
      .commit();

    console.log(`[Sync] ✅ Successfully updated product ${stripeProduct.id} (${existingProduct._id})`);
  } else {
    // Create new product
    // Use a deterministic _id based on Stripe product ID to prevent duplicates
    const documentId = `stripe-product-${stripeProduct.id}`;

    console.log(`[Sync] Creating new product with ID: ${documentId}`);

    const newProduct: any = {
      _id: documentId,
      ...productData,
    };

    // Add subtitle from Stripe description
    if (stripeProduct.description) {
      newProduct.subtitle = stripeProduct.description;
    }

    // Sync primary image from Stripe
    if (stripeProduct.images && stripeProduct.images.length > 0) {
      const firstImageUrl = stripeProduct.images[0];
      console.log(`[Sync] Syncing primary image from Stripe for new product ${stripeProduct.id}`);

      const uploadedImage = await uploadImageToSanity(
        firstImageUrl,
        stripeProduct.name
      );

      if (uploadedImage) {
        newProduct.primaryImage = uploadedImage;
        console.log(`[Sync] ✅ Successfully synced primary image for new product ${stripeProduct.id}`);
      } else {
        console.warn(`[Sync] ⚠️ Failed to sync primary image for new product ${stripeProduct.id}`);
      }
    } else {
      console.warn(`[Sync] ⚠️ No images found in Stripe for product ${stripeProduct.id}`);
    }

    // Use createIfNotExists to prevent race conditions
    try {
      await writeClient.createIfNotExists(newProduct);
      console.log(`[Sync] ✅ Successfully created new product ${stripeProduct.id} (${documentId})`);
    } catch (error) {
      console.error(`[Sync] ❌ Failed to create product ${stripeProduct.id}:`, error);
      throw error;
    }
  }
}

/**
 * Delete (or archive) a product from Sanity when deleted in Stripe
 */
export async function removeStripeProductFromSanity(
  stripeProductId: string
): Promise<void> {
  const writeClient = getWriteClient();
  const existingProduct = await getProductByStripeId(stripeProductId);

  if (existingProduct) {
    // Option 1: Delete the product
    await writeClient.delete(existingProduct._id);
    console.log(`Deleted product ${stripeProductId} from Sanity`);

    // Option 2: Archive instead of delete (uncomment if preferred)
    // await writeClient
    //   .patch(existingProduct._id)
    //   .set({ archived: true })
    //   .commit();
    // console.log(`Archived product ${stripeProductId} in Sanity`);
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
