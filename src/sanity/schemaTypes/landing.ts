import { defineType } from "sanity";

export const landingType = defineType({
  name: "landing",
  title: "Landing Page",
  type: "document",
  // Singleton document - only one landing page exists
  fields: [
    {
      name: "desktopImage",
      title: "Desktop Image",
      type: "image",
      validation: (Rule) => Rule.required(),
      options: {
        hotspot: true,
      },
      description: "Image displayed on desktop devices",
    },
    {
      name: "mobileImage",
      title: "Mobile Image",
      type: "image",
      validation: (Rule) => Rule.required(),
      options: {
        hotspot: true,
      },
      description: "Image displayed on mobile devices",
    },
    {
      name: "imageText",
      title: "Image Text",
      type: "text",
      rows: 3,
      validation: [
        (Rule) => Rule.max(200),
        (Rule) =>
          Rule.custom((value: string) => {
            return value.toString().split("\n").length <= 2
              ? true
              : { message: "Text can only be two lines" };
          }),
      ],
      description:
        "Text that will appear on top of the image (supports two lines, first line large, second line smaller)",
    },
    {
      name: "promoText",
      title: "Promo Text",
      type: "string",
      validation: (Rule) => Rule.required().max(200),
      description: "Promotional text to display on the landing page",
    },
    {
      name: "shopAllText",
      title: "Shop All Text",
      type: "string",
      validation: (Rule) => Rule.required().max(50),
      description: "Text for the shop all button",
    },
  ],
  preview: {
    select: {
      title: "promoText",
      media: "backgroundImage",
    },
    prepare({ title, media }) {
      return {
        title: "Landing Page",
        subtitle: title,
        media: media,
      };
    },
  },
});
