import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { urlFor } from "@/sanity/lib/image";
import { getLandingData } from "@/sanity/lib/landing";
import { getMergedProducts } from "@/sanity/lib/products";

export default async function Home() {
  "use cache";
  cacheTag("home");
  cacheLife("hours");

  const [landing, mergedProducts] = await Promise.all([
    getLandingData(),
    getMergedProducts(),
  ]);

  if (!landing) {
    return <div className="h-screen">No landing page data found</div>;
  }

  const desktopImageUrl = landing.desktopImage
    ? urlFor(landing.desktopImage).width(2000).fit("max").url()
    : "";
  const mobileImageUrl = landing.mobileImage
    ? urlFor(landing.mobileImage).width(800).fit("max").url()
    : "";

  const [imageTextL1, imageTextL2] = (landing.imageText || "").split("\n");

  console.log({ mergedProducts });

  // Filter and transform featured products
  const featuredProducts = mergedProducts
    .filter((product) => product.isFeatured)
    .map((product) => {
      // Build primary image
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

      return {
        ...product,
        primaryImageUrl,
        primaryImageAlt: product.primaryImage?.alt || product.name,
        additionalImageUrls,
      };
    });

  return (
    <>
      {/* Hero Section */}
      <div className="relative w-full h-screen overflow-hidden bg-background">
        {/* Background image */}
        <picture className="absolute inset-0 z-0">
          <source media="(min-aspect-ratio: 1/1)" srcSet={desktopImageUrl} />
          <source media="(max-aspect-ratio: 1/1)" srcSet={mobileImageUrl} />
          <img
            src={desktopImageUrl}
            alt={landing.imageText || "Landing"}
            className="w-full h-full object-cover object-top md:object-center"
          />
        </picture>

        {/* Content - determines container size */}
        <div className="relative z-10 h-full flex flex-col items-center justify-end text-white bg-linear-to-t from-background/50 to-background/0">
        {(imageTextL1 || imageTextL2) && (
          <div className="w-full mb-8 overflow-visible">
            <svg
              viewBox="0 -100 1200 450"
              className="w-full h-auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>
                {[imageTextL1, imageTextL2].filter(Boolean).join(" ")}
              </title>
              <defs>
                <path
                  id="curve1"
                  d="M 50 80 Q 600 200 1150 80"
                  fill="transparent"
                />
                <path
                  id="curve2"
                  d="M 50 210 Q 600 310 1150 210"
                  fill="transparent"
                />
              </defs>

              {imageTextL1 && (
                <>
                  {/* L1 Outer stroke (red) */}
                  <text
                    fontSize="200"
                    fontWeight="900"
                    fontFamily="var(--font-medieval-mystery), cursive"
                    fill="none"
                    stroke="#DB3E30"
                    strokeWidth="16"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  >
                    <textPath
                      href="#curve1"
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {imageTextL1}
                    </textPath>
                  </text>

                  {/* L1 Inner stroke (beige) */}
                  <text
                    fontSize="200"
                    fontWeight="900"
                    fontFamily="var(--font-medieval-mystery), cursive"
                    fill="none"
                    stroke="#DFD8B5"
                    strokeWidth="8"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  >
                    <textPath
                      href="#curve1"
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {imageTextL1}
                    </textPath>
                  </text>

                  {/* L1 Fill (black) */}
                  <text
                    fontSize="200"
                    fontWeight="900"
                    fontFamily="var(--font-medieval-mystery), cursive"
                    fill="#000"
                  >
                    <textPath
                      href="#curve1"
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {imageTextL1}
                    </textPath>
                  </text>
                </>
              )}

              {imageTextL2 && (
                <>
                  {/* L2 Outer stroke (red) */}
                  <text
                    fontSize="120"
                    fontWeight="900"
                    fontFamily="var(--font-medieval-mystery), cursive"
                    fill="none"
                    stroke="#DB3E30"
                    strokeWidth="12"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  >
                    <textPath
                      href="#curve2"
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {imageTextL2}
                    </textPath>
                  </text>

                  {/* L2 Inner stroke (beige) */}
                  <text
                    fontSize="120"
                    fontWeight="900"
                    fontFamily="var(--font-medieval-mystery), cursive"
                    fill="none"
                    stroke="#DFD8B5"
                    strokeWidth="6"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  >
                    <textPath
                      href="#curve2"
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {imageTextL2}
                    </textPath>
                  </text>

                  {/* L2 Fill (black) */}
                  <text
                    fontSize="120"
                    fontWeight="900"
                    fontFamily="var(--font-medieval-mystery), cursive"
                    fill="#000"
                  >
                    <textPath
                      href="#curve2"
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {imageTextL2}
                    </textPath>
                  </text>
                </>
              )}
            </svg>
          </div>
        )}
        <div className="relative w-full flex flex-col items-center pb-10 mt-20">
          <div className="z-0 absolute top-0 left-0 h-full w-full from-t to-b bg-linear-to-b from-black/0 to-black/40"></div>
          <h1 className="z-10 text-2xl sm:text-4xl md:text-5xl font-bold mb-6 md:mb-8 text-center">
            {landing.promoText}
          </h1>
          <Link href="/catalog" className="z-10">
            <button
              type="button"
              className="px-6 py-3 md:px-8 md:py-4 bg-white text-black font-semibold rounded hover:bg-gray-100 transition text-sm md:text-base"
            >
              {landing.shopAllText}
            </button>
          </Link>
        </div>
      </div>
    </div>

    {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="relative bg-background py-16 px-4">
          <div className="container mx-auto max-w-7xl">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 font-[family-name:var(--font-medieval-mystery)]">
                Featured Products
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover our most popular selections
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* View All Link */}
            <div className="text-center">
              <Link
                href="/catalog"
                className="inline-block px-8 py-3 bg-white text-black font-semibold rounded hover:bg-gray-100 transition"
              >
                View All Products
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
