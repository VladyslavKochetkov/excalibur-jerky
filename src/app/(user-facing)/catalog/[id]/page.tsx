import { PortableText } from "@portabletext/react";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartValidator } from "@/components/CartValidator";
import { ProductAddToCart } from "@/components/ProductAddToCart";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { urlFor } from "@/sanity/lib/image";
import { getMergedProducts } from "@/sanity/lib/products";

// Custom components to support all block types
const portableTextComponents = {
  block: {
    normal: ({ children }: any) => {
      // Check if the block is empty or only contains whitespace
      const isEmpty = !children || (Array.isArray(children) && children.every((child: any) =>
        typeof child === 'string' ? !child.trim() : false
      ));

      // Render empty blocks as a line break
      if (isEmpty) {
        return <p className="h-4">&nbsp;</p>;
      }

      return <p>{children}</p>;
    },
    h1: ({ children }: any) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-bold mt-5 mb-3">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-lg font-semibold mt-3 mb-2">{children}</h4>,
    h5: ({ children }: any) => <h5 className="text-base font-semibold mt-2 mb-1">{children}</h5>,
    h6: ({ children }: any) => <h6 className="text-sm font-semibold mt-2 mb-1">{children}</h6>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-bold">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
    code: ({ children }: any) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
    ),
    link: ({ children, value }: any) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }: any) => <ul className="list-disc list-inside my-4 space-y-2">{children}</ul>,
    number: ({ children }: any) => <ol className="list-decimal list-inside my-4 space-y-2">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: any) => <li>{children}</li>,
    number: ({ children }: any) => <li>{children}</li>,
  },
};

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Generate static params for all product pages at build time
 * This enables Static Site Generation (SSG) for product detail pages
 */
export async function generateStaticParams() {
  console.log("🏗️  [BUILD] Generating static params for product pages...");

  const products = await getMergedProducts();

  console.log(`📦 [BUILD] Found ${products.length} products to pre-render`);

  return products.map((product) => ({
    id: product._id,
  }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  "use cache";
  cacheTag("product");
  cacheLife("hours");

  const { id } = await params;

  console.log(`\n🔍 [PRODUCT PAGE] Looking for product with ID: ${id}`);

  // Fetch all products
  const mergedProducts = await getMergedProducts();

  console.log(`📦 [PRODUCT PAGE] Total products available: ${mergedProducts.length}`);
  console.log(`📋 [PRODUCT PAGE] All product IDs:`, mergedProducts.map(p => ({ id: p._id, name: p.name, stripeId: p.stripeProductId })));

  // Find the product by ID
  const product = mergedProducts.find((p) => p._id === id);

  if (!product) {
    console.error(`❌ [PRODUCT PAGE] Product not found! Looking for ID: ${id}`);
    console.error(`Available IDs:`, mergedProducts.map(p => p._id));
    notFound();
  }

  console.log(`✅ [PRODUCT PAGE] Found product:`, {
    id: product._id,
    name: product.name,
    stripeProductId: product.stripeProductId,
    source: product.source,
  });

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

  // Use Stripe images directly (Sanity primary image is synced with Stripe)
  const additionalSanityImages = product.additionalImages?.map((img) =>
    urlFor(img).width(800).height(800).url(),
  ) || [];

  const allImages = [
    ...(product.stripeImages || []),
    ...additionalSanityImages,
  ].filter(Boolean) as string[];
  const inStock = product.inventory?.available ?? false;

  // Transform product with image URL for components
  const transformedProduct = {
    ...product,
    primaryImageUrl,
    primaryImageAlt: product.primaryImage?.alt || product.name,
  };

  // Transform all products for CartValidator
  const transformedProducts = mergedProducts.map((p) => {
    let imgUrl = "";
    if (p.primaryImage) {
      if (p.primaryImage.url) {
        imgUrl = p.primaryImage.url;
      } else if (p.primaryImage.asset) {
        imgUrl = urlFor(p.primaryImage).width(800).height(800).url();
      }
    } else if (p.stripeImages && p.stripeImages.length > 0) {
      imgUrl = p.stripeImages[0];
    }
    return {
      ...p,
      primaryImageUrl: imgUrl,
    };
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CartValidator products={transformedProducts} />
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
              {product.currentlyDiscounted &&
                product.currentlyDiscounted > 0 && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ${(product.price / (1 - product.currentlyDiscounted / 100)).toFixed(2)}
                    </span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                      {product.currentlyDiscounted}% OFF
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
                    In Stock
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
            <ProductAddToCart product={transformedProduct} />

            {/* Description */}
            {product.description && product.description.length > 0 && (
              <div className="pt-6 border-t border-border">
                <h2 className="text-xl font-bold mb-4">Description</h2>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <PortableText
                    value={product.description as any}
                    components={portableTextComponents}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
