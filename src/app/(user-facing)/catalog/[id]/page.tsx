import { PortableText } from "@portabletext/react";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartValidator } from "@/components/CartValidator";
import { ProductAddToCart } from "@/components/ProductAddToCart";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { urlFor } from "@/sanity/lib/image";
import { getMergedProducts } from "@/sanity/lib/products";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  "use cache";
  cacheTag("product");
  cacheLife("hours");

  const { id } = await params;

  // Fetch all products
  const mergedProducts = await getMergedProducts();

  // Find the product by ID
  const product = mergedProducts.find((p) => p._id === id);

  if (!product) {
    notFound();
  }

  // Transform product with image URLs
  let primaryImageUrl = "";
  if (product.primaryImage) {
    if (product.primaryImage.url) {
      // Stripe image URL
      primaryImageUrl = product.primaryImage.url;
    } else if (product.primaryImage.asset) {
      // Sanity image
      primaryImageUrl = urlFor(product.primaryImage)
        .width(800)
        .height(800)
        .url();
    }
  } else if (product.stripeImages && product.stripeImages.length > 0) {
    // Fallback to first Stripe image
    primaryImageUrl = product.stripeImages[0];
  }

  // Build additional images (from Sanity + remaining Stripe images)
  const additionalImageUrls = [
    ...(product.additionalImages?.map((img) =>
      urlFor(img).width(800).height(800).url(),
    ) || []),
    ...(product.stripeImages?.slice(primaryImageUrl ? 0 : 1) || []),
  ];

  const allImages = [primaryImageUrl, ...additionalImageUrls].filter(
    Boolean,
  ) as string[];
  const inStock = product.inventory?.available ?? false;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CartValidator products={mergedProducts} />
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/catalog"
          className="mb-6 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>Back arrow</title>
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Catalog
        </Link>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images Section */}
          <ProductImageGallery
            images={allImages}
            productName={product.name}
            isFeatured={product.isFeatured}
          />

          {/* Product Info Section */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 font-medieval-mystery">
                {product.name}
              </h1>
              {product.subtitle && (
                <p className="text-lg text-muted-foreground">
                  {product.subtitle}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                      Save ${(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  </>
                )}
            </div>

            {/* Stock Status */}
            <div>
              {inStock ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-green-500 font-medium">
                    {product.inventory?.quantity !== null
                      ? `In Stock (${product.inventory.quantity} available)`
                      : "In Stock"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-destructive font-medium">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Quantity Selector & Add to Cart */}
            <ProductAddToCart product={product} />

            {/* Description */}
            {product.description && product.description.length > 0 && (
              <div className="pt-6 border-t border-border">
                <h2 className="text-xl font-bold mb-4">Description</h2>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <PortableText value={product.description as any} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
