import { defineType } from "sanity";

export const aboutUsType = defineType({
  name: "aboutUs",
  title: "About Us Page",
  type: "document",
  // Singleton document - only one about us page exists
  fields: [
    {
      name: "pageTitle",
      title: "Page Title",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
      description: "Main heading at the top of the page",
      initialValue: "About Us",
    },
    {
      name: "pageSubtitle",
      title: "Page Subtitle",
      type: "string",
      validation: (Rule) => Rule.required().max(200),
      description: "Subtitle below the main heading",
      initialValue: "Crafting legendary jerky since the beginning",
    },
    {
      name: "storyTitle",
      title: "Our Story - Section Title",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
      description: "Heading for the Our Story section",
      initialValue: "Our Story",
    },
    {
      name: "storyContent",
      title: "Our Story - Content",
      type: "array",
      of: [
        {
          type: "block",
          options: {
            spellCheck: true,
          }
        }
      ],
      validation: (Rule) => Rule.required(),
      description: "Main content for the Our Story section (supports rich text)",
    },
    {
      name: "commitmentTitle",
      title: "Commitment - Section Title",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
      description: "Heading for the Commitment section",
      initialValue: "Our Commitment",
    },
    {
      name: "commitmentItems",
      title: "Commitment Items",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "title",
              title: "Item Title",
              type: "string",
              validation: (Rule) => Rule.required().max(50),
            },
            {
              name: "description",
              title: "Item Description",
              type: "text",
              rows: 3,
              validation: (Rule) => Rule.required().max(300),
            },
          ],
          preview: {
            select: {
              title: "title",
              subtitle: "description",
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1).max(6),
      description: "Commitment value propositions (2-4 items recommended)",
    },
    {
      name: "whyChooseTitle",
      title: "Why Choose Us - Section Title",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
      description: "Heading for the Why Choose Us section",
      initialValue: "Why Choose Excalibur Jerky",
    },
    {
      name: "whyChooseContent",
      title: "Why Choose Us - Content",
      type: "array",
      of: [
        {
          type: "block",
          options: {
            spellCheck: true,
          }
        }
      ],
      validation: (Rule) => Rule.required(),
      description: "Main content for the Why Choose Us section (supports rich text)",
    },
    {
      name: "ctaTitle",
      title: "Call to Action - Title",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
      description: "Heading for the call to action section",
      initialValue: "Ready to Experience the Legend?",
    },
    {
      name: "ctaButtonText",
      title: "Call to Action - Button Text",
      type: "string",
      validation: (Rule) => Rule.required().max(50),
      description: "Text for the CTA button",
      initialValue: "Shop Our Collection",
    },
  ],
  preview: {
    select: {
      title: "pageTitle",
      subtitle: "pageSubtitle",
    },
    prepare({ title, subtitle }) {
      return {
        title: "About Us Page",
        subtitle: title || subtitle,
      };
    },
  },
});
