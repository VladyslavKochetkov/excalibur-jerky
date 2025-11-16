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
      name: "prices",
      fieldset: "stripe_noedit",
      title: "Price Variants",
      type: "array",
      readOnly: true,
      of: [
        {
          type: "object",
          fields: [
            {
              name: "priceId",
              title: "Price ID",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "nickname",
              title: "Nickname (Size)",
              type: "string",
              description: "e.g., '4oz', '8oz', '12oz', '1 lb'",
            },
            {
              name: "amount",
              title: "Amount (cents)",
              type: "number",
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: "baseUnits",
              title: "Base Units Multiplier",
              type: "number",
              description:
                "Number of base units (4oz packages) this price represents",
              validation: (Rule) => Rule.required().min(1),
            },
          ],
          preview: {
            select: {
              nickname: "nickname",
              amount: "amount",
              baseUnits: "baseUnits",
            },
            prepare({ nickname, amount, baseUnits }) {
              const displayAmount = amount ? (amount / 100).toFixed(2) : "0.00";
              return {
                title: nickname || "No nickname",
                subtitle: `$${displayAmount} (${baseUnits}x base unit)`,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
      description:
        "Price variants for different sizes. Synced from Stripe - do not edit manually.",
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
      name: "currentlyDiscounted",
      title: "Currently Discounted (%)",
      type: "number",
      validation: (Rule) =>
        Rule.optional()
          .min(0)
          .max(100)
          .custom((discount, context) => {
            if (
              discount !== undefined &&
              discount !== null &&
              typeof discount === "number"
            ) {
              if (discount === 0) {
                return "If not discounted, leave this field empty instead of setting to 0";
              }
              if (discount >= 100) {
                return "Discount percentage must be less than 100%";
              }
            }
            return true;
          }),
      description:
        "Optional: Set discount percentage (e.g., 10 for 10% off). Original price will be calculated as: currentPrice / (1 - discount/100).",
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
      currentlyDiscounted: "currentlyDiscounted",
      isFeatured: "isFeatured",
      media: "primaryImage",
    },
    prepare({ title, price, currentlyDiscounted, isFeatured, media }) {
      let priceDisplay = `$${price?.toFixed(2) || "0.00"}`;

      if (currentlyDiscounted && currentlyDiscounted > 0) {
        const originalPrice = price / (1 - currentlyDiscounted / 100);
        priceDisplay = `$${price?.toFixed(2) || "0.00"} (was $${originalPrice.toFixed(2)}) - ${currentlyDiscounted}% off`;
      }

      return {
        title: title,
        subtitle: `${priceDisplay} ${isFeatured ? "⭐ Featured" : ""}`,
        media: media,
      };
    },
  },
});
