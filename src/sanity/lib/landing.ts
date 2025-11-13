import type { Landing } from "../../../sanity.types";
import { client } from "./client";

export async function getLandingData(): Promise<Landing | null> {
  const query = `*[_type == "landing"][0] {
    _id,
    desktopImage,
    mobileImage,
    imageText,
    promoText,
    shopAllText
  }`;

  const landing = await client.fetch<Landing | null>(
    query,
    {},
    {
      next: {
        revalidate: 60, // Revalidate every 60 seconds
        tags: ["landing"],
      },
    },
  );

  return landing;
}
