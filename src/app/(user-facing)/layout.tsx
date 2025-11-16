import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Toaster } from "sonner";
import { Providers } from "../../components/Providers";
import { Footer } from "../../components/sections/Footer";
import { Header } from "../../components/sections/Header";
import { urlFor } from "../../sanity/lib/image";
import { getLandingData } from "../../sanity/lib/landing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const landingData = await getLandingData();

  // Generate OG image URL from Sanity hero image
  const ogImageUrl = landingData?.desktopImage
    ? urlFor(landingData.desktopImage)
        .width(1200)
        .height(630)
        .fit("crop")
        .quality(90)
        .url()
    : "/og-image.jpg"; // Fallback image

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "https://excaliburjerky.com",
    ),

    title: {
      default: "Excalibur Jerky Co. - Premium Artisan Beef Jerky",
      template: "%s | Excalibur Jerky Co.",
    },

    description:
      "Discover premium artisan beef jerky from Excalibur Jerky Co. Handcrafted with the finest ingredients, available in multiple sizes (4oz, 8oz, 12oz, 1lb). Order your favorite gourmet jerky online today.",

    keywords: [
      "beef jerky",
      "artisan jerky",
      "premium jerky",
      "gourmet beef jerky",
      "handcrafted jerky",
      "buy jerky online",
      "protein snacks",
      "Excalibur Jerky",
      "jerky subscription",
      "natural beef jerky",
    ],

    authors: [{ name: "Excalibur Jerky Co." }],
    creator: "Excalibur Jerky Co.",
    publisher: "Excalibur Jerky Co.",

    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    openGraph: {
      type: "website",
      locale: "en_US",
      url: "/",
      siteName: "Excalibur Jerky Co.",
      title: "Excalibur Jerky Co. - Premium Artisan Beef Jerky",
      description:
        "Discover premium artisan beef jerky from Excalibur Jerky Co. Handcrafted with the finest ingredients, available in multiple sizes. Order your favorite gourmet jerky online today.",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Excalibur Jerky Co. - Premium Artisan Beef Jerky",
        },
      ],
    },

    // twitter: {
    //   card: "summary_large_image",
    //   title: "Excalibur Jerky Co. - Premium Artisan Beef Jerky",
    //   description:
    //     "Discover premium artisan beef jerky handcrafted with the finest ingredients. Available in multiple sizes.",
    //   images: [ogImageUrl],
    //   creator: "@excaliburjerky", // Update with actual Twitter handle
    //   site: "@excaliburjerky", // Update with actual Twitter handle
    // },

    verification: {
      // google: "your-google-verification-code", // Add when you verify with Google Search Console
      // yandex: "your-yandex-verification-code",
      // yahoo: "your-yahoo-verification-code",
    },

    category: "food & beverage",

    alternates: {
      canonical: "/",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
