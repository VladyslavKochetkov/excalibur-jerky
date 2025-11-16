import type { ContactUs } from "../../../sanity.types";
import { client } from "./client";

export async function getContactUsData(): Promise<ContactUs | null> {
  const query = `*[_type == "contactUs"][0] {
    _id,
    pageTitle,
    pageSubtitle,
    content
  }`;

  const contactUs = await client.fetch<ContactUs | null>(
    query,
    {},
    {
      next: {
        revalidate: 60, // Revalidate every 60 seconds
        tags: ["contactUs"],
      },
    },
  );

  return contactUs;
}
