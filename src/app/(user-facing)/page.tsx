import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";
import { getLandingData } from "@/sanity/lib/landing";

export default async function Home() {
  const landing = await getLandingData();

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

  return (
    <div className="relative w-full overflow-hidden bg-background">
      {/* Background image */}
      <picture className="absolute inset-0 z-0">
        <source media="(min-aspect-ratio: 1/1)" srcSet={desktopImageUrl} />
        <source media="(max-aspect-ratio: 1/1)" srcSet={mobileImageUrl} />
        <img
          src={desktopImageUrl}
          alt={landing.imageText || "Landing"}
          className="w-full h-full object-cover"
        />
      </picture>

      {/* Content - determines container size */}
      <div className="relative z-10 flex flex-col items-center justify-end text-white pb-10 bg-linear-to-t from-background/50 to-background/0">
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
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6 md:mb-8 text-center">
          {landing.promoText} excalibur
        </h1>
        <Link href="/catalog">
          <button
            type="button"
            className="px-6 py-3 md:px-8 md:py-4 bg-white text-black font-semibold rounded hover:bg-gray-100 transition text-sm md:text-base"
          >
            {landing.shopAllText}
          </button>
        </Link>
      </div>
    </div>
  );
}
