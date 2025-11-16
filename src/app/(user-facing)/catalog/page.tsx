import { ProductCard } from "@/components/ProductCard";
import { urlFor } from "@/sanity/lib/image";
import { getMergedProducts } from "@/sanity/lib/products";
import { CartValidator } from "@/components/CartValidator";
import { cacheLife, cacheTag } from "next/cache";

export default async function CatalogPage() {
  "use cache";
  cacheTag("catalog");
  cacheLife("hours");

  const mergedProducts = await getMergedProducts();

  // Transform products with image URLs
  const products = mergedProducts.map((product) => {
    // Build primary image
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
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CartValidator products={products} />
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-[family-name:var(--font-medieval-mystery)]">
            Our Catalog
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our selection of premium jerky products
          </p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">
              No products available at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
