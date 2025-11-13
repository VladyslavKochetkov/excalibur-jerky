import { defineType } from "sanity";

export const productsType = defineType({
  name: "products",
  title: "Products",
  type: "document",
  fieldsets: [
    {
      name: "stripe_noedit",
      description:
        "The following items are read from Stripe and cannot be edited. To update these values please update them in Stripe.",
      title: "Stripe Fields",
      options: { collapsible: true },
    },
  ],
  fields: [
    {
      name: "stripeProductId",
      title: "Product ID",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.required(),
      description:
        "Stripe product ID (e.g., prod_xxx). Synced from Stripe - do not edit manually.",
      fieldset: "stripe_noedit",
    },
    {
      name: "stripePriceId",
      fieldset: "stripe_noedit",
      title: "Price ID",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.required(),
      description:
        "Stripe price ID (e.g., price_xxx). Synced from Stripe - do not edit manually.",
    },
    {
      name: "name",
      fieldset: "stripe_noedit",
      title: "Product Name",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.required().max(200),
      description: "Product name synced from Stripe - do not edit manually.",
    },
    {
      name: "price",
      fieldset: "stripe_noedit",
      title: "Sale Price (USD)",
      type: "number",
      readOnly: true,
      validation: (Rule) => Rule.required().min(0),
      description:
        "Current sale price synced from Stripe - do not edit manually.",
    },
    {
      name: "originalPrice",
      title: "Original Price (USD)",
      type: "number",
      validation: (Rule) =>
        Rule.optional()
          .min(0)
          .custom((originalPrice, context) => {
            const document = context.document as { price?: number };
            const salePrice = document?.price;

            if (
              originalPrice !== undefined &&
              originalPrice !== null &&
              typeof originalPrice === "number"
            ) {
              if (
                salePrice === undefined ||
                salePrice === null ||
                typeof salePrice !== "number"
              ) {
                return "Sale price must be set before adding an original price";
              }
              if (originalPrice <= salePrice) {
                return `Original price ($${originalPrice.toFixed(2)}) must be greater than sale price ($${salePrice.toFixed(2)})`;
              }
            }
            return true;
          }),
      description:
        "Optional: Set a higher original price to show this product as on sale. Must be greater than the sale price.",
    },
    {
      name: "subtitle",
      title: "Subtitle",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.optional().max(500),
      description:
        "Short product subtitle/tagline. Initially synced from Stripe description but can be edited here.",
    },
    {
      name: "description",
      title: "Description",
      type: "array",
      of: [
        {
          type: "block",
        },
      ],
      description:
        "Rich text description of the product. This field is managed in Sanity only and will never be overwritten by Stripe.",
    },
    {
      name: "primaryImage",
      title: "Primary Product Image",
      type: "image",
      readOnly: true,
      fieldset: "stripe_noedit",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          title: "Alt Text",
          type: "string",
          description: "Alternative text for accessibility",
        },
      ],
      validation: (Rule) => Rule.optional(),
      description:
        "Primary product image automatically synced from Stripe. To change this image, update it in Stripe and the webhook will automatically sync it here.",
    },
    {
      name: "additionalImages",
      title: "Additional Images",
      type: "array",
      of: [
        {
          type: "image",
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: "alt",
              title: "Alt Text",
              type: "string",
              description: "Alternative text for accessibility",
            },
          ],
        },
      ],
      validation: (Rule) => Rule.optional(),
      description:
        "Additional product images for gallery view (optional). Add multiple angles, close-ups, etc.",
    },
    {
      name: "isFeatured",
      title: "Featured Product",
      type: "boolean",
      initialValue: false,
      description: "Display this product prominently on the catalog page",
    },
  ],
  preview: {
    select: {
      title: "name",
      price: "price",
      originalPrice: "originalPrice",
      isFeatured: "isFeatured",
      media: "primaryImage",
    },
    prepare({ title, price, originalPrice, isFeatured, media }) {
      const priceDisplay = originalPrice
        ? `$${price?.toFixed(2) || "0.00"} (was $${originalPrice.toFixed(2)})`
        : `$${price?.toFixed(2) || "0.00"}`;

      return {
        title: title,
        subtitle: `${priceDisplay} ${isFeatured ? "⭐ Featured" : ""}`,
        media: media,
      };
    },
  },
});
