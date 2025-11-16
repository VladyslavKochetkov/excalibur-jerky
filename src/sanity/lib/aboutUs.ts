import type { AboutUs } from "../../../sanity.types";
import { client } from "./client";

export async function getAboutUsData(): Promise<AboutUs | null> {
  const query = `*[_type == "aboutUs"][0] {
    _id,
    pageTitle,
    pageSubtitle,
    storyTitle,
    storyContent,
    commitmentTitle,
    commitmentItems,
    whyChooseTitle,
    whyChooseContent,
    ctaTitle,
    ctaButtonText
  }`;

  const aboutUs = await client.fetch<AboutUs | null>(
    query,
    {},
    {
      next: {
        revalidate: 60, // Revalidate every 60 seconds
        tags: ["aboutUs"],
      },
    },
  );

  return aboutUs;
}
